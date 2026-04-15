export interface NewsPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image: string;
  category: string;
  publishDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateNewsInput {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  publishDate: string;
}

export function mapNewsRow(row: any): NewsPost {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    image: row.image,
    category: row.category,
    publishDate: row.publish_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}