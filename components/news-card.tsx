import Link from 'next/link';
import { NewsPost } from '@/lib/news-storage';
import { ChevronRight, Calendar, Tag } from 'lucide-react';

interface NewsCardProps {
  post: NewsPost;
  featured?: boolean;
}

export function NewsCard({ post, featured = false }: NewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (featured) {
    return (
      <Link href={`/news/${post.id}`}>
        <div className="group cursor-pointer">
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 mb-6">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Tag size={16} className="text-primary" />
              <span className="text-primary font-semibold uppercase text-xs tracking-wider">{post.category}</span>
              <span className="text-foreground/40">•</span>
              <Calendar size={16} className="text-foreground/60" />
              <span className="text-foreground/60">{formatDate(post.publishDate)}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-secondary group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <p className="text-foreground/70 text-lg leading-relaxed">
              {post.excerpt}
            </p>
            <div className="pt-3 flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
              Read More <ChevronRight size={20} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/news/${post.id}`}>
      <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 h-full flex flex-col cursor-pointer">
        <div className="relative h-56 overflow-hidden bg-gray-200">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 right-4">
            <span className="bg-primary/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {post.category}
            </span>
          </div>
        </div>
        
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs text-foreground/60 mb-3">
            <Calendar size={14} />
            <span>{formatDate(post.publishDate)}</span>
          </div>
          
          <h3 className="text-lg font-bold text-secondary mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          
          <p className="text-foreground/70 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
            {post.excerpt}
          </p>
          
          <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
            Learn More <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </Link>
  );
}
