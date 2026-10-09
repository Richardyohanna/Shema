'use client';

import { ChevronLeft, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Testimony } from '@/lib/testimonies';
import type { EventRecord } from '@/lib/events';
import { getYouTubeId, getYouTubeStartSeconds } from '@/lib/youtube';
import { YouTubeEmbed } from '@/components/youtube-embed';

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
  createdAt?: string;
  updatedAt?: string;
  beneficiaryStories?: BeneficiaryStory[];
  gallery?: string[];
  testimonies?: Testimony[];
  events?: EventRecord[];
}

function isDirectVideo(value: string | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value) && /\.(mp4|mov|webm|ogg|m4v)(?:[?#].*)?$/i.test(value));
}

function ServicePageSkeleton() {
  return (
    <main className="bg-white min-h-screen">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-12 w-72 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        <div className="h-96 sm:h-[500px] bg-gray-200 rounded-xl animate-pulse" />

        <div className="space-y-4">
          <div className="h-10 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-4/5 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="bg-gray-200 rounded-xl p-8 sm:p-12 animate-pulse">
          <div className="h-10 w-40 bg-white/40 rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="h-24 bg-white/40 rounded" />
            <div className="h-24 bg-white/40 rounded" />
            <div className="h-24 bg-white/40 rounded" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-10 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ServicePage() {
  const params = useParams<{ serviceId: string }>();
  const serviceId = params.serviceId;

  const [service, setService] = useState<ServiceItem | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedStoryId, setExpandedStoryId] = useState<string | number | null>(null);

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

          setLoadError(data?.error || 'Failed to load service.');
          return;
        }

        setService(data);
      } catch (error) {
        console.error('Failed to load service:', error);
        setLoadError('Failed to load service.');
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      loadService();
    }
  }, [serviceId]);

  const gallery = useMemo(() => service?.gallery || [], [service]);
  const selectedImage =
    selectedImageIndex !== null ? gallery[selectedImageIndex] : null;

  const showPreviousImage = () => {
    if (selectedImageIndex === null || gallery.length === 0) return;
    setSelectedImageIndex(
      (selectedImageIndex - 1 + gallery.length) % gallery.length
    );
  };

  const showNextImage = () => {
    if (selectedImageIndex === null || gallery.length === 0) return;
    setSelectedImageIndex((selectedImageIndex + 1) % gallery.length);
  };

  if (isLoading) {
    return <ServicePageSkeleton />;
  }

  if (loadError) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-4">
            Failed to Load Service
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

  if (!service) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-4">
            Service Not Found
          </h1>
          <p className="text-foreground/70 mb-8">
            The service you are trying to view does not exist.
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/#services"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-4"
          >
            <ChevronLeft size={20} />
            Back to Services
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-secondary">
            {service.title}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <section className="mb-16">
          <div className="relative h-96 sm:h-[500px] rounded-xl overflow-hidden shadow-xl">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-8">
            About This Service
          </h2>
          <div className="prose prose-lg max-w-none">
            {service.description.split('\n').map((paragraph, idx) => (
              <p
                key={idx}
                className="text-foreground/80 leading-relaxed mb-4 text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="mb-16 bg-secondary text-white rounded-xl p-8 sm:p-12">
          <h2 className="text-3xl font-bold mb-8">Our Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {Object.entries(service.impact || {}).map(([key, value]) => (
              <div key={key}>
                <div className="text-3xl sm:text-4xl font-bold mb-2">
                  {value}
                </div>
                <p className="text-white/80 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16" id="stories">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-12">
            Stories of Impact
          </h2>

          {service.testimonies && service.testimonies.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {service.testimonies.map((story) => {
                const videoId = story.videoId || (story.videoUrl ? getYouTubeId(story.videoUrl) : null);
                const fullStory = story.fullStory || "";
                return (
                  <article key={story.id} className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-md">
                    {videoId && story.videoUrl ? (
                      <YouTubeEmbed
                        videoId={videoId}
                        title={story.title}
                        startSeconds={getYouTubeStartSeconds(story.videoUrl)}
                        videoUrl={story.videoUrl}
                      />
                    ) : isDirectVideo(story.videoUrl) ? (
                      <video src={story.videoUrl} controls preload="metadata" className="aspect-video w-full bg-black" />
                    ) : story.imageUrl ? (
                      <img src={story.imageUrl} alt={story.name} className="h-64 w-full object-cover object-top" />
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-gray-100 text-sm text-gray-500">Story image not available</div>
                    )}
                    <div className="p-6 sm:p-8">
                      <p className="mb-2 text-sm font-medium text-primary">{story.role}</p>
                      <h3 className="mb-3 text-2xl font-bold text-secondary">{story.title}</h3>
                      <p className="mb-5 text-foreground/80 leading-relaxed">{story.summary || story.description}</p>
                      {fullStory && (
                        <>
                          {expandedStoryId === story.id && (
                            <p className="mb-5 whitespace-pre-line text-foreground/80 leading-relaxed">{fullStory}</p>
                          )}
                          <button
                            type="button"
                            aria-expanded={expandedStoryId === story.id}
                            onClick={() => setExpandedStoryId(expandedStoryId === story.id ? null : story.id)}
                            className="font-semibold text-primary hover:underline"
                          >
                            {expandedStoryId === story.id ? "Show less" : "Read full story"}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : !service.beneficiaryStories || service.beneficiaryStories.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
              <p className="text-foreground/70 text-lg">
                No beneficiary stories available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {service.beneficiaryStories.map((story) => (
                <Link
                  key={story.id}
                  href={`/services/${service.slug}/beneficiaries/${story.slug}`}
                >
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition border border-gray-200 h-full cursor-pointer group">
                    <div className="relative h-94 overflow-hidden">
                      <img
                        src={story.image}
                        alt={story.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6 sm:p-8">
                      <h3 className="text-2xl font-bold text-secondary mb-4">
                        {story.name}
                      </h3>
                      <p className="text-foreground/80 leading-relaxed italic mb-6">
                        "{story.story}"
                      </p>
                      <div className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                        Read Full Story
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mb-16" id="events">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-12">Events</h2>
          {!service.events?.length ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
              <p className="text-foreground/70 text-lg">No published events for this service yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {service.events.map((event) => {
                const linkedTestimonies = service.testimonies?.filter((story) => story.eventId === event.id) ?? [];
                const galleryImages = [event.coverImageUrl, ...event.gallery].filter((image): image is string => Boolean(image));
                return (
                  <article key={event.id} className="rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
                    <div className="flex flex-col gap-6 md:flex-row">
                      {event.coverImageUrl && <img src={event.coverImageUrl} alt={event.title} className="h-56 w-full rounded-lg object-cover md:w-1/3" />}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-primary">{event.date}{event.location ? ` · ${event.location}` : ""}</p>
                        <h3 className="mt-2 text-2xl font-bold text-secondary">{event.title}</h3>
                        {event.description && <p className="mt-3 whitespace-pre-line text-foreground/80">{event.description}</p>}
                      </div>
                    </div>
                    {galleryImages.length > 0 && (
                      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {galleryImages.map((image, index) => (
                          <img key={`${event.id}-gallery-${index}`} src={image} alt={`${event.title} gallery ${index + 1}`} className="h-36 w-full rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                    <div className="mt-6">
                      <h4 className="mb-4 text-lg font-semibold text-secondary">Event testimonies</h4>
                      {linkedTestimonies.length ? (
                        <div className="grid gap-5 md:grid-cols-2">
                          {linkedTestimonies.map((story) => {
                            const videoId = story.videoId || (story.videoUrl ? getYouTubeId(story.videoUrl) : null);
                            return (
                              <div key={story.id} className="rounded-lg bg-white p-4">
                                {videoId && story.videoUrl && <YouTubeEmbed videoId={videoId} title={story.title} startSeconds={getYouTubeStartSeconds(story.videoUrl)} videoUrl={story.videoUrl} />}
                                <h5 className="mt-3 font-semibold text-secondary">{story.title}</h5>
                                <p className="text-sm text-foreground/70">{story.name} · {story.role}</p>
                                <p className="mt-2 text-sm text-foreground/80">{story.summary || story.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/70">No testimonies are linked to this event yet.</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-12">
            Gallery
          </h2>

          {gallery.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
              <p className="text-foreground/70 text-lg">
                No gallery images available yet.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-6 min-w-full sm:min-w-0 sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {gallery.map((image, idx) => (
                    <div
                      key={`${service.id}-${idx}`}
                      className="relative h-64 sm:h-72 w-80 sm:w-full flex-shrink-0 sm:flex-shrink rounded-lg overflow-hidden shadow-md hover:shadow-xl transition group cursor-pointer"
                      onClick={() => setSelectedImageIndex(idx)}
                    >
                      <img
                        src={image}
                        alt={`${service.title} gallery ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition">
                          <div className="text-white text-sm font-semibold bg-black/60 px-4 py-2 rounded">
                            Click to view
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {gallery.length > 0 && (
                <p className="text-sm text-foreground/60 mt-4 sm:hidden">
                  💡 Scroll horizontally to see more photos
                </p>
              )}
            </>
          )}
        </section>

        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition z-10"
            >
              <X size={28} />
            </button>

            <div className="flex items-center gap-4 max-w-5xl w-full">
              <button
                onClick={showPreviousImage}
                className="text-white hover:bg-white/20 p-2 rounded-full transition hidden sm:flex"
              >
                <ChevronLeft size={32} />
              </button>

              <div className="flex-1 flex justify-center">
                <img
                  src={selectedImage}
                  alt={`${service.title} gallery preview`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>

              <button
                onClick={showNextImage}
                className="text-white hover:bg-white/20 p-2 rounded-full transition hidden sm:flex"
              >
                <ChevronRight size={32} />
              </button>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/60 px-4 py-2 rounded-full text-sm">
              {selectedImageIndex! + 1} / {gallery.length}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}