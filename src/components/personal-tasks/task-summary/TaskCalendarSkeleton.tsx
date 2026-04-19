/** Loading placeholder matching TaskCalendarView (nav, tabs, month grid). */
export function TaskCalendarSkeleton() {
  return (
    <div className="w-full space-y-4" aria-busy="true" aria-label="Loading calendar">
      {/* Header: arrows + month + Today */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-md border border-transparent bg-muted" />
          <div className="mx-2 h-5 min-w-[160px] animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-8 w-18 shrink-0 animate-pulse rounded-md bg-muted" />
      </div>

      {/* Tabs */}
      <div className="relative border-b">
        <div className="flex gap-2 pb-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-9 w-28 animate-pulse rounded-md bg-muted sm:w-32"
            />
          ))}
        </div>
      </div>

      {/* Weekday row + day grid */}
      <div className="w-full overflow-x-auto">
        <div className="grid w-full min-w-0 grid-cols-7 gap-0 overflow-hidden rounded-lg border border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={`wd-${i}`}
              className="border-b border-border bg-muted/50 px-0.5 py-2"
            >
              <div className="mx-auto h-3 w-8 animate-pulse rounded bg-muted-foreground/20" />
            </div>
          ))}
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={`cell-${i}`}
              className="flex min-h-16 flex-col border border-border p-1 md:min-h-[110px] lg:min-h-[140px]"
            >
              <div className="mb-1 h-4 w-6 animate-pulse rounded bg-muted/90" />
              <div className="mt-0.5 flex-1 space-y-1">
                <div className="h-2.5 w-full animate-pulse rounded bg-muted/70" />
                <div className="hidden h-2.5 animate-pulse rounded bg-muted/60 sm:block sm:w-[80%]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats strip (matches MonthlyPerformanceStats area) */}
      <div className="h-24 w-full animate-pulse rounded-lg border border-border/60 bg-muted/40 md:h-28" />
    </div>
  );
}
