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
} from "lucide-react";
import { apiRequest } from "@/lib/api";

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
}) => (
  <article
    key={event.eventId}
    className={`group rounded-2xl border border-border/80 bg-card p-5 shadow-md shadow-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 ${
      status === "active" ? "border-emerald-500/30" : ""
    }`}
  >
    <div className="mb-3 flex items-start justify-between gap-2">
      <h2 className="line-clamp-2 text-lg font-semibold leading-tight">
        {event.title}
      </h2>
      <span
        className={`rounded-full px-2.5 py-1 text-xs capitalize ${
          status === "active"
            ? "bg-emerald-500/15 text-emerald-600"
            : "bg-primary/10 text-primary"
        }`}
      >
        {event.type}
      </span>
    </div>
    {event.description && (
      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
        {event.description}
      </p>
    )}
    {event.detail && (
      <p className="mb-4 line-clamp-4 whitespace-pre-wrap text-sm">
        {event.detail}
      </p>
    )}
    <div className="space-y-2 text-xs text-muted-foreground">
      {event.startsAt && (
        <p className="flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5" />
          Starts: {format(new Date(event.startsAt), "MMM d, yyyy HH:mm")}
        </p>
      )}
      {event.endsAt && (
        <p className="flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5" />
          Ends: {format(new Date(event.endsAt), "MMM d, yyyy HH:mm")}
        </p>
      )}
      {event.location && (
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {event.location}
        </p>
      )}
    </div>
    {event.eventLink && (
      <a
        href={event.eventLink}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Open event
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    )}
  </article>
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
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading events...
      </div>
    );
  }

  if (isError) {
    return <p className="text-destructive">{(error as Error).message}</p>;
  }

  const events = data?.data ?? [];
  const activeEvents = events.filter((event) => event.status === "active");
  const soonEvents = events.filter((event) => event.status === "soon");
  const totalVisibleEvents = activeEvents.length + soonEvents.length;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-violet-500/10 via-background to-sky-500/10 p-6 md:p-8">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="relative">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Upcoming highlights
          </p>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
            <CalendarDays className="h-8 w-8 text-primary" />
            Events
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Discover soon-to-happen events curated for the community.
          </p>
        </div>
      </section>

      <div>
        <p className="text-sm text-muted-foreground">
          {totalVisibleEvents} events available
        </p>
      </div>

      {totalVisibleEvents === 0 ? (
        <div className="rounded-2xl border bg-linear-to-br from-muted/50 to-background p-10 text-center shadow-sm">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/80" />
          <h2 className="text-xl font-semibold">No events right now</h2>
          <p className="mt-2 text-sm text-muted-foreground/90">
            There are currently no events in active or soon status. Please check
            back later.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Active now</h2>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600">
                {activeEvents.length}
              </span>
            </div>
            {activeEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No active events at the moment.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Coming soon</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {soonEvents.length}
              </span>
            </div>
            {soonEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No upcoming events yet.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
