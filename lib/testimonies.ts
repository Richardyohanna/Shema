import { getYouTubeStartSeconds } from "@/lib/youtube";

export interface Testimony {
  id: number | string;
  name: string;
  role: string;
  title: string;
  description: string;
  summary: string;
  fullStory?: string;
  imageUrl?: string;
  serviceId?: string;
  eventId?: string | null;
  videoId?: string | null;
  videoStartSeconds?: number | null;
  videoUrl?: string;
  videoSource?: 'upload' | 'url';
  uploadedVideoUrl?: string;
  externalVideoUrl?: string;
  thumbnail?: string;
  thumbnailAltText?: string;
  displayOrder?: number;
  published?: boolean;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  return String(value).trim() || undefined;
}

export function mapTestimonyRow(row: Record<string, unknown>): Testimony | null {
  if (!row) return null;

  const videoUrl =
    asString(row.video_url) ??
    asString(row.videoUrl) ??
    undefined;

  const thumbnail =
    asString(row.thumbnail_url) ??
    asString(row.thumbnailUrl) ??
    asString(row.image_url) ??
    asString(row.imageUrl) ??
    asString(row.thumbnail);

  return {
    id: typeof row.id === 'number' || typeof row.id === 'string' ? row.id : '',
    name: asString(row.name) ?? 'Untitled testimony',
    role: asString(row.role) ?? 'Community Story',
    title: asString(row.title) ?? 'Untitled story',
    description: asString(row.description) ?? '',
    summary: asString(row.summary) ?? asString(row.description) ?? '',
    fullStory: asString(row.full_story) ?? asString(row.fullStory),
    imageUrl: asString(row.image_url) ?? asString(row.imageUrl),
    serviceId: asString(row.service_id) ?? asString(row.serviceId),
    eventId: asString(row.event_id) ?? asString(row.eventId) ?? null,
    videoId: asString(row.video_id) ?? asString(row.videoId) ?? null,
    videoStartSeconds: videoUrl ? getYouTubeStartSeconds(videoUrl) : null,
    videoUrl,
    videoSource: row.video_source === 'upload' || row.video_source === 'url' ? row.video_source : undefined,
    thumbnail,
    thumbnailAltText: asString(row.thumbnail_alt_text) ?? '',
    displayOrder: typeof row.display_order === 'number' ? row.display_order : undefined,
    published: typeof row.published === 'boolean' ? row.published : false,
  };
}
