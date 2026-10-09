import { testimonyInputSchema } from "@/lib/content-validation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getYouTubeId } from "@/lib/youtube";

export function reportSupabaseFailure(operation: string, error: {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}) {
  console.error("Testimony API Supabase operation failed", {
    operation,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export function isSchemaMissing(code?: string) {
  return code === "PGRST205" || code === "42P01" || code === "42703";
}

export async function ensureEventMatchesService(eventId: string | null, serviceId: string) {
  if (!eventId) return { valid: true as const };
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id, service_id")
    .eq("id", eventId)
    .maybeSingle();
  if (error) return { valid: false as const, error };
  return { valid: data?.service_id === serviceId };
}

export function databasePayload(value: ReturnType<typeof testimonyInputSchema.parse>) {
  return {
    name: value.name,
    role: value.role,
    title: value.title,
    description: value.summary ?? value.description,
    summary: value.summary ?? value.description,
    full_story: value.full_story,
    image_url: value.image_url,
    video_url: value.video_url,
    video_id: value.video_url ? getYouTubeId(value.video_url) : null,
    video_source: value.video_source,
    thumbnail_url: value.thumbnail_url,
    thumbnail_alt_text: value.thumbnail_alt_text,
    display_order: value.display_order,
    published: value.published,
    service_id: value.service_id,
    event_id: value.event_id || null,
    updated_at: new Date().toISOString(),
  };
}
