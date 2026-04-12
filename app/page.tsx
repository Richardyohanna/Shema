'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Menu, X, ChevronRight, Heart, Users, BookOpen, Lightbulb, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';  
import { PartnerModal } from '@/components/partner-modal';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    partnershipType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, partnershipType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send email via API route
      const response = await fetch('/api/partner-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          organization: '',
          partnershipType: '',
          message: '',
        });
        setTimeout(() => {
          setSubmitted(false);
         
        }, 2000);
      } else {
        alert('Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Services data
  const servicesData = [
    {
      id: 'trauma-recovery',
      title: 'Trauma Recovery',
      shortDescription: 'Counseling, mentorship, and restorative discipleship for healing and recovery',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1001069628.jpg-8cYMLLBTQKctxoncjb3a6MnAcFQxvK.jpeg',
    },
    {
      id: 'practical-support',
      title: 'Practical Support',
      shortDescription: 'Food, shelter, and essential resources for the most vulnerable',
      image: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/1001117122.jpg.jpeg',//'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-e46ilDNlN2NWjaVwqBZo0M3gA1oy1k.png',
    },
    {
      id: 'financial-support',
      title: 'Financial Support',
      shortDescription: 'Grants, scholarships, and economic empowerment initiatives',
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-e46ilDNlN2NWjaVwqBZo0M3gA1oy1k.png', //'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-GQ85XJH7PZy0G6uPqlhXCvDT8Qo0i3.png',
    },
    {
      id: 'community-building',
      title: 'Community Building',
      shortDescription: 'Education, workshops, seminars, and social engagement programs',
      image: 'https://pltuxx4q1i7colum.public.blob.vercel-storage.com/kulka%20community.png',
    },
  ];

  const heroSlides = [
    {
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-rcCgTV0gwRW1rbww8I7AD54ufOjF73.png',
      title: 'Strengthening Humanity through Empowerment, Mentorship, and Advocacy',
      subtitle: 'Transforming lives and restoring dignity to vulnerable communities in Nigeria',
    },
    {
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-GQ85XJH7PZy0G6uPqlhXCvDT8Qo0i3.png',
      title: 'Community Impact Through Direct Support',
      subtitle: 'We serve widows, orphans, and marginalized communities with practical assistance and hope',
    },
    {
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/3-e46ilDNlN2NWjaVwqBZo0M3gA1oy1k.png',
      title: 'Education & Empowerment Programs',
      subtitle: 'Equipping communities with skills, knowledge, and opportunities to thrive',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToHero = () => {
  const heroSection = document.getElementById('hero');
    if (heroSection) {
      heroSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-KtnZuXrQpfsOSAzAMlc8jMwLJshwuj.png" 
                alt="SHEMA Logo" 
                className="h-10 w-10"
              />
              <span className="font-bold text-lg text-secondary">SHEMA</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#about" className="text-foreground hover:text-primary transition">About</Link>
              <Link href="#team" className="text-foreground hover:text-primary transition">Team</Link>
              <Link href="#services" className="text-foreground hover:text-primary transition">Services</Link>
              <Link href="#partnership" className="text-foreground hover:text-primary transition">Partnership</Link>
              <Link href="#contact" className="text-foreground hover:text-primary transition">Contact</Link>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setPartnerModalOpen(true)}
              >
                Partner With Us
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 flex flex-col gap-3">
              <Link href="#about" className="text-foreground hover:text-primary">About</Link>
              <Link href="#team" className="text-foreground hover:text-primary transition">Team</Link>
              <Link href="#services" className="text-foreground hover:text-primary">Services</Link>
              <Link href="#partnership" className="text-foreground hover:text-primary">Partnership</Link>
              <Link href="#contact" className="text-foreground hover:text-primary">Contact</Link>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Partner With Us
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Carousel */}
      <section id="hero" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Carousel Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/50"></div>
            </div>
          </div>
        ))}

        {/* Content Overlay */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 ease-out ${
            'opacity-100 translate-y-0'
          }`}>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 text-balance leading-tight drop-shadow-lg">
              {heroSlides[currentSlide].title}
            </h1>
          </div>
          <div className={`transition-all duration-1000 delay-300 ease-out ${
            'opacity-100 translate-y-0'
          }`}>
            <p className="text-lg sm:text-xl lg:text-2xl text-white mb-8 text-balance max-w-3xl mx-auto leading-relaxed drop-shadow-md font-medium">
              {heroSlides[currentSlide].subtitle}
            </p>
          </div>
          <div className={`transition-all duration-1000 delay-500 ease-out ${
            'opacity-100 translate-y-0'
          }`}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/story">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Learn More <ChevronRight className="ml-2" size={20} />
                </Button>
              </Link>
              
              <Link href="#contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                >
                  Get Involved
                </Button>
              </Link>
              
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'bg-primary w-8 h-3'
                    : 'bg-white/40 hover:bg-white/60 w-3 h-3'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-4">About SHEMA</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              SHEMA is a non-governmental organization founded on the principle that every human being deserves care, opportunity, and dignity  regardless of race, faith, or background. Our name is an acronym for Strengthening Humanity through Empowerment, Mentorship, and Advocacy, and it defines everything we do.
              <br/>
              we operate with a singular focus: to equip vulnerable groups including  widows, orphans, and marginalized communities  by providing skills acquisition, knowledge, and support they need to thrive and lead with dignity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-2xl font-bold text-secondary mb-4">Our Mission</h3>
              <p className="text-foreground/80 mb-6 leading-relaxed">
                To provide compassionate support, empowering individuals and communities to thrive, while fostering a culture of unity, peace, empathy, and love.
              </p>
              <h3 className="text-2xl font-bold text-secondary mb-4">Our Vision</h3>
              <p className="text-foreground/80 leading-relaxed">
                We envision a world where every vulnerable and less privileged individual is empowered with dignity, hope, and opportunity.
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8 border border-primary/20">
              <h3 className="text-xl font-bold text-secondary mb-6">What We Do</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="text-primary font-bold text-lg">WHO</span>
                  <p className="text-foreground/80">SHEMA — Strengthening Humanity through Empowerment, Mentorship, and Advocacy</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary font-bold text-lg">WHAT</span>
                  <p className="text-foreground/80">Empowers lives of vulnerable, widowed, orphaned, and marginalized communities</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary font-bold text-lg">HOW</span>
                  <p className="text-foreground/80">Through skills training, knowledge sharing, mentorship, and practical support</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-primary font-bold text-lg">OUTCOME</span>
                  <p className="text-foreground/80">Individuals thrive, lead, and live with dignity</p>
                </div>
              </div>
            </div>
          </div>

          {/* Founder Section */}
          <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-xl p-8 sm:p-12 border border-gray-200 mt-12">
            {/* Top Quote */}
            <p className="text-center text-2xl sm:text-3xl italic text-foreground/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              "We believe every community deserves dignity, opportunity, and hope."
            </p>

            {/* Main Founder Section */}
            <div className="items-center">
              {/* Founder Image - Left Side */}
             {/* <div className="flex justify-center lg:justify-start">
                <div className="w-full max-w-sm">
                  <div className="relative rounded-3xl overflow-hidden shadow-xl w-full h-[410px]">
                    <img
                      src="https://pltuxx4q1i7colum.public.blob.vercel-storage.com/nuhu.jpg" //https://pltuxx4q1i7colum.public.blob.vercel-storage.com/founder.jpeg"
                      alt="Nuhu John Ndavagi - SHEMA Founder"
                      className="w-auto h-auto object-cover scale-x-[-1] "
                    />
                  </div>
                </div>
              </div> */}

              {/* Founder Message - Right Side */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-secondary mb-6 leading-tight">
                  Message
                </h2>
                
                <p className="text-foreground/80 text-lg leading-relaxed mb-8">
                  We started with a simple belief — that small act of service can transform lives. Today, we&apos;re demonstrating that when we come together, even the smallest steps can lead to meaningful change for our communities.
                </p>

                <div>
                 {/* } <h3 className="text-2xl font-bold text-secondary">Nuhu John Ndavagi</h3>
                  <p className="text-primary font-semibold text-lg mb-6">Founder, SHEMA Humanitarian</p> 
                  
                  */}

                  <Link href="/story">
                    <Button className="bg-secondary hover:bg-secondary/90 text-white font-semibold py-6 px-8 text-base">
                      Read Our Story
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section id="team" className="-mt-25 py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <p className="text-foreground/60 font-semibold text-xs uppercase tracking-widest mb-4">Our Leadership</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary mb-6 leading-tight">Meet Our Team</h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Dedicated professionals with diverse expertise and a shared commitment to transforming lives and creating lasting impact in vulnerable communities across Nigeria
            </p>
          </div>
         
         {/*Founder */}
          
           <div className="flex justify-center items-center -mt-10 mb-15">
            {/* Nuhu */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 max-w-sm w-full">
              
              <div className="h-80 sm:h-96 bg-gray-200 overflow-hidden relative">
                <img
                  src="https://pltuxx4q1i7colum.public.blob.vercel-storage.com/founder.jpeg" //https://pltuxx4q1i7colum.public.blob.vercel-storage.com/nuhu.jpg"
                  alt="Nuhu John Ndavagi - SHEMA Founder"
                  className="w-full h-full object-cover object-[center_40%] group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Nuhu John Ndavagi</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">Chief Executive Officer</p>
              </div>

            </div>
          </div>
         

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Roland Jacob */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="h-80 sm:h-96 bg-gray-200 overflow-hidden relative">
                <img
                  src="https://pltuxx4q1i7colum.public.blob.vercel-storage.com/Roland.jpg" //https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Roland%20Jacob-sd6rfiovKzaGDclK0kEobruATM3Otw.jpeg"
                  alt="Roland Jacob"
                  className="w-full h-full object-cover object-[center_40%] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Roland Jacob</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">Executive Director</p>
              </div>
            </div>

            {/* Precious Hosea */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="h-80 sm:h-96 bg-gray-200 overflow-hidden relative">
                <img
                  src="https://pltuxx4q1i7colum.public.blob.vercel-storage.com/Precious.jpg" //https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Precios%20Hosea-ZtFyY7Vq5237AHyPWJxc683m8WPFsz.jpeg"
                  alt="Precious Hosea"
                  className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Precious Hosea</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">Executive Secretary</p>
              </div>
            </div>

            {/* Emmanuel Amos */}
           {/*} <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="h-80 sm:h-96 bg-gray-200 overflow-hidden relative">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Emmanuel%20Amos-JfSyDBjrrRiAoJ66m4Ta2gSyaS6ZZ5.jpeg"
                  alt="Emmanuel Amos"
                  className="w-full h-full object-cover object-[center_10%] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Emmanuel Amos</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">Head of Program</p>
              </div>
            </div> */}

            {/* Alex Wulsog */}
           {/*} <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="h-80 sm:h-96 bg-gray-200 overflow-hidden relative">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Alex%20Wuslong-gh54rAPzWm8dNBioD3bMsyonm33jOB.jpeg"
                  alt="Alex Wulsog"
                  className="w-full h-full-45 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Alex Wulsog</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">Head of Operation</p>
              </div>
            </div> */}

            {/* Yakubu Joshua - No Photo */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="h-80 sm:h-96 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                <div className="text-center">
                  <div className="text-7xl sm:text-8xl mb-3 opacity-40">🔒</div>
                  <p className="text-foreground/60 text-sm font-medium">Profile kept confidential</p>
                  <p className="text-foreground/50 text-xs mt-1">for security purposes</p>
                </div>
              </div>
              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Yakubu Joshua</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">Head of Finance</p>
              </div>
            </div>

            {/* Ishaya Chingplan Happiness */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="h-80 sm:h-96 bg-gray-200 overflow-hidden relative">
                <img
                  src="https://pltuxx4q1i7colum.public.blob.vercel-storage.com/communicationOfficer.jpeg"
                  alt="Ishaya Chingplang Happiness"
                  className="w-full h-full object-cover object-[center_5%] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Ishaya Chingplang Happiness</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">Communication Officer</p>
              </div>
            </div>

            {/* Nuhu Ashonya Ajiga */}
           {/* <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="h-80 sm:h-96 bg-gray-200 overflow-hidden relative">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nuhu%20Ashonya%20Ajiga-0Boo8IM9hLTIqyWneiut38fclt19Uz.jpeg"
                  alt="Amb Nuhu Ashonya Ajiga"
                  className="w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Amb Nuhu Ashonya Ajiga</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">Partnership & Resources</p>
              </div>
            </div> */}

            {/* Terry M. Pam */}
          {/*  <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="h-80 sm:h-96 bg-gray-200 overflow-hidden relative">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Terrisom%20M.%20Pam-7v4yuIN8qe4iPih5oSvI84Dq04Sklg.jpeg"
                  alt="Terry M. Pam"
                  className="w-full h-full-20 object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Terry M. Pam</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">National Coordinator</p>
              </div>
            </div> */}

             {/* Alpha Ishaya Balami*/}
            {/* <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="h-80 sm:h-96 bg-white overflow-hidden relative">
                <img
                  src="https://pltuxx4q1i7colum.public.blob.vercel-storage.com/Alpha.jpg"
                  alt="Alpha Ishaya Balami"
                  className=" w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:p-8 text-center border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-2">Alpha Ishaya Balami</h3>
                <p className="text-primary font-semibold text-sm sm:text-base">Health Director</p>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 sm:py-24 bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Our Core Values</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: 'Compassion', desc: 'Demonstrating empathy and kindness toward those in need' },
              { icon: Users, title: 'Integrity', desc: 'Transparency, accountability, and honesty in all we do' },
              { icon: BookOpen, title: 'Social Concern', desc: 'Unconditional care for all who are in need' },
              { icon: Lightbulb, title: 'Unity', desc: 'Embracing diversity and promoting inclusivity' },
              { icon: Heart, title: 'Kindness', desc: 'Extending generous and compassionate support' },
              { icon: Users, title: 'Global Solidarity', desc: 'Partnering to create a united front against inequality' },
            ].map((value, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <value.icon size={48} className="mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-white/80">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-foreground/60 font-semibold text-xs uppercase tracking-widest mb-4 letter-spacing-wider">Our Services</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary mb-4 leading-tight">
              How We Make a Difference
            </h2>
            <p className="text-foreground/70 text-lg max-w-2xl mx-auto">We provide comprehensive support across multiple service areas to empower vulnerable communities and create lasting change.</p>
          </div>
          
          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {servicesData.map((service) => (
              <Link key={service.id} href={`/services/${service.id}`}>
                <div
                  className="group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 bg-white cursor-pointer h-full"
                >
                  {/* Image Container */}
                  <div className="relative h-64 sm:h-72 overflow-hidden bg-gray-200">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 sm:p-7">
                    <h3 className="text-xl sm:text-2xl font-bold text-secondary mb-3 leading-tight">{service.title}</h3>
                    <p className="text-foreground/70 text-sm sm:text-base leading-relaxed">
                      {service.shortDescription}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Areas of Concentration */}
          <div className="bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 rounded-xl p-8 sm:p-12 border border-gray-200">
            <h3 className="text-2xl sm:text-3xl font-bold text-secondary mb-3">Areas of Concentration</h3>
            <p className="text-foreground/70 mb-8 max-w-2xl">Our strategic focus areas ensure sustainable impact and meaningful transformation in vulnerable communities.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {[
                {
                  title: 'Sustainable Empowerment',
                  desc: 'Long-term education, skills training, and economic support to break cycles of poverty',
                },
                {
                  title: 'Mental Health Awareness',
                  desc: 'Addressing psychological wellbeing within underserved communities',
                },
                {
                  title: 'Environmental Sustainability',
                  desc: 'Promoting responsible stewardship of our shared environment',
                },
                {
                  title: 'Social Justice & Advocacy',
                  desc: 'Championing the rights and dignity of marginalized populations',
                },
              ].map((area, idx) => (
                <div key={idx} className="bg-white rounded-lg p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10">
                        <div className="h-6 w-6 bg-primary rounded-full opacity-60"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-secondary mb-2">{area.title}</h4>
                      <p className="text-foreground/70 leading-relaxed text-sm">{area.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section id="partnership" className="py-16 sm:py-24 bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">Partnership Opportunities</h2>
          <p className="text-center text-white/80 max-w-2xl mx-auto mb-16">
            Impactful change is never accomplished alone. We cordially invite you to join us in building a better society.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: 'Mentorship Programs',
                desc: 'Share your expertise, wisdom, and skills to empower community members',
              },
              {
                title: 'Community Outreaches',
                desc: 'Join us in visiting communities and engaging with the less privileged',
              },
              {
                title: 'Monetary Donations',
                desc: 'Provide financial support to sustain and expand our programs',
              },
              {
                title: 'In-Kind Donations',
                desc: 'Contribute goods, materials, or resources to benefit those in need',
              },
              {
                title: 'Sponsorship',
                desc: 'Partner with us directly to fund and champion our programs',
              },
              {
                title: 'Prayers & Advocacy',
                desc: 'Uplift our mission through intercession and raising public awareness',
              },
            ].map((opp, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition">
                <h3 className="text-lg font-bold mb-3">{opp.title}</h3>
                <p className="text-white/80 text-sm">{opp.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-primary rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-primary-foreground">Ready to Make a Difference?</h3>
            <p className="text-primary-foreground/90 mb-6">
              Together, we can demonstrate love in action—serving humanity with unity, compassion, and purpose.
            </p>
            <Button 
              size="lg"
              className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary font-semibold"
              onClick={() => setPartnerModalOpen(true)}
            >
              Start Your Partnership Today
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-secondary text-center mb-16">Get In Touch</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-secondary mb-6">Contact Information</h3>
              
            <div className="space-y-8">
                {/* 
                <div>
                  <h4 className="font-bold text-secondary mb-2">Executive Director</h4>
                  <p className="text-foreground/80">Roland Jacob</p>
                  <p className="text-primary font-semibold">+234 9033 072 314</p>
                  <p className="text-foreground/70 break-all">shemahumanitarianservices@gmail.com</p>
                </div>

                <div>
                  <h4 className="font-bold text-secondary mb-2">Founder & CEO</h4>
                  <p className="text-foreground/80">Nuhu John Ndavagi</p>
                  <p className="text-primary font-semibold">+234 9029 615 664</p>
                  <p className="text-foreground/70">Maiduguri, Borno State, Nigeria</p>
                </div>
              */}

                <div>
                  <h4 className="font-bold text-secondary mb-2">Communication Officer</h4>
                  <p className="text-foreground/80">Happiness Ishaya Chingplang</p>
                  <p className="text-primary font-semibold">+234 8169 306 560</p>
                  <ul>
                    <li>
                      <a href="https://web.facebook.com/profile.php?id=61578723781841" className="hover:text-white transition"><img src="/facebookBlack.png" alt="Facebook" className="h-10 w-10 inline-block mr-5 filter grayscale hover:grayscale-10 transition" /></a>
                      <a href="https://www.youtube.com/@shemahumanitarianservice?fbclid=IwY2xjawREUlZleHRuA2FlbQIxMABicmlkETFQRmpqN0lSV3JtYktSb3N1c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHhpHvKEdi8SyimrCS_otogqCFusJ5_eKXBzY-aNHbK24S2QlHl9WrwW2s0O5_aem_SjkeKZT8CEi9IltxpxWLeQ" className="hover:text-white transition"><img src="/youtubeBlack.png" alt="Twitter" className="h-10 w-10 inline-block mr-5" /></a>
                      <a href="https://www.instagram.com/shemahumanitarianservice?fbclid=IwY2xjawREUfpleHRuA2FlbQIxMABicmlkETFQRmpqN0lSV3JtYktSb3N1c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHhpHvKEdi8SyimrCS_otogqCFusJ5_eKXBzY-aNHbK24S2QlHl9WrwW2s0O5_aem_SjkeKZT8CEi9IltxpxWLeQ" className="hover:text-white transition"><img src="/instagramBlack.png" alt="Instagram" className="h-10 w-10 inline-block mr-5" /></a>
                    </li> 
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-secondary mb-6">Send us a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                  <input 
                    name="name"
                    type="text"
                    placeholder="Your name"
                    onChange={handleChange}
                    value={formData.name}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <input 
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Organization</label>
                  <input 
                    name="organization"
                    type="text"
                    placeholder="Your organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Interest</label>
                <Select value={formData.partnershipType} onValueChange={handleSelectChange}>
                  <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-primary bg-gray-50 h-11 rounded-lg">
                    <SelectValue placeholder="Select your interest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentorship">Mentorship Programs</SelectItem>
                    <SelectItem value="outreach">Community Outreaches</SelectItem>
                    <SelectItem value="monetary">Monetary Donations</SelectItem>
                    <SelectItem value="in-kind">In-Kind Donations</SelectItem>
                    <SelectItem value="sponsorship">Sponsorship</SelectItem>
                    <SelectItem value="prayer">Prayers & Advocacy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Message</label>
                  <textarea 
                    name="message"
                    placeholder="Tell us about your partnership interest..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  ></textarea>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  


                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
                {submitted && (
                  <p className="text-green-600 text-sm mt-2">Your message has been sent successfully!</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-KtnZuXrQpfsOSAzAMlc8jMwLJshwuj.png" 
                  alt="SHEMA Logo" 
                  className="h-8 w-8"
                />
                <span className="font-bold">SHEMA</span>
              </div>
              <p className="text-white/70 text-sm">
                Strengthening Humanity through Empowerment, Mentorship, and Advocacy
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#about" className="hover:text-white transition">About</Link></li>
                <li><Link href="#services" className="hover:text-white transition">Services</Link></li>
                <li><Link href="#partnership" className="hover:text-white transition">Partnership</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="mailto:shemahumanitarianservices@gmail.com" className="hover:text-white transition">Email: shemahumanitarianservices@gmail.com</a></li>
                <li><a href="tel:+2349033072314" className="hover:text-white transition">+234 8169 306 560</a></li>
                <li>Maiduguri, Borno State, Nigeria</li>
                <li>
                  <a href="https://web.facebook.com/profile.php?id=61578723781841" className="hover:text-white transition"><img src="/facebook.png" alt="Facebook" className="h-5 w-5 inline-block mr-5" /></a>
                  <a href="https://www.youtube.com/@shemahumanitarianservice?fbclid=IwY2xjawREUlZleHRuA2FlbQIxMABicmlkETFQRmpqN0lSV3JtYktSb3N1c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHhpHvKEdi8SyimrCS_otogqCFusJ5_eKXBzY-aNHbK24S2QlHl9WrwW2s0O5_aem_SjkeKZT8CEi9IltxpxWLeQ" className="hover:text-white transition"><img src="/youtube.png" alt="Twitter" className="h-5 w-5 inline-block mr-5" /></a>
                  <a href="https://www.instagram.com/shemahumanitarianservice?fbclid=IwY2xjawREUfpleHRuA2FlbQIxMABicmlkETFQRmpqN0lSV3JtYktSb3N1c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHhpHvKEdi8SyimrCS_otogqCFusJ5_eKXBzY-aNHbK24S2QlHl9WrwW2s0O5_aem_SjkeKZT8CEi9IltxpxWLeQ" className="hover:text-white transition"><img src="/instagram.png" alt="Instagram" className="h-5 w-5 inline-block mr-5" /></a>
                </li> 
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Partnership</h4>
              <p className="text-sm text-white/70 mb-4">
                Join us in making a meaningful difference in vulnerable communities.
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
                Get Involved
              </Button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-sm text-white/70">
            <p>&copy; 2024 SHEMA Humanitarian Services. All rights reserved.</p>
            <p className="mt-2">Transforming lives with compassion, integrity, and purpose.</p>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button
          onClick={scrollToHero}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-primary/90"
        >
          <ChevronUp size={22} />
        </button>
      )}

      {/* Partner Modal */}
      <PartnerModal open={partnerModalOpen} onOpenChange={setPartnerModalOpen} />
    </div>
  );
}
