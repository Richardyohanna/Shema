export interface BeneficiaryStory {
  id: string;
  serviceId: string;
  slug: string;
  name: string;
  story: string;
  fullStory: string;
  image: string;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  image: string;
  impact: Record<string, string>;
  gallery: string[];
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
  beneficiaryStories?: BeneficiaryStory[];
  testimonies?: import("@/lib/testimonies").Testimony[];
  events?: import("@/lib/events").EventRecord[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function mapImpactRecord(value: unknown): Record<string, string> {
  const impact = asRecord(value);
  return Object.fromEntries(
    Object.entries(impact)
      .filter((entry): entry is [string, string | number] =>
        typeof entry[1] === "string" || typeof entry[1] === "number"
      )
      .map(([key, item]) => [key, String(item)])
  );
}

function mapGallery(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export function mapServiceRow(value: unknown): ServiceItem {
  const row = asRecord(value);
  const id = asText(row.id);
  return {
    id,
    slug: id,
    title: asText(row.title),
    shortDescription: asText(row.short_description),
    description: asText(row.description),
    image: asText(row.image_url, asText(row.image)),
    impact: mapImpactRecord(row.impact),
    gallery: mapGallery(row.gallery),
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    published: row.published !== false,
    createdAt: asText(row.created_at),
    updatedAt: asText(row.updated_at) || undefined,
  };
}

export function mapBeneficiaryRow(value: unknown): BeneficiaryStory {
  const row = asRecord(value);
  return {
    id: String(row.id ?? ""),
    serviceId: asText(row.service_id),
    slug: asText(row.slug),
    name: asText(row.name),
    story: asText(row.story),
    fullStory: asText(row.full_story),
    image: asText(row.image),
    createdAt: asText(row.created_at),
  };
}
