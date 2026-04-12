'use client';

import { ChevronLeft, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';

export default function StoryPage() {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const galleryImages = [
    {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-rcCgTV0gwRW1rbww8I7AD54ufOjF73.png',
      alt: 'SHEMA community outreach program',
    },
    {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-GQ85XJH7PZy0G6uPqlhXCvDT8Qo0i3.png',
      alt: 'SHEMA community gathering',
    },
    {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-e46ilDNlN2NWjaVwqBZo0M3gA1oy1k.png',
      alt: 'SHEMA training program',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001117150.jpg.jpeg',
      alt: 'SHEMA community event',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069477.jpg.jpeg',
      alt: 'SHEMA community support',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069479.jpg.jpeg',
      alt: 'SHEMA community empowerment',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069480.jpg.jpeg',
      alt: 'SHEMA community development',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069481.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069486.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069487.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069492.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069497.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069503.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069505.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069506.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069532.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069547.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069587.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069588.jpg.jpeg',
      alt: 'SHEMA community transformation',
    },
    {
      src: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001069594.jpg.jpeg',
      alt: 'SHEMA community transformation',
    }
  ];

  const coreValues = [
    {
      title: 'Compassion',
      description: 'Demonstrating empathy and kindness toward those in need.',
    },
    {
      title: 'Integrity',
      description: 'Upholding transparency, accountability, and honesty in all we do.',
    },
    {
      title: 'Social Concern',
      description: 'Unconditional care for all who are in need.',
    },
    {
      title: 'Unity',
      description: 'Embracing diversity and promoting inclusivity across all divides.',
    },
    {
      title: 'Kindness',
      description: 'Extending generous and compassionate support to the needy.',
    },
    {
      title: 'Global Solidarity',
      description: 'Partnering with stakeholders to create a united front against inequality.',
    },
  ];

  useEffect(() => {
    if (selectedImageIndex !== null) return;

    const container = scrollRef.current;
    if (!container) return;

    let interval: NodeJS.Timeout;

    const startAutoScroll = () => {
      interval = setInterval(() => {
        const maxScrollLeft = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScrollLeft - 5) {
          container.scrollTo({
            left: 0,
            behavior: 'smooth',
          });
        } else {
          container.scrollBy({
            left: 320,
            behavior: 'smooth',
          });
        }
      }, 2500);
    };

    const stopAutoScroll = () => {
      clearInterval(interval);
    };

    startAutoScroll();

    container.addEventListener('mouseenter', stopAutoScroll);
    container.addEventListener('mouseleave', startAutoScroll);
    container.addEventListener('touchstart', stopAutoScroll);
    container.addEventListener('touchend', startAutoScroll);

    return () => {
      clearInterval(interval);
      container.removeEventListener('mouseenter', stopAutoScroll);
      container.removeEventListener('mouseleave', startAutoScroll);
      container.removeEventListener('touchstart', stopAutoScroll);
      container.removeEventListener('touchend', startAutoScroll);
    };
  }, [selectedImageIndex]);

  const showPreviousImage = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex - 1 + galleryImages.length) % galleryImages.length);
  };

  const showNextImage = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % galleryImages.length);
  };

  return (
    <main className="bg-white">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-4">
            <ChevronLeft size={20} />
            Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-secondary mb-4">Our Story</h1>
          <p className="text-lg text-foreground/70 max-w-2xl">
            Discover how SHEMA was founded and the journey that drives our mission to empower vulnerable communities.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-6">
                Founded on a Vision of Hope
              </h2>
              <div className="space-y-4 text-foreground/80">
               <p> SHEMA was born in the heart of  Maiduguri, Borno State a place that has witnessed pain, resilience, and the silent strength of its people. </p>

               <p>  It began with a small group of passionate individuals, united not just by profession, but by a shared burden for humanity.</p>
               <p>  From engineers to educators, from voices of knowledge to voices of faith, each member brought more than skills — they brought compassion, empathy, and a deep desire to make a difference where it mattered most.</p>
               <p>  They had seen the tears of widows. </p>
               <p>   They had heard the silent cries of orphans and vulnerable groups .</p>
               <p> They had witnessed communities struggling not just to survive, but to find hope again.</p>
               <p> And in those moments, they knew — something had to be done.</p>
               <p> Driven by the belief that people deserve more than temporary relief, SHEMA was created as a platform for lasting impact. A place where lives are not just supported, but restored. Where dignity is not just spoken about, but given back. Where hope is not just imagined, but made real.</p>
               <p>  What started as a small, humble initiative has now grown into a movement — a movement of love, of compassion, and of unwavering commitment. Today, SHEMA continues to touch thousands of lives across Nigeria, proving that when people come together with a heart to serve, even the smallest beginning can become a powerful force for change.</p>
               <p>   At its core, SHEMA is more than an organization — It is a voice for the forgotten, A hand for the broken,  And a light for those searching for hope. </p>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative rounded-xl overflow-hidden shadow-xl">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-rcCgTV0gwRW1rbww8I7AD54ufOjF73.png"
                  alt="SHEMA Community"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-20 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 rounded-xl p-8 sm:p-12 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            <div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Our Mission</h3>
              <p className="text-foreground/80 leading-relaxed">
                To provide compassionate support, empowering individuals and communities to thrive, while fostering a culture of unity, peace, empathy, and love.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Our Vision</h3>
              <p className="text-foreground/80 leading-relaxed">
                We envision a world where every vulnerable and less privileged individual is empowered with dignity, hope, and opportunity.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-3xl font-bold text-secondary mb-8">Our Mandate</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-10">
            <p className="text-foreground/80 leading-relaxed text-lg">
              Rooted in the restoration of human dignity, guided by unity and love for God and humanity, SHEMA is committed to providing holistic care and support to those in need. Through collaboration, advocacy, and inclusive development, we strive to build a future where no one is left behind—where every individual has access to basic needs and the opportunity to live with dignity.
            </p>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-3xl font-bold text-secondary mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreValues.map((value, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <h3 className="text-xl font-bold text-secondary mb-3">{value.title}</h3>
                <p className="text-foreground/70">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-3xl font-bold text-secondary mb-12">Our Journey in Pictures</h2>

          <div
            ref={scrollRef}
            className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
          >
            <div className="flex gap-6 w-max">
              {galleryImages.map((image, idx) => (
                <div
                  key={idx}
                  className="relative h-64 sm:h-80 w-80 sm:w-[400px] flex-shrink-0 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition group cursor-pointer"
                  onClick={() => setSelectedImageIndex(idx)}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
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

        </section>

        {selectedImageIndex !== null && (
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
                  src={galleryImages[selectedImageIndex].src}
                  alt={galleryImages[selectedImageIndex].alt}
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
              {selectedImageIndex + 1} / {galleryImages.length}
            </div>
          </div>
        )}

        <section className="mb-20 bg-secondary text-white rounded-xl p-8 sm:p-12">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Impact by Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '100+', label: 'Lives Touched' },
              { number: '1+', label: 'Communities Served' },
              { number: '3+', label: 'Programs Delivered' },
              { number: '2+', label: 'Years of Service' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2">{stat.number}</div>
                <p className="text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-bold text-secondary mb-6">Be Part of Our Story</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto mb-8">
            Join us in our mission to empower vulnerable communities and create lasting change.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#partnership">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold w-full sm:w-auto">
                Become a Partner
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Return Home
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}