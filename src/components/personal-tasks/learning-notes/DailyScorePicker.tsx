import React from "react";
import { cn } from "@/lib/utils";

export const DAILY_SCORE_MIN = 1;
export const DAILY_SCORE_MAX = 10;

export function getDailyScoreLabel(score: number): string {
  if (score <= 3) return "Needs work";
  if (score <= 6) return "Okay";
  if (score <= 8) return "Good";
  return "Excellent";
}

export function getDailyScoreColor(score: number): string {
  if (score <= 3) return "bg-destructive/15 text-destructive border-destructive/30";
  if (score <= 6) return "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300";
  if (score <= 8) return "bg-primary/15 text-primary border-primary/30";
  return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300";
}

interface DailyScorePickerProps {
  value: number | null;
  onChange: (score: number | null) => void;
  disabled?: boolean;
  className?: string;
}

export const DailyScorePicker: React.FC<DailyScorePickerProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const scores = Array.from(
    { length: DAILY_SCORE_MAX - DAILY_SCORE_MIN + 1 },
    (_, index) => DAILY_SCORE_MIN + index
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {scores.map((score) => {
          const isSelected = value === score;
          return (
            <button
              key={score}
              type="button"
              disabled={disabled}
              onClick={() => onChange(isSelected ? null : score)}
              className={cn(
                "h-9 min-w-9 rounded-lg border px-3 text-sm font-medium transition-colors",
                isSelected
                  ? getDailyScoreColor(score)
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-50"
              )}
              aria-pressed={isSelected}
              aria-label={`Score ${score}`}
            >
              {score}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {value == null
          ? "Rate how productive your learning day was (1-10). Tap again to clear."
          : `${value}/10 — ${getDailyScoreLabel(value)}`}
      </p>
    </div>
  );
};

interface DailyScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

export const DailyScoreBadge: React.FC<DailyScoreBadgeProps> = ({
  score,
  className,
}) => {
  if (score == null) {
    return (
      <span className={cn("text-xs italic text-muted-foreground/70", className)}>
        Not rated
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        getDailyScoreColor(score),
        className
      )}
    >
      {score}/10
    </span>
  );
};
