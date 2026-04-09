import React, { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, Phone, MessageCircle, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateMeetingControls,
  leaveMeeting,
  getMeetingChats,
  sendMeetingMessage,
  createMeetingRecording,
} from "@/lib/api/meetings";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface MeetingRoomProps {
  meetingId: string;
  title: string;
  onClose: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  meetingId,
  title,
  onClose,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);

  // Fetch chats
  const { data: chats = [], refetch: refetchChats } = useQuery({
    queryKey: ["meetingChats", meetingId],
    queryFn: () => getMeetingChats(meetingId),
    refetchInterval: 2000,
  });

  // Initialize local media stream
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        streamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Set up media recorder for recording
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current = mediaRecorder;
      } catch (error) {
        toast.error("Failed to access camera/microphone");
        console.error("Error accessing media devices:", error);
      }
    };

    initLocalStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Update mic status
  const handleMicToggle = useCallback(async () => {
    if (!localStream) return;

    const newMicState = !isMicOn;
    (localStream as any).getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = newMicState;
    });

    try {
      await updateMeetingControls(meetingId, { isMicOn: newMicState });
      setIsMicOn(newMicState);
      toast.success(newMicState ? "Microphone on" : "Microphone off");
    } catch (error) {
      toast.error("Failed to update microphone status");
    }
  }, [localStream, isMicOn, meetingId]);

  // Update camera status
  const handleCameraToggle = useCallback(async () => {
    if (!localStream) return;

    const newCameraState = !isCameraOn;
    (localStream as any).getVideoTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = newCameraState;
    });

    try {
      await updateMeetingControls(meetingId, { isCameraOn: newCameraState });
      setIsCameraOn(newCameraState);
      toast.success(newCameraState ? "Camera on" : "Camera off");
    } catch (error) {
      toast.error("Failed to update camera status");
    }
  }, [localStream, isCameraOn, meetingId]);

  // Handle recording
  const handleRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (isRecording) {
      mediaRecorderRef.current.stop();
      setTimeout(async () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const fileName = `meeting-${meetingId}-${new Date().getTime()}.webm`;
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();

        const startedAt = recordingStartedAtRef.current;
        const duration = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : undefined;
        try {
          await createMeetingRecording(meetingId, {
            storagePath: `local-download://${fileName}`,
            duration,
            size: blob.size,
            status: "ready",
          });
        } catch {
          toast.error("Saved video locally, but failed to sync recording history");
        }

        recordingStartedAtRef.current = null;
        recordedChunksRef.current = [];
      }, 500);
      setIsRecording(false);
      toast.success("Recording saved");
    } else {
      recordedChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success("Recording started");
    }
  };

  // Handle screen sharing
  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true as any,
          audio: false,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        if (localStream) {
          const videoTrack = (localStream as any).getVideoTracks()[0];

          // Replace video track
          (localStream as any).removeTrack(videoTrack);
          (localStream as any).addTrack(screenTrack);

          screenTrack.onended = () => {
            (localStream as any).removeTrack(screenTrack);
            (localStream as any).addTrack(videoTrack);
            setIsScreenSharing(false);
            toast.info("Screen sharing stopped");
          };

          setIsScreenSharing(true);
          toast.success("Screen sharing started");
        }
      } else {
        if (localStream) {
          const screenTrack = (localStream as any)
            .getVideoTracks()
            .find((track: MediaStreamTrack) => track.label.includes("screen") || track.label.includes("display"));
          if (screenTrack) {
            screenTrack.stop();
            (localStream as any).removeTrack(screenTrack);
          }
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      toast.error("Screen sharing failed");
      console.error("Error sharing screen:", error);
    }
  };

  // Handle leaving meeting
  const handleLeaveMeeting = async () => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      await leaveMeeting(meetingId);
      toast.success("Left meeting");
      onClose();
    } catch (error) {
      toast.error("Failed to leave meeting");
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      await sendMeetingMessage(meetingId, chatMessage);
      setChatMessage("");
      refetchChats();
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col p-4">
        <div className={`grid min-h-0 flex-1 grid-cols-1 ${chatOpen ? "gap-4 xl:grid-cols-[1fr_360px]" : "gap-0"}`}>
          <section className={`flex min-h-0 flex-col rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl ${chatOpen ? "p-3" : "p-2 md:p-3"}`}>
            <header className="flex items-center justify-between rounded-xl bg-slate-900/70 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-slate-100 md:text-lg">{title}</h2>
                <p className="text-xs text-slate-400">Live meeting room</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Connected
                </span>
                {isRecording && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-red-300">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    Recording
                  </span>
                )}
              </div>
            </header>

            <div className="relative mt-2 flex-1 overflow-hidden rounded-xl bg-slate-900">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              <div className="absolute left-3 top-3 flex gap-2 text-xs">
                <span className={`rounded-full px-2 py-1 ${isMicOn ? "bg-slate-900/80 text-slate-100" : "bg-red-500/85 text-white"}`}>
                  {isMicOn ? "Mic on" : "Mic off"}
                </span>
                <span className={`rounded-full px-2 py-1 ${isCameraOn ? "bg-slate-900/80 text-slate-100" : "bg-red-500/85 text-white"}`}>
                  {isCameraOn ? "Camera on" : "Camera off"}
                </span>
                {isScreenSharing && (
                  <span className="rounded-full bg-sky-500/85 px-2 py-1 text-white">Presenting</span>
                )}
              </div>

              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <VideoOff className="h-12 w-12" />
                    <p className="text-sm">Camera is off</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 rounded-xl bg-slate-900/70 p-3">
              <Button
                size="icon"
                className={`h-11 w-11 rounded-full ${
                  isMicOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600 hover:bg-red-700"
                }`}
                onClick={handleMicToggle}
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>

              <Button
                size="icon"
                className={`h-11 w-11 rounded-full ${
                  isCameraOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-600 hover:bg-red-700"
                }`}
                onClick={handleCameraToggle}
              >
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>

              <Button
                size="icon"
                className={`h-11 w-11 rounded-full ${
                  isScreenSharing ? "bg-sky-600 hover:bg-sky-700" : "bg-slate-700 hover:bg-slate-600"
                }`}
                onClick={handleScreenShare}
              >
                <Monitor className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                className={`h-11 w-11 rounded-full ${
                  isRecording ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600"
                }`}
                onClick={handleRecording}
              >
                <div className="h-3 w-3 rounded-full bg-red-400" />
              </Button>

              <Button
                size="icon"
                className={`h-11 w-11 rounded-full ${
                  chatOpen ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-700 hover:bg-slate-600"
                }`}
                onClick={() => setChatOpen(!chatOpen)}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                className="h-11 w-11 rounded-full bg-red-600 hover:bg-red-700"
                onClick={handleLeaveMeeting}
              >
                <Phone className="h-5 w-5" />
              </Button>
            </div>
          </section>

          {chatOpen && (
            <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/85">
              <div className="border-b border-slate-700 px-4 py-3">
                <h3 className="font-semibold text-slate-100">Chat</h3>
                <p className="text-xs text-slate-400">Team messages</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chats.length === 0 ? (
                  <p className="mt-10 text-center text-sm text-slate-500">No messages yet</p>
                ) : (
                  chats
                    .slice()
                    .reverse()
                    .map((chat) => (
                      <div key={chat.chatId} className="rounded-lg bg-slate-800/90 p-3 text-sm">
                        <p className="font-medium text-sky-300">
                          {chat.user?.firstName} {chat.user?.lastName}
                        </p>
                        <p className="mt-1 break-words text-slate-200">{chat.message}</p>
                        <p className="mt-2 text-[11px] text-slate-400">
                          {new Date(chat.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                )}
              </div>

              <div className="border-t border-slate-700 p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    className="border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleSendMessage} className="bg-sky-600 hover:bg-sky-700">
                    Send
                  </Button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
