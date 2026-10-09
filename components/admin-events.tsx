"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { servicesData } from "@/lib/services-data";
import type { EventRecord } from "@/lib/events";

type EventForm = {
  title: string;
  slug: string;
  date: string;
  location: string;
  description: string;
  coverImageUrl: string;
  gallery: string;
  serviceId: string;
  published: boolean;
};

interface ServiceOption {
  id: string;
  title: string;
}

const newEvent: EventForm = {
  title: "",
  slug: "",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  description: "",
  coverImageUrl: "",
  gallery: "",
  serviceId: servicesData[0].id,
  published: true,
};

function toForm(event: EventRecord): EventForm {
  return {
    title: event.title,
    slug: event.slug,
    date: event.date,
    location: event.location,
    description: event.description,
    coverImageUrl: event.coverImageUrl || "",
    gallery: event.gallery.join("\n"),
    serviceId: event.serviceId,
    published: event.published,
  };
}

export default function AdminEvents({ password }: { password: string }) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>(
    servicesData.map(({ id, title }) => ({ id, title }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(newEvent);
  const [serviceFilter, setServiceFilter] = useState("all");

  async function loadEvents() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/events/admin", {
        cache: "no-store",
        headers: { "x-admin-password": password },
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === "object" && "error" in result
          ? String(result.error)
          : "Unable to load events.";
        throw new Error(message);
      }
      if (!Array.isArray(result)) throw new Error("The events response was invalid.");
      setEvents(result as EventRecord[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
    void loadServices();
    // Events are loaded after the dashboard has authenticated the administrator.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadServices() {
    try {
      const response = await fetch("/api/services/admin", {
        cache: "no-store",
        headers: { "x-admin-password": password },
      });
      const data: unknown = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error("Unable to load services.");
      const options = data.filter((entry): entry is ServiceOption =>
        entry !== null &&
        typeof entry === "object" &&
        "id" in entry &&
        typeof entry.id === "string" &&
        "title" in entry &&
        typeof entry.title === "string"
      );
      if (options.length) setServiceOptions(options);
    } catch (cause) {
      console.warn("Admin event service selector is using static options.", cause);
    }
  }

  const visibleEvents = useMemo(
    () => events.filter((event) => serviceFilter === "all" || event.serviceId === serviceFilter),
    [events, serviceFilter]
  );

  function startNewEvent() {
    setEditingId(null);
    setForm(newEvent);
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  function startEdit(event: EventRecord) {
    setEditingId(event.id);
    setForm(toForm(event));
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  async function saveEvent(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        date: form.date,
        location: form.location.trim(),
        description: form.description.trim(),
        cover_image_url: form.coverImageUrl.trim(),
        gallery: form.gallery.split(/\r?\n/).map((url) => url.trim()).filter(Boolean),
        service_id: form.serviceId,
        published: form.published,
      };
      const response = await fetch(
        editingId ? `/api/events/${encodeURIComponent(editingId)}` : "/api/events",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", "x-admin-password": password },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save event.");
      await loadEvents();
      setFormOpen(false);
      setNotice(editingId ? "Event updated." : "Event created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save event.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(event: EventRecord) {
    if (!window.confirm(`Delete "${event.title}"? Linked testimonies will remain and lose this event link.`)) return;
    setDeleting(event.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(event.id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete event.");
      setEvents((current) => current.filter((entry) => entry.id !== event.id));
      setNotice("Event deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete event.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Events</h2>
          <p className="mt-1 text-sm text-foreground/70">Create events and link them to service testimonies.</p>
        </div>
        <Button onClick={startNewEvent} className="bg-primary text-white hover:bg-primary/90">Add Event</Button>
      </div>

      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <label className="block max-w-sm space-y-1 text-sm font-medium text-secondary">
        Filter by service
        <select
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3"
        >
          <option value="all">All services</option>
          {serviceOptions.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
        </select>
      </label>

      {loading ? (
        <div role="status" className="rounded-xl bg-white p-10 text-center text-foreground/70">Loading events…</div>
      ) : visibleEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-foreground/70">
          {events.length ? "No events for this service." : "No events yet. Add the first event to get started."}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleEvents.map((event) => (
            <article key={event.id} className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              {event.coverImageUrl ? (
                <img src={event.coverImageUrl} alt="" className="h-24 w-full rounded-lg object-cover sm:w-40" />
              ) : (
                <div className="flex h-24 w-full items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-500 sm:w-40">No cover image</div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-secondary">{event.title}</h3>
                <p className="text-sm text-foreground/70">{event.date}{event.location ? ` · ${event.location}` : ""}</p>
                <p className="text-xs text-foreground/60">{serviceOptions.find((service) => service.id === event.serviceId)?.title}</p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${event.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                  {event.published ? "Published" : "Unpublished"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(event)}>Edit</Button>
                <Button variant="outline" size="sm" disabled={deleting === event.id} onClick={() => void deleteEvent(event)} className="border-red-200 text-red-700 hover:bg-red-50">
                  {deleting === event.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => { if (!saving) setFormOpen(open); }}>
          <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
            <DialogHeader className="rounded-t-2xl bg-secondary px-6 py-5 text-white">
              <DialogTitle className="text-xl font-bold text-white">{editingId ? "Edit Event" : "Create Event"}</DialogTitle>
              <DialogDescription className="text-white/80">Manage event details, service, and publication status.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(event) => void saveEvent(event)} className="space-y-4 p-6">
              <label className="block space-y-1 text-sm font-medium text-secondary">
                Service *
                <select required value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })} className="h-10 w-full rounded-md border border-gray-300 bg-white px-3">
                  {serviceOptions.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-secondary">Title *
                  <Input required maxLength={300} value={form.title} onChange={(event) => {
                    const title = event.target.value;
                    setForm({ ...form, title, ...(editingId ? {} : { slug: title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }) });
                  }} />
                </label>
                <label className="space-y-1 text-sm font-medium text-secondary">Slug *
                  <Input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-secondary">Date *
                  <Input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                </label>
                <label className="space-y-1 text-sm font-medium text-secondary">Location
                  <Input maxLength={300} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
                </label>
              </div>
              <label className="block space-y-1 text-sm font-medium text-secondary">Description
                <Textarea maxLength={10000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
              <label className="block space-y-1 text-sm font-medium text-secondary">Cover image URL
                <Input type="url" value={form.coverImageUrl} onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })} placeholder="https://…" />
              </label>
              <label className="block space-y-1 text-sm font-medium text-secondary">Gallery image URLs (one per line)
                <Textarea value={form.gallery} onChange={(event) => setForm({ ...form, gallery: event.target.value })} className="min-h-24" />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="h-4 w-4 accent-primary" />
                Published on the public site
              </label>
              {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-primary text-white hover:bg-primary/90">{saving ? "Saving…" : "Save Event"}</Button>
              </div>
            </form>
          </DialogContent>
      </Dialog>
    </section>
  );
}
