import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, PlusCircle, Trash2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

interface EventForm {
  title: string;
  description: string;
  detail: string;
  eventLink: string;
  type: string;
  location: string;
  startsAt: string;
  endsAt: string;
  status: "active" | "inactive" | "soon";
}

const emptyForm: EventForm = {
  title: "",
  description: "",
  detail: "",
  eventLink: "",
  type: "general",
  location: "",
  startsAt: "",
  endsAt: "",
  status: "soon",
};

const toIsoOrNull = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const AdminEventsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery<{ data: EventItem[] }>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await apiRequest("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: EventForm) => {
      const body = {
        title: payload.title.trim(),
        description: payload.description.trim() || null,
        detail: payload.detail.trim() || null,
        eventLink: payload.eventLink.trim() || null,
        type: payload.type.trim() || "general",
        location: payload.location.trim() || null,
        startsAt: toIsoOrNull(payload.startsAt),
        endsAt: toIsoOrNull(payload.endsAt),
        status: payload.status,
      };
      const endpoint = editingId ? `/api/admin/events/${editingId}` : "/api/admin/events";
      const method = editingId ? "PUT" : "POST";
      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(err.error || "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(editingId ? "Event updated" : "Event created");
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest(`/api/admin/events/${eventId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Delete failed" }));
        throw new Error(err.error || "Delete failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const events = useMemo(() => data?.data ?? [], [data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    upsertMutation.mutate(form);
  };

  const startEdit = (item: EventItem) => {
    setEditingId(item.eventId);
    setForm({
      title: item.title,
      description: item.description ?? "",
      detail: item.detail ?? "",
      eventLink: item.eventLink ?? "",
      type: item.type,
      location: item.location ?? "",
      startsAt: item.startsAt ? item.startsAt.slice(0, 16) : "",
      endsAt: item.endsAt ? item.endsAt.slice(0, 16) : "",
      status: item.status,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Event</h1>
        <p className="mt-1 text-muted-foreground">Admins can create, update, and delete events.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-lg border p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Event title"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Input
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              placeholder="workshop, meeting, webinar..."
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Online / Office..."
            />
          </div>
          <div>
            <Label>Event link</Label>
            <Input
              value={form.eventLink}
              onChange={(e) => setForm((f) => ({ ...f, eventLink: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Starts at</Label>
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </div>
          <div>
            <Label>Ends at</Label>
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
        </div>
        <div>
          <Label>Detail</Label>
          <Textarea
            value={form.detail}
            onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
            rows={4}
          />
        </div>
        <div>
          <Label>Status</Label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as "active" | "inactive" | "soon",
              }))
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="soon">soon</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                {editingId ? "Update event" : "Create event"}
              </>
            )}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel edit
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Current events</h2>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading...
          </div>
        ) : isError ? (
          <p className="text-destructive">{(error as Error).message}</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground">No events yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.eventId} className="flex items-start justify-between gap-4 rounded-md border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.type}
                    {event.startsAt ? ` • ${format(new Date(event.startsAt), "MMM d, yyyy HH:mm")}` : ""}
                    {` • ${event.status}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(event)}>
                    <PencilLine className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(event.eventId)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEventsPage;
