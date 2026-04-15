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
  createdAt: string;
  updatedAt?: string;
  beneficiaryStories?: BeneficiaryStory[];
  gallery?: string[];
}

export function mapServiceRow(row: any): ServiceItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    description: row.description,
    image: row.image,
    impact: row.impact || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBeneficiaryRow(row: any): BeneficiaryStory {
  return {
    id: row.id,
    serviceId: row.service_id,
    slug: row.slug,
    name: row.name,
    story: row.story,
    fullStory: row.full_story,
    image: row.image,
    createdAt: row.created_at,
  };
}