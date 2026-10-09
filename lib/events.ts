export interface EventRecord {
  id: string;
  title: string;
  slug: string;
  date: string;
  location: string;
  description: string;
  coverImageUrl?: string;
  gallery: string[];
  serviceId: string;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function mapEventRow(row: Record<string, unknown>): EventRecord {
  return {
    id: String(row.id ?? ""),
    title: typeof row.title === "string" ? row.title : "",
    slug: typeof row.slug === "string" ? row.slug : "",
    date: typeof row.date === "string" ? row.date : "",
    location: typeof row.location === "string" ? row.location : "",
    description: typeof row.description === "string" ? row.description : "",
    coverImageUrl: typeof row.cover_image_url === "string" ? row.cover_image_url || undefined : undefined,
    gallery: Array.isArray(row.gallery)
      ? row.gallery.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [],
    serviceId: typeof row.service_id === "string" ? row.service_id : "",
    published: row.published === true,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}
