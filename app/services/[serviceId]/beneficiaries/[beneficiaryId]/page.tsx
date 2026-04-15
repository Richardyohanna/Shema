'use client';

import { ChevronLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

interface BeneficiaryStory {
  id: string;
  serviceId?: string;
  slug: string;
  name: string;
  story: string;
  fullStory: string;
  image: string;
  createdAt?: string;
}

interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  image: string;
  impact: Record<string, string>;
  beneficiaryStories?: BeneficiaryStory[];
}

function BeneficiaryPageSkeleton() {
  return (
    <main className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-12 w-72 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10">
        <div className="space-y-4">
          <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-5/6 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="h-96 sm:h-[650px] bg-gray-200 rounded-xl animate-pulse" />

        <div className="h-14 w-40 bg-gray-200 rounded-lg animate-pulse ml-auto" />

        <div className="bg-gray-100 rounded-xl p-8 sm:p-12">
          <div className="h-8 w-52 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BeneficiaryPage() {
  const params = useParams<{ serviceId: string; beneficiaryId: string }>();
  const { serviceId, beneficiaryId } = params;

  const [service, setService] = useState<ServiceItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadService = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch(`/api/services/${serviceId}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setService(null);
            return;
          }

          setLoadError(data?.error || 'Failed to load beneficiary story.');
          return;
        }

        setService(data);
      } catch (error) {
        console.error('Failed to load beneficiary page:', error);
        setLoadError('Failed to load beneficiary story.');
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      loadService();
    }
  }, [serviceId]);

  const beneficiary = useMemo(
    () => service?.beneficiaryStories?.find((b) => b.slug === beneficiaryId),
    [service, beneficiaryId]
  );

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  if (isLoading) {
    return <BeneficiaryPageSkeleton />;
  }

  if (loadError) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-4">
            Failed to Load Story
          </h1>
          <p className="text-foreground/70 mb-8">{loadError}</p>
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90">
              Back to Home
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  if (!service || !beneficiary) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-4">
            Story Not Found
          </h1>
          <p className="text-foreground/70 mb-8">
            The beneficiary story you are trying to view does not exist.
          </p>
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90">
              Back to Home
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/services/${service.slug}#stories`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-4"
          >
            <ChevronLeft size={20} />
            Back to {service.title}
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-secondary">
            {beneficiary.name}
          </h1>
          <p className="text-foreground/60 mt-2">{service.title} Program</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <section className="mb-16">
          <div className="prose prose-lg max-w-none">
            {beneficiary.fullStory.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-foreground/80 leading-relaxed mb-6 text-lg">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <img
            src={beneficiary.image}
            alt={beneficiary.name}
            className="w-full max-h-[700px] object-contain mx-auto rounded-xl shadow-xl"
          />
        </section>

        <div className="flex justify-end mb-8">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-secondary font-semibold rounded-lg transition"
          >
            <Share2 size={20} />
            {copied ? 'Link Copied!' : 'Share Story'}
          </button>
        </div>

        <section className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 sm:p-12 border border-primary/20 mb-16">
          <h2 className="text-2xl font-bold text-secondary mb-6">
            Impact of This Program
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {Object.entries(service.impact || {}).map(([key, value]) => (
              <div key={key}>
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                  {value}
                </div>
                <p className="text-foreground/70 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}