import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Loader2,
  CalendarDays,
  Sparkles,
  Clock3,
  MapPin,
  ArrowUpRight,
  PartyPopper,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EventItem {
  eventId: string;
  title: string;
  description: string | null;
  detail: string | null;
  eventLink: string | null;
  type: string;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: "active" | "inactive" | "soon";
  createdAt: string;
  updatedAt: string;
}

const EventCard: React.FC<{ event: EventItem; status: "active" | "soon" }> = ({
  event,
  status,
}) => {
  const isActive = status === "active";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-md shadow-primary/5 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/15",
        isActive
          ? "border-success/35 ring-1 ring-success/20"
          : "border-border/80 ring-1 ring-primary/10",
      )}
    >
      <div
        className={cn(
          "h-1.5 w-full shrink-0",
          isActive
            ? "bg-linear-to-r from-success/80 to-success/40"
            : "bg-linear-to-r from-primary to-secondary/80",
        )}
        aria-hidden
      />
      <div className="flex flex-1 flex-col p-5 pt-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-foreground">
            {event.title}
          </h2>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
              isActive
                ? "bg-success/15 text-success"
                : "bg-primary/12 text-primary",
            )}
          >
            {event.type}
          </span>
        </div>

        {event.description && (
          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}
        {event.detail && (
          <p className="mb-4 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {event.detail}
          </p>
        )}

        <div className="mt-auto space-y-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          {event.startsAt && (
            <p className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background/80 text-primary shadow-sm">
                <Clock3 className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="font-medium text-foreground/80">Starts</span>{" "}
                {format(new Date(event.startsAt), "MMM d, yyyy · HH:mm")}
              </span>
            </p>
          )}
          {event.endsAt && (
            <p className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background/80 text-secondary-foreground shadow-sm">
                <Clock3 className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="font-medium text-foreground/80">Ends</span>{" "}
                {format(new Date(event.endsAt), "MMM d, yyyy · HH:mm")}
              </span>
            </p>
          )}
          {event.location && (
            <p className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background/80 text-primary shadow-sm">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">{event.location}</span>
            </p>
          )}
        </div>

        {event.eventLink && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full border-primary/25 bg-primary/5 font-semibold text-primary hover:bg-primary/12 hover:text-primary"
            asChild
          >
            <a href={event.eventLink} target="_blank" rel="noreferrer">
              Open event
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
        )}
      </div>
    </article>
  );
};

const SectionHeader: React.FC<{
  title: string;
  count: number;
  variant: "active" | "soon";
}> = ({ title, count, variant }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
    <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
      {title}
    </h2>
    <span
      className={cn(
        "inline-flex min-w-8 items-center justify-center rounded-full px-3 py-1 text-xs font-bold tabular-nums",
        variant === "active"
          ? "bg-success/15 text-success ring-1 ring-success/25"
          : "bg-primary/12 text-primary ring-1 ring-primary/25",
      )}
    >
      {count}
    </span>
  </div>
);

const EventsPage: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery<{ data: EventItem[] }>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await apiRequest("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-primary/20 bg-card/50 p-12 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading events…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        {(error as Error).message}
      </div>
    );
  }

  const events = data?.data ?? [];
  const activeEvents = events.filter((event) => event.status === "active");
  const soonEvents = events.filter((event) => event.status === "soon");
  const totalVisibleEvents = activeEvents.length + soonEvents.length;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-lg shadow-primary/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
        >
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-secondary/25 blur-3xl" />
          <div className="absolute right-1/3 top-1/2 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        </div>
        <div className="relative px-6 py-8 md:px-10 md:py-10">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Community
          </p>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
              <CalendarDays className="h-7 w-7" />
            </span>
            Events
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Discover what&apos;s live and what&apos;s coming next — curated for
            the dashboard community.
          </p>
        </div>
      </section>

      <p className="text-sm font-medium text-muted-foreground">
        <span className="font-bold tabular-nums text-foreground">
          {totalVisibleEvents}
        </span>{" "}
        {totalVisibleEvents === 1 ? "event" : "events"} shown
      </p>

      {totalVisibleEvents === 0 ? (
        <Card className="overflow-hidden border-dashed border-primary/25 bg-muted/30">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <PartyPopper className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">No events right now</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Nothing in <strong className="text-foreground">Active</strong> or{" "}
              <strong className="text-foreground">Coming soon</strong>. Check back
              later for new listings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          <section className="space-y-5">
            <SectionHeader
              title="Active now"
              count={activeEvents.length}
              variant="active"
            />
            {activeEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-success/30 bg-success/5 px-5 py-8 text-center text-sm text-muted-foreground">
                No active events at the moment.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {activeEvents.map((event) => (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    status="active"
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <SectionHeader
              title="Coming soon"
              count={soonEvents.length}
              variant="soon"
            />
            {soonEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-5 py-8 text-center text-sm text-muted-foreground">
                No upcoming events yet.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {soonEvents.map((event) => (
                  <EventCard key={event.eventId} event={event} status="soon" />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
