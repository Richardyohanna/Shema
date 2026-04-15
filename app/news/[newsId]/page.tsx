'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NewsCard } from '@/components/news-card';
import { ChevronLeft, Calendar, Tag, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { NewsPost } from '@/lib/news';
import { useParams } from 'next/navigation';

export default function NewsDetailPage() {
  const params = useParams<{ newsId: string }>();
  const newsId = params.newsId;

  const [post, setPost] = useState<NewsPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const [postResponse, newsResponse] = await Promise.all([
          fetch(`/api/news/${newsId}`, { cache: 'no-store' }),
          fetch('/api/news', { cache: 'no-store' }),
        ]);

        const postData = await postResponse.json();
        const newsData = await newsResponse.json();

        if (postResponse.ok) {
          setPost(postData);

          if (newsResponse.ok) {
            const related = newsData
              .filter((p: NewsPost) => p.id !== newsId && p.category === postData.category)
              .slice(0, 3);
            setRelatedPosts(related);
          }
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error(error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    if (newsId) loadPost();
  }, [newsId]);

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-4">Post Not Found</h1>
          <p className="text-foreground/70 mb-8">The news post you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/news">
            <Button className="bg-secondary hover:bg-secondary/90 text-white">
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 sticky top-0 z-40 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/news">
            <Button variant="ghost" className="gap-2 text-foreground/70 hover:text-secondary">
              <ChevronLeft size={20} /> Back to News
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="rounded-2xl overflow-hidden shadow-lg mb-12 h-96 sm:h-[500px]">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-2 text-foreground/70">
            <Tag size={18} className="text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              {post.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-foreground/70">
            <Calendar size={18} />
            <span className="text-sm">{formatDate(post.publishDate)}</span>
          </div>

          <div className="flex-1" />

          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            <Share2 size={18} />
            <span className="text-sm font-semibold">Share</span>
          </button>
        </div>

        <article>
          <h1 className="text-3xl sm:text-5xl font-bold text-secondary mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-foreground/80 leading-relaxed mb-8 italic border-l-4 border-primary pl-6 py-2">
              {post.excerpt}
            </p>

            <div className="text-lg text-foreground/70 leading-relaxed space-y-6 whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-secondary mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((item) => (
                <NewsCard key={item.id} post={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}