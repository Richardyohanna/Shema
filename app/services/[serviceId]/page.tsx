'use client';

import { ChevronLeft, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, use } from 'react';
import { getServiceById, servicesData } from '@/lib/services-data';

interface ServicePageProps {
  params: Promise<{
    serviceId: string;
  }>;
}

export default function ServicePage({ params }: ServicePageProps) {
  const { serviceId } = use(params);
  const [service] = useState(getServiceById(serviceId));
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!service) {
    return (
      <main className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary mb-4">Service Not Found</h1>
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90">Back to Home</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white">
      {/* Header with Back Button */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/#services" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-4">
            <ChevronLeft size={20} />
            Back to Services
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-secondary">{service.title}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Hero Image */}
        <section className="mb-16">
          <div className="relative h-96 sm:h-[500px] rounded-xl overflow-hidden shadow-xl">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Service Description */}
        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-8">About This Service</h2>
          <div className="prose prose-lg max-w-none">
            {service.description.split('\n').map((paragraph, idx) => (
              <p key={idx} className="text-foreground/80 leading-relaxed mb-4 text-lg">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* Impact Metrics */}
        <section className="mb-16 bg-secondary text-white rounded-xl p-8 sm:p-12">
          <h2 className="text-3xl font-bold mb-8">Our Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {Object.entries(service.impact).map(([key, value]) => (
              <div key={key}>
                <div className="text-3xl sm:text-4xl font-bold mb-2">{value}</div>
                <p className="text-white/80 capitalize">
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .trim()
                    .toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Beneficiary Stories */}
        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-12">Stories of Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {service.beneficiaryStories.map((story, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition border border-gray-200">
                <img
                  src={story.image}
                  alt={story.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6 sm:p-8">
                  <h3 className="text-2xl font-bold text-secondary mb-4">{story.name}</h3>
                  <p className="text-foreground/80 leading-relaxed italic">
                    "{story.story}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-12">Gallery</h2>
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-6 min-w-full sm:min-w-0 sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {service.gallery.map((image, idx) => (
                <div
                  key={idx}
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
                      <div className="text-white text-sm font-semibold bg-black/60 px-4 py-2 rounded">Click to view</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {service.gallery.length > 0 && (
            <p className="text-sm text-foreground/60 mt-4 sm:hidden">💡 Scroll horizontally to see more photos</p>
          )}
        </section>

        {/* Full Image Modal */}
        {selectedImageIndex !== null && service.gallery.length > 0 && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition"
            >
              <X size={28} />
            </button>

            <div className="flex items-center gap-4 max-w-4xl w-full">
              {/* Previous Button */}
              <button
                onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + service.gallery.length) % service.gallery.length)}
                className="text-white hover:bg-white/20 p-2 rounded-full transition hidden sm:flex"
              >
                <ChevronLeft size={32} />
              </button>

              {/* Image Container */}
              <div className="flex-1 flex justify-center">
                <img
                  src={service.gallery[selectedImageIndex]}
                  alt={`${service.title} gallery ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              </div>

              {/* Next Button */}
              <button
                onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % service.gallery.length)}
                className="text-white hover:bg-white/20 p-2 rounded-full transition hidden sm:flex"
              >
                <ChevronRight size={32} />
              </button>
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/60 px-4 py-2 rounded-full text-sm">
              {selectedImageIndex + 1} / {service.gallery.length}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 sm:p-12 border border-gray-200 text-center">
          <h2 className="text-3xl font-bold text-secondary mb-4">Make a Difference</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto mb-8">
            Your support helps us continue this vital work. Whether through volunteering, donating, or spreading awareness, you can be part of transforming lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#partnership">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold w-full sm:w-auto">
                Support This Service
              </Button>
            </Link>
            <Link href="/story">
              <Button variant="outline" className="w-full sm:w-auto">
                Learn Our Story
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
