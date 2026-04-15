'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { NewsCard } from '@/components/news-card';
import type { NewsPost } from '@/lib/news';

export default function NewsPage() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await fetch('/api/news', { cache: 'no-store' });
        const data = await response.json();
        if (response.ok) setNews(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(news.map((post) => post.category))),
    [news]
  );

  const filteredNews = selectedCategory
    ? news.filter((post) => post.category === selectedCategory)
    : news;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Link href="/">
            <Button variant="ghost" className="mb-6 gap-2 text-foreground/70 hover:text-secondary">
              <ChevronLeft size={20} /> Back to Home
            </Button>
          </Link>

          <h1 className="text-4xl sm:text-5xl font-bold text-secondary mb-4">News & Updates</h1>
          <p className="text-lg text-foreground/70 max-w-2xl">
            Stay informed about SHEMA&apos;s latest programs, community outreach initiatives, and success stories
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {categories.length > 0 && (
          <div className="mb-12">
            <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
              Filter by Category
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full font-semibold transition-all ${
                  selectedCategory === null
                    ? 'bg-secondary text-white'
                    : 'bg-gray-100 text-secondary hover:bg-gray-200'
                }`}
              >
                All Posts
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-semibold transition-all ${
                    selectedCategory === category
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-secondary hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <p className="text-foreground/70 text-lg">Loading posts...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-foreground/70 text-lg">No posts available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        )}


      </div>
    </div>
  );
}