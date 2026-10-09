'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import type { Testimony } from '@/lib/testimonies';
import { servicesData } from '@/lib/services-data';
import type { EventRecord } from '@/lib/events';
import { getYouTubeId, getYouTubeStartSeconds } from '@/lib/youtube';
import { YouTubeEmbed } from '@/components/youtube-embed';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type VideoSource = 'upload' | 'url';

interface ServiceOption {
  id: string;
  title: string;
}

interface TestimonyForm {
  name: string;
  role: string;
  title: string;
  description: string;
  fullStory: string;
  imageUrl: string;
  serviceId: string;
  eventId: string;
  videoSource: VideoSource;
  videoUrl: string;
  thumbnailUrl: string;
  thumbnailAltText: string;
  displayOrder: string;
  published: boolean;
}

const emptyForm: TestimonyForm = {
  name: '',
  role: '',
  title: '',
  description: '',
  fullStory: '',
  imageUrl: '',
  serviceId: servicesData[0].id,
  eventId: '',
  videoSource: 'url',
  videoUrl: '',
  thumbnailUrl: '',
  thumbnailAltText: '',
  displayOrder: '0',
  published: true,
};

function validVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(host)) {
      return getYouTubeId(value) !== null;
    }
    return (
      /\.(mp4|mov|webm|ogg|m4v)(?:[?#].*)?$/i.test(url.pathname + url.search) ||
      /(^|\.)vimeo\.com$/i.test(url.hostname)
    );
  } catch {
    return false;
  }
}

function isDirectVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) &&
      /\.(mp4|mov|webm|ogg|m4v)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function uploadMedia(
  file: File,
  kind: 'video' | 'thumbnail' | 'image' | 'event-cover',
  password: string,
  onUploading: () => void
): Promise<{ url: string; path: string }> {
  return fetch('/api/testimonies/upload', {
    method: 'POST',
    headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  }).then(async (response) => {
    const signed = await response.json();
    if (!response.ok || !signed.path || !signed.token || !signed.url) {
      throw new Error(signed.error || 'Unable to prepare the media upload.');
    }
    onUploading();
    const { error } = await supabase.storage
      .from('site-media')
      .uploadToSignedUrl(signed.path as string, signed.token as string, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });
    if (error) {
      const status = error.statusCode ? ` (${error.statusCode})` : '';
      throw new Error(`Supabase Storage upload failed${status}: ${error.message}`);
    }
    return { url: signed.url as string, path: signed.path as string };
  });
}

const VIDEO_MAX_SIZE = 500 * 1024 * 1024;
const IMAGE_MAX_SIZE = 12 * 1024 * 1024;
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function AdminTestimonies({ password }: { password: string }) {
  const [items, setItems] = useState<Testimony[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>(
    servicesData.map(({ id, title }) => ({ id, title }))
  );
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState<TestimonyForm>(emptyForm);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const loadItems = async () => {
    setLoading(true);
    setListError('');
    try {
      const response = await fetch('/api/testimonies/admin', {
        cache: 'no-store',
        headers: { 'x-admin-password': password },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load testimonies.');
      if (!Array.isArray(data)) throw new Error('The testimony response was invalid.');
      setItems(data as Testimony[]);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Unable to load testimonies.');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events/admin', {
        cache: 'no-store',
        headers: { 'x-admin-password': password },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load events.');
      if (!Array.isArray(data)) throw new Error('The event response was invalid.');
      setEvents(data as EventRecord[]);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Unable to load events.');
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services/admin', {
        cache: 'no-store',
        headers: { 'x-admin-password': password },
      });
      const data: unknown = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        throw new Error('Unable to load services; using the static service list.');
      }
      const options = data.filter((entry): entry is ServiceOption =>
        entry !== null &&
        typeof entry === 'object' &&
        'id' in entry &&
        typeof entry.id === 'string' &&
        'title' in entry &&
        typeof entry.title === 'string'
      );
      if (options.length) setServiceOptions(options);
    } catch (error) {
      console.warn('Admin testimony service selector is using static options.', error);
    }
  };

  useEffect(() => {
    void loadItems();
    void loadEvents();
    void loadServices();
    // Load on mount after the dashboard has authenticated the administrator.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query || [item.name, item.role, item.title]
        .some((value) => value.toLocaleLowerCase().includes(query));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && item.published) ||
        (statusFilter === 'draft' && !item.published);
      const matchesService = serviceFilter === 'all' || item.serviceId === serviceFilter;
      const matchesEvent = eventFilter === 'all' || item.eventId === eventFilter;
      return matchesSearch && matchesStatus && matchesService && matchesEvent;
    });
  }, [items, search, statusFilter, serviceFilter, eventFilter]);

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setVideoFile(null);
    setThumbnailFile(null);
    setImageFile(null);
    setFormError('');
    setNotice('');
    setFormOpen(true);
  }

  function openEditForm(item: Testimony) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      role: item.role,
      title: item.title,
      description: item.description,
      fullStory: item.fullStory || '',
      imageUrl: item.imageUrl || '',
      serviceId: item.serviceId || servicesData[0].id,
      eventId: item.eventId || '',
      videoSource: item.videoSource || 'url',
      videoUrl: item.videoUrl || '',
      thumbnailUrl: item.thumbnail || '',
      thumbnailAltText: item.thumbnailAltText || '',
      displayOrder: String(item.displayOrder ?? 0),
      published: Boolean(item.published),
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setImageFile(null);
    setFormError('');
    setNotice('');
    setFormOpen(true);
  }

  async function saveTestimony(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setFormError('');
    setNotice('');

    const order = Number(form.displayOrder);
    if (!Number.isInteger(order) || order < 0) {
      setFormError('Display order must be a non-negative whole number.');
      return;
    }
    if (form.videoSource === 'url' && form.videoUrl.trim() && !validVideoUrl(form.videoUrl.trim())) {
      setFormError('Enter a direct video file URL or a supported YouTube/Vimeo URL.');
      return;
    }
    if (form.videoSource === 'upload' && !videoFile && !form.videoUrl) {
      setFormError('Choose a video file to upload.');
      return;
    }
    if (form.videoSource === 'upload' && !videoFile && !/\.(mp4|mov|webm|ogg|m4v)(?:[?#].*)?$/i.test(form.videoUrl)) {
      setFormError('The saved upload does not look like a direct video file. Please upload a video.');
      return;
    }
    if (videoFile && !VIDEO_TYPES.includes(videoFile.type)) {
      setFormError('Use an MP4, MOV, WebM, or Ogg video.');
      return;
    }
    if (videoFile && (videoFile.size <= 0 || videoFile.size > VIDEO_MAX_SIZE)) {
      setFormError('The video must be 500 MB or smaller.');
      return;
    }
    if (thumbnailFile && !IMAGE_TYPES.includes(thumbnailFile.type)) {
      setFormError('Use a JPEG, PNG, or WebP thumbnail image.');
      return;
    }
    if (thumbnailFile && (thumbnailFile.size <= 0 || thumbnailFile.size > IMAGE_MAX_SIZE)) {
      setFormError('The thumbnail must be 12 MB or smaller.');
      return;
    }
    if (imageFile && !IMAGE_TYPES.includes(imageFile.type)) {
      setFormError('Use a JPEG, PNG, or WebP story image.');
      return;
    }
    if (imageFile && (imageFile.size <= 0 || imageFile.size > IMAGE_MAX_SIZE)) {
      setFormError('The story image must be 12 MB or smaller.');
      return;
    }
    if (form.videoSource === 'url' && getYouTubeId(form.videoUrl.trim()) === null &&
        !validVideoUrl(form.videoUrl.trim())) {
      setFormError('Enter a valid direct video, YouTube, or Vimeo URL.');
      return;
    }

    setSaving(true);
    let videoUrl = form.videoUrl.trim();
    let thumbnailUrl: string | null = form.thumbnailUrl.trim() || null;
    let imageUrl: string | null = form.imageUrl.trim() || null;
    const uploadedPaths: string[] = [];
    try {
      if (form.videoSource === 'upload' && videoFile) {
        setUploadingMedia(true);
        const uploaded = await uploadMedia(videoFile, 'video', password, () => setUploadingMedia(true));
        videoUrl = uploaded.url;
        uploadedPaths.push(uploaded.path);
      }
      if (thumbnailFile) {
        setUploadingMedia(true);
        const uploaded = await uploadMedia(thumbnailFile, 'thumbnail', password, () => setUploadingMedia(true));
        thumbnailUrl = uploaded.url;
        uploadedPaths.push(uploaded.path);
      }
      if (imageFile) {
        setUploadingMedia(true);
        const uploaded = await uploadMedia(imageFile, 'image', password, () => setUploadingMedia(true));
        imageUrl = uploaded.url;
        uploadedPaths.push(uploaded.path);
      }

      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        summary: form.description.trim(),
        full_story: form.fullStory.trim(),
        image_url: imageUrl,
        service_id: form.serviceId,
        event_id: form.eventId || null,
        video_source: form.videoSource,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        thumbnail_alt_text: form.thumbnailAltText.trim(),
        display_order: order,
        published: form.published,
      };
      const response = await fetch(
        editingId ? `/api/testimonies/${encodeURIComponent(String(editingId))}` : '/api/testimonies',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password,
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save testimony.');

      await loadItems();
      setFormOpen(false);
      setNotice(editingId ? 'Testimony updated successfully.' : 'Testimony created successfully.');
      setVideoFile(null);
      setThumbnailFile(null);
      setImageFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save testimony.';
      if (!uploadedPaths.length) {
        setFormError(message);
      } else {
        try {
          const cleanup = await fetch('/api/testimonies/upload', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': password,
            },
            body: JSON.stringify({ paths: uploadedPaths }),
          });
          if (cleanup.ok) {
            setFormError(message);
          } else {
            const cleanupResult = await cleanup.json();
            setFormError(`${message} Temporary media cleanup also failed: ${cleanupResult.error || 'unknown error'}`);
          }
        } catch {
          setFormError(`${message} Temporary uploaded media could not be cleaned up.`);
        }
      }
    } finally {
      setSaving(false);
      setUploadingMedia(false);
    }
  }

  async function togglePublished(item: Testimony) {
    setNotice('');
    setListError('');
    try {
      const response = await fetch(`/api/testimonies/${encodeURIComponent(String(item.id))}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          name: item.name,
          role: item.role,
          title: item.title,
          description: item.description,
          summary: item.summary || item.description,
          full_story: item.fullStory || '',
          image_url: item.imageUrl || null,
          service_id: item.serviceId || servicesData[0].id,
          event_id: item.eventId || null,
          video_source: item.videoSource || 'url',
          video_url: item.videoUrl,
          thumbnail_url: item.thumbnail || null,
          thumbnail_alt_text: item.thumbnailAltText || '',
          display_order: item.displayOrder ?? 0,
          published: !item.published,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update publication status.');
      setItems((current) => current.map((entry) => entry.id === item.id ? result as Testimony : entry));
      setNotice(`Testimony ${item.published ? 'unpublished' : 'published'}.`);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Unable to update publication status.');
    }
  }

  async function deleteTestimony(item: Testimony) {
    if (!window.confirm(`Delete “${item.title}”? This action cannot be undone.`)) return;
    setDeletingId(item.id);
    setNotice('');
    setListError('');
    try {
      const response = await fetch(`/api/testimonies/${encodeURIComponent(String(item.id))}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete testimony.');
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setNotice(result.warning || 'Testimony deleted successfully.');
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Unable to delete testimony.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Video Testimonies</h2>
          <p className="mt-1 text-sm text-foreground/70">Manage published stories and unpublished drafts.</p>
        </div>
        <Button onClick={openNewForm} className="gap-2 bg-primary text-white hover:bg-primary/90">
          <span aria-hidden="true">+</span> Add Testimony
        </Button>
      </div>

      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {listError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{listError}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          aria-label="Search testimonies"
          placeholder="Search name, role, or title"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="bg-white"
        />
        <select
          aria-label="Filter publication status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Unpublished</option>
        </select>
        <select
          aria-label="Filter testimonies by service"
          value={serviceFilter}
          onChange={(event) => {
            setServiceFilter(event.target.value);
            setEventFilter('all');
          }}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
        >
          <option value="all">All services</option>
          {serviceOptions.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
        </select>
        <select
          aria-label="Filter testimonies by event"
          value={eventFilter}
          onChange={(event) => setEventFilter(event.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
        >
          <option value="all">All events</option>
          {events.filter((event) => serviceFilter === 'all' || event.serviceId === serviceFilter)
            .map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div role="status" className="rounded-xl bg-white p-10 text-center text-foreground/70">Loading testimonies…</div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-foreground/70">
            {items.length === 0 ? 'No testimonies yet. Add the first one to get started.' : 'No testimonies match your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => (
            <article key={item.id} className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-lg bg-[#0f2218] sm:w-40">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/70">No thumbnail</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-secondary">{item.title}</h3>
                <p className="mt-1 text-sm text-foreground/70">{item.name} · {item.role}</p>
                <p className="mt-1 text-xs text-foreground/60">
                  {serviceOptions.find((service) => service.id === item.serviceId)?.title || 'Service not set'}
                  {item.eventId ? ` · ${events.find((event) => event.id === item.eventId)?.title || 'Event'}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${item.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {item.published ? 'Published' : 'Unpublished'}
                  </span>
                  <span className="text-foreground/60">Order: {item.displayOrder ?? 0}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => void togglePublished(item)}>
                  {item.published ? 'Unpublish' : 'Publish'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEditForm(item)}>Edit</Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deletingId === item.id}
                  onClick={() => void deleteTestimony(item)}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  {deletingId === item.id ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => { if (!saving) setFormOpen(open); }}>
          <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
            <DialogHeader className="rounded-t-2xl bg-secondary px-6 py-5 text-white">
              <DialogTitle className="text-xl font-bold text-white">{editingId ? 'Edit Testimony' : 'Add Testimony'}</DialogTitle>
              <DialogDescription className="text-white/80">Provide story details and choose how the video is hosted.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(event) => void saveTestimony(event)} className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-secondary">
                  Service *
                  <select
                    required
                    value={form.serviceId}
                    onChange={(event) => setForm({ ...form, serviceId: event.target.value, eventId: '' })}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3"
                  >
                    {serviceOptions.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-sm font-medium text-secondary">
                  Event (optional)
                  <select
                    value={form.eventId}
                    onChange={(event) => setForm({ ...form, eventId: event.target.value })}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3"
                  >
                    <option value="">No event</option>
                    {events.filter((event) => event.serviceId === form.serviceId)
                      .map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-secondary">
                  Name *
                  <Input required maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="space-y-1 text-sm font-medium text-secondary">
                  Role or category
                  <Input maxLength={200} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
                </label>
              </div>
              <label className="block space-y-1 text-sm font-medium text-secondary">
                Title *
                <Input required maxLength={300} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label className="block space-y-1 text-sm font-medium text-secondary">
                Summary *
                <Textarea required maxLength={10000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24" />
              </label>
              <label className="block space-y-1 text-sm font-medium text-secondary">
                Full story (optional)
                <Textarea maxLength={30000} value={form.fullStory} onChange={(event) => setForm({ ...form, fullStory: event.target.value })} className="min-h-32" />
              </label>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary">
                  Story image URL (optional)
                  <Input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://…" />
                </label>
                <label className="block text-sm font-medium text-secondary">
                  Or upload/replace story image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                  />
                </label>
                {imageFile && <p className="text-xs text-foreground/70">{imageFile.name} · {(imageFile.size / (1024 * 1024)).toFixed(1)} MB</p>}
                {!imageFile && form.imageUrl.trim() && <img src={form.imageUrl.trim()} alt="Current story image preview" className="h-24 w-40 rounded object-cover" />}
                {imageFile && imagePreviewUrl && <img src={imagePreviewUrl} alt="Selected story image preview" className="h-24 w-40 rounded object-cover" />}
              </div>

              <label className="block space-y-1 text-sm font-medium text-secondary">
                Video source *
                <select
                  value={form.videoSource}
                  onChange={(event) => {
                    const videoSource = event.target.value as VideoSource;
                    setForm({ ...form, videoSource });
                    if (videoSource === 'url') setVideoFile(null);
                  }}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3"
                >
                  <option value="upload">Upload Video</option>
                  <option value="url">Video URL</option>
                </select>
              </label>

              {form.videoSource === 'upload' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary">
                    Video file {editingId && form.videoUrl ? '(choose a file to replace the current video)' : '*'}
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/ogg"
                      onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
                      className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                    />
                  </label>
                  {videoFile ? (
                    <>
                      <p className="text-xs text-foreground/70">
                        {videoFile.name} · {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                      {videoPreviewUrl && (
                        <video
                          src={videoPreviewUrl}
                          controls
                          playsInline
                          preload="metadata"
                          poster={thumbnailPreviewUrl || form.thumbnailUrl || undefined}
                          className="mt-2 max-h-48 w-full rounded bg-black"
                        />
                      )}
                    </>
                  ) : form.videoUrl ? (
                    <>
                      <p className="break-all text-xs text-foreground/70">Current video: {form.videoUrl}</p>
                      {isDirectVideoUrl(form.videoUrl) && (
                        <video
                          src={form.videoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          poster={thumbnailPreviewUrl || form.thumbnailUrl || undefined}
                          className="mt-2 max-h-48 w-full rounded bg-black"
                        />
                      )}
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                <label className="block space-y-1 text-sm font-medium text-secondary">
                  Video URL (optional)
                  <Input
                    type="url"
                    required={false}
                    placeholder="https://… (MP4/MOV/WebM, YouTube, or Vimeo)"
                    value={form.videoUrl}
                    onChange={(event) => setForm({ ...form, videoUrl: event.target.value })}
                  />
                  <span className="block text-xs font-normal text-foreground/60">
                    YouTube videos with disabled embedding or private visibility cannot be played here.
                  </span>
                </label>
                {form.videoUrl && getYouTubeId(form.videoUrl) && (
                  <YouTubeEmbed
                    videoId={getYouTubeId(form.videoUrl)}
                    title={form.title || 'Testimony preview'}
                    startSeconds={getYouTubeStartSeconds(form.videoUrl)}
                    videoUrl={form.videoUrl}
                  />
                )}
                {form.videoUrl && isDirectVideoUrl(form.videoUrl) && (
                  <video
                    src={form.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    poster={thumbnailPreviewUrl || form.thumbnailUrl || undefined}
                    className="mt-2 max-h-48 w-full rounded bg-black"
                  />
                )}
                {form.videoUrl && !validVideoUrl(form.videoUrl) && (
                  <p role="alert" className="text-xs text-red-700">Enter a valid YouTube URL or a direct video file URL.</p>
                )}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary">
                  Thumbnail image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm"
                  />
                </label>
                {thumbnailFile && <p className="text-xs text-foreground/70">{thumbnailFile.name} · {(thumbnailFile.size / (1024 * 1024)).toFixed(1)} MB</p>}
                {!thumbnailFile && form.thumbnailUrl && (
                  <img src={form.thumbnailUrl} alt="Current thumbnail preview" className="h-24 w-40 rounded object-cover" />
                )}
                {thumbnailFile && thumbnailPreviewUrl && <img src={thumbnailPreviewUrl} alt="Selected thumbnail preview" className="h-24 w-40 rounded object-cover" />}
              </div>
              <label className="block space-y-1 text-sm font-medium text-secondary">
                Thumbnail alt text
                <Input
                  maxLength={500}
                  value={form.thumbnailAltText}
                  onChange={(event) => setForm({ ...form, thumbnailAltText: event.target.value })}
                  placeholder="Briefly describe the image"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-secondary">
                  Display order
                  <Input type="number" min="0" step="1" required value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} />
                </label>
                <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-secondary">
                  <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="h-4 w-4 accent-primary" />
                  Published on the public site
                </label>
              </div>

              {uploadingMedia && (
                <div className="space-y-1" role="status">
                  <div className="text-xs text-foreground/70">Uploading media to Supabase Storage…</div>
                  <progress aria-label="Uploading testimony media" className="h-2 w-full accent-primary" />
                </div>
              )}
              {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-primary text-white hover:bg-primary/90">
                  {saving ? 'Saving…' : 'Save Testimony'}
                </Button>
              </div>
            </form>
          </DialogContent>
      </Dialog>
    </section>
  );
}
