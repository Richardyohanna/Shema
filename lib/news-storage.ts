export interface NewsPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image: string;
  category: string;
  publishDate: string;
  createdAt: string;
}

const STORAGE_KEY = 'shema_news_posts';
const ADMIN_PASSWORD = 'Shema@2024Admin';

// Initialize with sample data
const sampleNews: NewsPost[] = [
  {
    id: '1',
    title: 'SHEMA Launches New Mentorship Program in Maiduguri',
    excerpt: 'A comprehensive mentorship initiative aimed at empowering 500 young people in the community.',
    content: 'SHEMA is proud to announce the launch of our new mentorship program designed to provide guidance and support to young people in Maiduguri. This initiative will run for 12 months and will benefit approximately 500 participants from vulnerable backgrounds. The program combines one-on-one mentoring with group workshops and skills training.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-rcCgTV0gwRW1rbww8I7AD54ufOjF73.png',
    category: 'Programs',
    publishDate: '2024-04-10',
    createdAt: '2024-04-10T08:00:00Z',
  },
  {
    id: '2',
    title: 'Successful Distribution of Relief Materials to 200 Families',
    excerpt: 'SHEMA team distributes essential aid to vulnerable families across three communities.',
    content: 'In a successful outreach initiative, SHEMA distributed essential relief materials including food items, hygiene kits, and educational supplies to over 200 families across three communities in Borno State. The distribution was conducted in partnership with community leaders and local authorities to ensure transparent and equitable distribution.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-GQ85XJH7PZy0G6uPqlhXCvDT8Qo0i3.png',
    category: 'Community Outreach',
    publishDate: '2024-04-05',
    createdAt: '2024-04-05T10:30:00Z',
  },
  {
    id: '3',
    title: 'Educational Workshop Series Concludes Successfully',
    excerpt: 'Capacity building workshops on entrepreneurship and digital skills completed.',
    content: 'SHEMA has successfully concluded a 6-week capacity building workshop series focused on entrepreneurship and digital skills. The program trained 150 participants, with 85% demonstrating significant improvement in business planning and basic digital literacy skills. Participants received certificates and ongoing mentorship support.',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-e46ilDNlN2NWjaVwqBZo0M3gA1oy1k.png',
    category: 'Education',
    publishDate: '2024-03-28',
    createdAt: '2024-03-28T14:15:00Z',
  },
];

export function initializeNews(): void {
  if (typeof window === 'undefined') return;
  
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleNews));
  }
}

export function getAllNews(): NewsPost[] {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    initializeNews();
    return sampleNews;
  }
  
  return JSON.parse(data).sort((a: NewsPost, b: NewsPost) => 
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
}

export function getNewsById(id: string): NewsPost | null {
  if (typeof window === 'undefined') return null;
  
  const news = getAllNews();
  return news.find(post => post.id === id) || null;
}

export function addNews(post: Omit<NewsPost, 'id' | 'createdAt'>): NewsPost {
  if (typeof window === 'undefined') throw new Error('Cannot add news in server environment');
  
  const newPost: NewsPost = {
    ...post,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  const news = getAllNews();
  news.unshift(newPost);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
  
  return newPost;
}

export function updateNews(id: string, updates: Partial<Omit<NewsPost, 'id' | 'createdAt'>>): NewsPost | null {
  if (typeof window === 'undefined') return null;
  
  const news = getAllNews();
  const index = news.findIndex(post => post.id === id);
  
  if (index === -1) return null;
  
  news[index] = { ...news[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
  
  return news[index];
}

export function deleteNews(id: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const news = getAllNews();
  const filtered = news.filter(post => post.id !== id);
  
  if (filtered.length === news.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}
