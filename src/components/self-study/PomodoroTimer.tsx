import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type TimerState = "idle" | "running" | "paused";
type TimerMode = "working" | "break";

const WORKING_PRESETS = [25, 50];
const BREAK_PRESETS = [5, 10];

export const PomodoroTimer: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [mode, setMode] = useState<TimerMode>("working");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [customWorking, setCustomWorking] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [isCustomWorking, setIsCustomWorking] = useState(false);
  const [isCustomBreak, setIsCustomBreak] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notification sound (created on demand in playNotificationSound)
  useEffect(() => {
    audioRef.current = null;
  }, []);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  useEffect(() => {
    if (timerState === "running") {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState]);

  const handleTimerComplete = () => {
    setTimerState("idle");
    playNotificationSound();
    
    if (mode === "working") {
      toast.success("Working session completed! Time for a break.", {
        duration: 5000,
      });
      // Switch to break mode
      const breakTime = isCustomBreak ? customBreak : BREAK_PRESETS[0];
      setTimeLeft(breakTime * 60);
      setMode("break");
      setIsCustomWorking(false);
    } else {
      toast.success("Break completed! Ready to work again.", {
        duration: 5000,
      });
      // Switch to working mode
      const workTime = isCustomWorking ? customWorking : WORKING_PRESETS[0];
      setTimeLeft(workTime * 60);
      setMode("working");
      setIsCustomBreak(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    setTimerState("running");
  };

  const handlePause = () => {
    setTimerState("paused");
  };

  const handleStop = () => {
    setTimerState("idle");
    if (mode === "working") {
      const workTime = isCustomWorking ? customWorking : WORKING_PRESETS[0];
      setTimeLeft(workTime * 60);
    } else {
      const breakTime = isCustomBreak ? customBreak : BREAK_PRESETS[0];
      setTimeLeft(breakTime * 60);
    }
  };

  const handleReset = () => {
    setTimerState("idle");
    if (mode === "working") {
      const workTime = isCustomWorking ? customWorking : WORKING_PRESETS[0];
      setTimeLeft(workTime * 60);
    } else {
      const breakTime = isCustomBreak ? customBreak : BREAK_PRESETS[0];
      setTimeLeft(breakTime * 60);
    }
  };

  const handleWorkingPreset = (minutes: number) => {
    if (timerState === "idle" || timerState === "paused") {
      setTimeLeft(minutes * 60);
      setIsCustomWorking(false);
      setCustomWorking(minutes);
    }
  };

  const handleBreakPreset = (minutes: number) => {
    if (timerState === "idle" || timerState === "paused") {
      setTimeLeft(minutes * 60);
      setIsCustomBreak(false);
      setCustomBreak(minutes);
    }
  };

  const handleCustomWorking = () => {
    if (timerState === "idle" || timerState === "paused") {
      setIsCustomWorking(true);
      setTimeLeft(customWorking * 60);
    }
  };

  const handleCustomBreak = () => {
    if (timerState === "idle" || timerState === "paused") {
      setIsCustomBreak(true);
      setTimeLeft(customBreak * 60);
    }
  };

  const handleCustomWorkingChange = (value: number) => {
    if (value > 0 && value <= 120) {
      setCustomWorking(value);
      if (isCustomWorking && (timerState === "idle" || timerState === "paused")) {
        setTimeLeft(value * 60);
      }
    }
  };

  const handleCustomBreakChange = (value: number) => {
    if (value > 0 && value <= 30) {
      setCustomBreak(value);
      if (isCustomBreak && (timerState === "idle" || timerState === "paused")) {
        setTimeLeft(value * 60);
      }
    }
  };

  const handleSwitchMode = () => {
    // Stop timer if running
    if (timerState === "running") {
      setTimerState("paused");
    }
    
    // Switch mode and reset time
    if (mode === "working") {
      const breakTime = isCustomBreak ? customBreak : BREAK_PRESETS[0];
      setTimeLeft(breakTime * 60);
      setMode("break");
      setIsCustomWorking(false);
    } else {
      const workTime = isCustomWorking ? customWorking : WORKING_PRESETS[0];
      setTimeLeft(workTime * 60);
      setMode("working");
      setIsCustomBreak(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-input bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              if (mode !== "working") {
                handleSwitchMode();
              }
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "working"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Working
          </button>
          <button
            type="button"
            onClick={() => {
              if (mode !== "break") {
                handleSwitchMode();
              }
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "break"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Break
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center">
        <div
          className={`text-6xl font-bold mb-2 ${
            mode === "working" ? "text-primary" : "text-green-500"
          }`}
        >
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-2">
        {timerState === "idle" || timerState === "paused" ? (
          <Button onClick={handleStart} size="lg">
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        ) : (
          <Button onClick={handlePause} variant="outline" size="lg">
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        )}
        <Button onClick={handleStop} variant="outline" size="lg" disabled={timerState === "idle"}>
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>
        <Button onClick={handleReset} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Working Time Presets */}
      {mode === "working" && (
        <div className="space-y-3">
          <div className="text-sm font-medium">Working Time</div>
          <div className="flex gap-2 flex-wrap">
            {WORKING_PRESETS.map((minutes) => (
              <Button
                key={minutes}
                variant={!isCustomWorking && timeLeft === minutes * 60 ? "default" : "outline"}
                size="sm"
                onClick={() => handleWorkingPreset(minutes)}
                disabled={timerState === "running"}
              >
                {minutes} min
              </Button>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="120"
                value={customWorking}
                onChange={(e) => handleCustomWorkingChange(Number(e.target.value))}
                onFocus={handleCustomWorking}
                disabled={timerState === "running"}
                className="w-16 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-center"
              />
              <span className="text-sm text-muted-foreground">min (custom)</span>
            </div>
          </div>
        </div>
      )}

      {/* Break Time Presets */}
      {mode === "break" && (
        <div className="space-y-3">
          <div className="text-sm font-medium">Break Time</div>
          <div className="flex gap-2 flex-wrap">
            {BREAK_PRESETS.map((minutes) => (
              <Button
                key={minutes}
                variant={!isCustomBreak && timeLeft === minutes * 60 ? "default" : "outline"}
                size="sm"
                onClick={() => handleBreakPreset(minutes)}
                disabled={timerState === "running"}
              >
                {minutes} min
              </Button>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={customBreak}
                onChange={(e) => handleCustomBreakChange(Number(e.target.value))}
                onFocus={handleCustomBreak}
                disabled={timerState === "running"}
                className="w-16 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-center"
              />
              <span className="text-sm text-muted-foreground">min (custom)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
