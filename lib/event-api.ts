import { eventInputSchema } from "@/lib/content-validation";

export function eventPayload(value: ReturnType<typeof eventInputSchema.parse>) {
  return {
    title: value.title,
    slug: value.slug,
    date: value.date,
    location: value.location,
    description: value.description,
    cover_image_url: value.cover_image_url,
    gallery: value.gallery,
    service_id: value.service_id,
    published: value.published,
    updated_at: new Date().toISOString(),
  };
}
