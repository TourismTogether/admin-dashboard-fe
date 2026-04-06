import React from "react";

/** Loading placeholder matching WeekTable layout (week header + grid). */
export function WeekTableSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading table">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-8 w-full max-w-md animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-md bg-muted sm:w-40 sm:shrink-0" />
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-border/60">
        <div className="min-w-[800px] space-y-2 p-2">
          <div className="flex gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className={
                  i === 0
                    ? "h-10 w-[180px] shrink-0 animate-pulse rounded-md bg-muted"
                    : "h-10 min-w-[100px] flex-1 animate-pulse rounded-md bg-muted"
                }
              />
            ))}
          </div>
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`${row}-${i}`}
                  className={
                    i === 0
                      ? "h-24 w-[180px] shrink-0 animate-pulse rounded-md bg-muted/90"
                      : "h-24 min-w-[100px] flex-1 animate-pulse rounded-md bg-muted/90"
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
