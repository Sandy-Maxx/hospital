"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Stethoscope,
  Users,
  Calendar,
  FileText,
  Shield,
  Phone,
  Mail,
  MapPin,
  Heart,
  Eye,
  Target,
  Plus,
  X,
  Quote,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
import PublicFloatingCTA from "@/components/public/PublicFloatingCTA";

interface HospitalSettings {
  name: string;
  tagline: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  email: string;
  address: string;
  vision: string;
  mission: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

interface LandingSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroImages: string[];
  heroButtonText: string;
  heroSecondaryButtonText: string;
  enableHeroSlider: boolean;
  sliderAutoplay: boolean;
  sliderInterval: number;
  featuresTitle: string;
  featuresSubtitle: string;
  enableFeatures: boolean;
  enableAnimations: boolean;
  heroOverlayColor: string;
  heroOverlayOpacity: number;
  buttonStyle: "rounded" | "square" | "pill";
}

function hexToRgba(hex: string, alpha: number) {
  try {
    const c = hex.replace('#', '');
    const bigint = parseInt(c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return `rgba(30, 64, 175, ${alpha})`; // fallback to indigo-700
  }
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showFloatingCTA, setShowFloatingCTA] = useState(true);
  const hasAutoOpened = useRef(false);
  const [settings, setSettings] = useState<HospitalSettings>({
    name: "Medicaring Hospital",
    tagline: "Your Health, Our Priority",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    phone: "7087467976",
    email: "info@medicaring.com",
    address: "123 Medicaring Complex, Baner Road, Pune, Maharashtra 411045",
    vision:
      "To revolutionize healthcare by creating a world where advanced medical technology meets human compassion, ensuring every individual has access to personalized, world-class care that not only heals but empowers lives.",
    mission:
      "We transform lives through innovative healthcare solutions, combining cutting-edge medical expertise with genuine human connection. Our mission is to deliver comprehensive, personalized care that exceeds expectations while fostering a healthier, stronger community for all.",
    socialMedia: {
      facebook: "#",
      twitter: "#",
      instagram: "#",
      linkedin: "#",
    },
  });

  const [lp, setLp] = useState<LandingSettings | null>(null);
  const [slide, setSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const revealRootRef = useRef<HTMLDivElement | null>(null);
  const [openBook, setOpenBook] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Auto-open booking modal after 3 seconds on first load (no auth required)
  useEffect(() => {
    if (hasAutoOpened.current) return;
    hasAutoOpened.current = true;
    const timer = setTimeout(() => {
      setOpenBook(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load hospital settings from API or localStorage
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings/hospital");
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.log("Using default settings");
      }
    };
    loadSettings();
  }, []);

  // Load landing page settings
  useEffect(() => {
    const loadLp = async () => {
      try {
        const res = await fetch('/api/settings/landing-page');
        if (res.ok) {
          const data: LandingSettings = await res.json();
          setLp(data);
        }
      } catch {}
    };
    loadLp();
  }, []);

  // Auto-advance hero slider
  useEffect(() => {
    if (!lp) return;
    const imgs = (lp.heroImages && lp.heroImages.length > 0)
      ? lp.heroImages
      : [
          "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
          "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
          "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
          "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
          "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
          "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
        ];
    if (lp.enableHeroSlider && lp.sliderAutoplay && imgs.length > 1) {
      const id = setInterval(() => {
        setSlide((s) => (s + 1) % imgs.length);
      }, Math.max(1500, lp.sliderInterval || 5000));
      return () => clearInterval(id);
    }
  }, [lp]);

  // Auto-advance testimonials carousel
  useEffect(() => {
    const testimonials = [
      {
        name: "Dr. Rajesh Sharma",
        role: "Heart Surgery Patient",
        content: "The cardiac team saved my life with expertise and compassion. Their advanced care made all the difference in my recovery.",
        rating: 5
      },
      {
        name: "Priya Patel",
        role: "Emergency Care Patient",
        content: "When I had my accident, the emergency team was incredibly fast and professional. Grateful for their quick response.",
        rating: 5
      },
      {
        name: "Anita Mehta",
        role: "Maternity Patient",
        content: "Having my baby here was amazing. The maternity staff made me feel safe and supported throughout the process.",
        rating: 5
      },
      {
        name: "Vikram Singh",
        role: "Orthopedic Patient",
        content: "Knee replacement surgery was excellent. The team helped me get back to my active lifestyle. Highly recommend!",
        rating: 5
      }
    ];
    
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  // Scroll reveal animations
  useEffect(() => {
    const root = revealRootRef.current || document;
    const elements = Array.from(root.querySelectorAll(".reveal"));
    if (elements.length === 0) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Animated Counter component (runs once on initial mount)
  const Counter: React.FC<{ target: number; suffix?: string; duration?: number }> = ({ target, suffix = "", duration = 1200 }) => {
    const [value, setValue] = useState(0);
    const started = useRef(false);
    
    // Use a ref to store the target value to prevent recreating the component
    const targetRef = useRef(target);
    targetRef.current = target;
    
    useEffect(() => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const animate = (now: number) => {
        const t = Math.min(1, (now - start) / duration!);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.floor(eased * targetRef.current));
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, [duration]); // Remove target from dependencies
    
    return <span className="inline">{value.toLocaleString()}{suffix}</span>;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const testimonials = [
    {
      name: "Dr. Rajesh Sharma",
      role: "Heart Surgery Patient",
      content: "The cardiac team saved my life with expertise and compassion. Their advanced care made all the difference in my recovery.",
      rating: 5
    },
    {
      name: "Priya Patel",
      role: "Emergency Care Patient",
      content: "When I had my accident, the emergency team was incredibly fast and professional. Grateful for their quick response.",
      rating: 5
    },
    {
      name: "Anita Mehta",
      role: "Maternity Patient",
      content: "Having my baby here was amazing. The maternity staff made me feel safe and supported throughout the process.",
      rating: 5
    },
    {
      name: "Vikram Singh",
      role: "Orthopedic Patient",
      content: "Knee replacement surgery was excellent. The team helped me get back to my active lifestyle. Highly recommend!",
      rating: 5
    },
    {
      name: "Sunita Gupta",
      role: "Diabetes Care Patient",
      content: "Comprehensive diabetes management program changed my life. The doctors are knowledgeable and caring.",
      rating: 5
    },
    {
      name: "Amit Kumar",
      role: "Cancer Survivor",
      content: "The oncology team gave me hope during difficult times. Their treatment and support were exceptional.",
      rating: 5
    }
  ];

  return (
    <div ref={revealRootRef} className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <PublicHeader />

      {/* Hero Section with Slider */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700">
        {/* Background Image and Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-40"
              style={{
                backgroundImage: `url(${(lp?.heroImages?.length ? lp.heroImages : [
                  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                  'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                  'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
                ])[slide % ((lp?.heroImages?.length || 6))]})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/70 to-teal-700/80 z-10" />
            {/* Animated gradient blobs */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse z-[11]" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-blue-500/20 rounded-full blur-3xl animate-float z-[11]" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-cyan-300/10 to-blue-400/10 rounded-full blur-3xl animate-float-delayed z-[11]" />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-12 sm:pt-20">
          {/* Floating Glass Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 animate-float hidden lg:block" />
          <div className="absolute top-40 left-20 w-24 h-24 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 animate-float-delayed hidden lg:block" />
          <div className="absolute bottom-40 right-40 w-20 h-20 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 animate-pulse hidden lg:block" />
          
          <div className={`max-w-5xl mx-auto relative ${lp?.enableAnimations !== false ? "animate-fade-in-up" : undefined}`}>
            {/* Main content glass container */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/20 p-4 sm:p-8 md:p-12 shadow-2xl">
              
              {/* Trust Badge */}
              <div className="text-center mb-4 sm:mb-6">
                <span className="text-white/90 text-xs sm:text-sm font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="block sm:inline">★ Trusted Healthcare Since 2010</span>
                  <span className="block sm:inline sm:ml-1">- 15+ Years Excellence</span>
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 sm:mb-8 leading-tight">
                <span className="block">Excellence in</span>
                <span className="block bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Healthcare
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-blue-100 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed font-light px-4 sm:px-0">
                Advanced medical care with compassion, cutting-edge technology, and a team of world-class specialists dedicated to your health and wellbeing.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 px-4 sm:px-0">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-600/90 hover:to-blue-600/90 text-white text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-6 rounded-full shadow-2xl transform hover:scale-110 hover:shadow-cyan-500/25 transition-all duration-500 font-semibold border-2 border-white/30 backdrop-blur-md hover:backdrop-blur-lg"
                  onClick={() => setOpenBook(true)}
                >
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Book Appointment Now
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="w-full sm:w-auto border-3 border-white/40 text-white hover:bg-white/90 hover:text-blue-900 text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-6 rounded-full shadow-2xl transform hover:scale-110 hover:shadow-white/25 transition-all duration-500 font-semibold backdrop-blur-md hover:backdrop-blur-lg bg-white/10"
                >
                  <Link href="/about" className="flex items-center justify-center">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    Our Story
                  </Link>
                </Button>
              </div>

              {/* Slider dots */}
              {(lp?.enableHeroSlider && (lp?.heroImages?.length || 0) > 1) && (
                <div className="mt-6 sm:mt-8 flex justify-center space-x-2">
                  {(lp?.heroImages || []).map((_, i) => (
                    <span 
                      key={i} 
                      className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 backdrop-blur-sm border border-white/30 ${
                        i === (slide % (lp?.heroImages?.length || 1)) 
                          ? 'bg-white scale-125 shadow-lg' 
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                      onClick={() => setSlide(i)}
                    ></span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        {lp?.enableAnimations !== false && (
          <>
            <div className="absolute top-20 left-10 animate-float hidden sm:block">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                <Stethoscope className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <div className="absolute bottom-20 right-10 animate-float-delayed hidden sm:block">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </>
        )}

        {/* Medical Cross Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="relative flex flex-col items-center animate-bounce">
            {/* Medical Cross Icon */}
            <div className="w-8 h-8 relative mb-2">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-1 bg-gradient-to-r from-cyan-300 to-blue-300 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-cyan-300 to-blue-300 rounded-full animate-pulse"></div>
              {/* Outer ring */}
              <div className="absolute inset-0 border-2 border-white/40 rounded-full animate-ping"></div>
            </div>
            {/* Scroll text */}
            <span className="text-white/80 text-xs font-medium animate-fade-in-up">Scroll</span>
            {/* Arrow */}
            <div className="mt-1 animate-bounce">
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="grid grid-cols-8 gap-4 transform -skew-y-12 scale-150">
              {Array.from({length: 64}).map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Healthcare by the Numbers</h2>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto">Our commitment to excellence reflected in every statistic</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Medical Specialties */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 text-center hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/20 rounded-xl mb-4 sm:mb-6">
                  <Users className="w-7 h-7 sm:w-8 sm:h-8 text-blue-300" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  <Counter target={25} suffix="+" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-blue-100 mb-2">Medical Specialties</h3>
                <p className="text-sm text-blue-200/80">Comprehensive care across all medical disciplines</p>
              </div>
            </div>
            
            {/* Expert Doctors */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 text-center hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-xl mb-4 sm:mb-6">
                  <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-300" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  <Counter target={150} suffix="+" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-emerald-100 mb-2">Expert Doctors</h3>
                <p className="text-sm text-emerald-200/80">Highly qualified medical professionals</p>
              </div>
            </div>
            
            {/* Patients Served */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 text-center hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-rose-500/20 rounded-xl mb-4 sm:mb-6">
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-rose-300" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  <Counter target={75} suffix="K+" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-rose-100 mb-2">Lives Touched</h3>
                <p className="text-sm text-rose-200/80">Patients treated with compassionate care</p>
              </div>
            </div>
            
            {/* Emergency Care */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 text-center hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/20 rounded-xl mb-4 sm:mb-6">
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  <Counter target={24} suffix="/7" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-amber-100 mb-2">Emergency Care</h3>
                <p className="text-sm text-amber-200/80">Round-the-clock critical care services</p>
              </div>
            </div>
          </div>
          
          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                <Counter target={15} suffix=" Years" />
              </div>
              <p className="text-sm sm:text-base text-blue-200">Healthcare Excellence</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                <Counter target={98} suffix="%" />
              </div>
              <p className="text-sm sm:text-base text-blue-200">Patient Satisfaction</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                <Counter target={500} suffix="+" />
              </div>
              <p className="text-sm sm:text-base text-blue-200">Beds Available</p>
            </div>
          </div>

          {/* Rating Summary */}
          <div className="text-center mt-12 sm:mt-16">
            <div className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full shadow-xl hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center space-x-1 mr-4 sm:mr-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-300 text-base sm:text-lg">★</span>
                ))}
              </div>
              <div className="text-white">
                <span className="font-bold text-xl sm:text-2xl">4.9</span>
                <span className="text-blue-200/80 ml-1 sm:ml-2 text-sm sm:text-base">from 2,500+ reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Services Section - Mobile Optimized */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="grid grid-cols-6 gap-4 transform rotate-12 scale-150">
              {Array.from({length: 48}).map((_, i) => (
                <div key={i} className="h-24 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Our Medical Services</h2>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto">Comprehensive healthcare services with state-of-the-art facilities and expert medical professionals</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {/* Cardiology */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-red-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Cardiology</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Heart & Vascular Care</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Cardiology Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Advanced Heart Surgery</li>
                      <li>• Cardiac Catheterization</li>
                      <li>• Preventive Care</li>
                      <li>• Emergency Treatment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Neurology */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-purple-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Neurology</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Brain & Nervous System</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Neurology Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Brain Surgery</li>
                      <li>• Stroke Treatment</li>
                      <li>• Epilepsy Care</li>
                      <li>• Neurological Testing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Care */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-green-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Emergency</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">24/7 Critical Care</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Emergency Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• 24/7 ER Services</li>
                      <li>• Trauma Care</li>
                      <li>• Critical Care Unit</li>
                      <li>• Emergency Surgery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Pediatrics */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-blue-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Pediatrics</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Child Healthcare</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Pediatric Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Child Health Exams</li>
                      <li>• Vaccination Programs</li>
                      <li>• Pediatric Surgery</li>
                      <li>• Specialized Care</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Orthopedics */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-orange-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Target className="w-6 h-6 sm:w-8 sm:h-8 text-orange-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Orthopedics</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Bones & Joints</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Orthopedic Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Joint Replacement</li>
                      <li>• Sports Medicine</li>
                      <li>• Fracture Treatment</li>
                      <li>• Spine Surgery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Gynecology */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-pink-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pink-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Gynecology</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Women's Health</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Gynecology Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Maternity Care</li>
                      <li>• Fertility Treatment</li>
                      <li>• Women's Health</li>
                      <li>• Prenatal Care</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Oncology */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-teal-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-teal-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Oncology</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Cancer Treatment</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Oncology Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Cancer Diagnosis</li>
                      <li>• Chemotherapy</li>
                      <li>• Radiation Therapy</li>
                      <li>• Surgical Oncology</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Dermatology */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-yellow-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Dermatology</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Skin & Hair Care</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Dermatology Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Skin Treatments</li>
                      <li>• Cosmetic Procedures</li>
                      <li>• Hair Transplant</li>
                      <li>• Laser Therapy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Urology */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-indigo-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Target className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Urology</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Kidney & Urinary</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Urology Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Kidney Stone Treatment</li>
                      <li>• Prostate Care</li>
                      <li>• Urinary Disorders</li>
                      <li>• Minimally Invasive Surgery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Psychiatry */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-emerald-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Psychiatry</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Mental Health</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Psychiatry Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Mental Health Assessment</li>
                      <li>• Depression Treatment</li>
                      <li>• Anxiety Disorders</li>
                      <li>• Counseling Services</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Gastroenterology */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-400 to-green-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-lime-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Target className="w-6 h-6 sm:w-8 sm:h-8 text-lime-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">Gastroenterology</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Digestive Health</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">Gastro Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Digestive Disorders</li>
                      <li>• Endoscopy Procedures</li>
                      <li>• Liver Disease Treatment</li>
                      <li>• Colonoscopy Services</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* ENT */}
            <div className="group relative h-44 sm:h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-violet-500/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-violet-300" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">ENT</h3>
                    <p className="text-xs sm:text-sm text-blue-200/80 text-center">Ear, Nose & Throat</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 sm:p-6 flex flex-col justify-center text-white shadow-xl">
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">ENT Services</h3>
                    <ul className="text-xs sm:text-sm space-y-1 sm:space-y-2 text-blue-200/90">
                      <li>• Hearing Tests</li>
                      <li>• Sinus Treatment</li>
                      <li>• Throat Surgery</li>
                      <li>• Voice Disorders</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500/80 to-indigo-600/80 hover:from-blue-600/90 hover:to-indigo-700/90 text-white text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300 font-semibold backdrop-blur-md border-2 border-white/30 hover:backdrop-blur-lg"
              onClick={() => setOpenBook(true)}
            >
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Book Your Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Features/Why Choose Us Section - Mobile Optimized */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="grid grid-cols-8 gap-3 transform skew-y-12 scale-150">
              {Array.from({length: 64}).map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Why Choose Us</h2>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto">Experience healthcare excellence through our commitment to innovation, compassion, and quality</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Advanced Technology */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-cyan-500/20 rounded-xl mb-4 sm:mb-6">
                  <Target className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Advanced Technology</h3>
                <p className="text-sm sm:text-base text-blue-200/80 leading-relaxed">State-of-the-art medical equipment and cutting-edge treatment technologies for precise diagnosis and effective treatment.</p>
              </div>
            </div>

            {/* Expert Medical Team */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-xl mb-4 sm:mb-6">
                  <Users className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Expert Medical Team</h3>
                <p className="text-sm sm:text-base text-blue-200/80 leading-relaxed">Board-certified physicians and specialists with years of experience providing personalized, compassionate care to every patient.</p>
              </div>
            </div>

            {/* 24/7 Emergency Care */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-rose-500/20 rounded-xl mb-4 sm:mb-6">
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-rose-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">24/7 Emergency Care</h3>
                <p className="text-sm sm:text-base text-blue-200/80 leading-relaxed">Round-the-clock emergency services with rapid response teams ready to handle any medical emergency with expertise and care.</p>
              </div>
            </div>

            {/* Patient-Centered Approach */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-purple-500/20 rounded-xl mb-4 sm:mb-6">
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-purple-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Patient-Centered Care</h3>
                <p className="text-sm sm:text-base text-blue-200/80 leading-relaxed">Individualized treatment plans focused on your unique needs, ensuring comfort, dignity, and the best possible outcomes.</p>
              </div>
            </div>

            {/* Comprehensive Services */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/20 rounded-xl mb-4 sm:mb-6">
                  <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Comprehensive Services</h3>
                <p className="text-sm sm:text-base text-blue-200/80 leading-relaxed">Full range of medical services from preventive care to complex surgeries, all under one roof for your convenience.</p>
              </div>
            </div>

            {/* Quality & Safety */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-teal-500/20 rounded-xl mb-4 sm:mb-6">
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-teal-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Quality & Safety</h3>
                <p className="text-sm sm:text-base text-blue-200/80 leading-relaxed">Accredited facility maintaining the highest standards of medical care, safety protocols, and quality assurance.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Stories - Compact Wide Carousel */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="grid grid-cols-6 gap-4 transform -rotate-12 scale-150">
              {Array.from({length: 36}).map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Patient Stories</h2>
            <p className="text-lg text-blue-100">Real experiences from patients who trust us</p>
          </div>

          {/* Mobile: Horizontal Carousel with 2 Cards Visible | Desktop: Scrolling Carousel */}
          <div className="relative">
            {/* Mobile Carousel Layout */}
            <div className="block md:hidden px-4">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4" 
                   style={{ scrollSnapType: 'x mandatory' }}>
                {testimonials.map((testimonial, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-xl hover:bg-white/15 transition-all duration-300 flex-shrink-0" 
                       style={{ 
                         scrollSnapAlign: 'start',
                         width: 'calc(50% - 0.375rem)' // 2 cards visible with gap
                       }}>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, starIndex) => (
                        <span key={starIndex} className="text-yellow-300 text-sm">★</span>
                      ))}
                    </div>
                    <blockquote className="text-white text-sm leading-relaxed mb-3 text-center line-clamp-3">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="text-center">
                      <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                      <div className="text-blue-200/80 text-xs">{testimonial.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Desktop Scrolling Layout */}
            <div className="hidden md:block overflow-hidden">
              <div className="animate-scroll-left hover:pause-animation flex gap-6">
                {[...Array(3)].map((_, setIndex) => (
                  <div key={setIndex} className="flex gap-6 shrink-0">
                    {testimonials.map((testimonial, i) => (
                      <div key={`${setIndex}-${i}`} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 w-80 shrink-0 shadow-xl hover:bg-white/15 transition-all duration-300">
                        <div className="flex justify-center mb-3">
                          {[...Array(5)].map((_, starIndex) => (
                            <span key={starIndex} className="text-yellow-300 text-sm">★</span>
                          ))}
                        </div>
                        <blockquote className="text-white text-sm leading-relaxed mb-4 text-center line-clamp-3">
                          "{testimonial.content}"
                        </blockquote>
                        <div className="text-center">
                          <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                          <div className="text-blue-200/80 text-xs">{testimonial.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Strip - Compact */}
      <section className="py-4 bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-sm border-t border-white/20 overflow-hidden">
        <div className="relative">
          {/* Mobile: Centered Grid Layout */}
          <div className="block md:hidden">
            <div className="flex flex-col items-center space-y-3 px-4">
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center space-x-2 text-white/95">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium text-sm">{settings.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-white/95">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium text-sm">{settings.email}</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center space-x-2 text-white/95">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium text-sm">{settings.address}</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center space-x-2 text-white/95">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium text-sm">24/7 Emergency Care</span>
                </div>
                <div className="flex items-center space-x-2 text-white/95">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium text-sm">NABH Accredited</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop: Scrolling Layout */}
          <div className="hidden md:block">
            <div className="animate-scroll-right hover:pause-animation flex whitespace-nowrap">
              {[...Array(5)].map((_, repeatIndex) => (
                <div key={repeatIndex} className="flex items-center space-x-8 px-6 shrink-0">
                  <div className="flex items-center space-x-3 text-white/95">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium text-sm">{settings.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/95">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium text-sm">{settings.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/95">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium text-sm">{settings.address}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/95">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium text-sm">24/7 Emergency Care</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/95">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium text-sm">NABH Accredited</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/95">
                    <Stethoscope className="w-4 h-4" />
                    <span className="font-medium text-sm">15+ Years Experience</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Elite ArchWeb Studio Badge Strip - Mobile Only */}
      <section className="block md:hidden py-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 border-t border-white/20">
        <div className="flex items-center justify-center px-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm">🚧</span>
            <span className="font-bold text-black text-xs">UNDER DEVELOPMENT</span>
            <span className="text-sm">🚧</span>
          </div>
        </div>
        <div className="text-center mt-1">
          <div className="text-black font-semibold text-xs">Elite ArchWeb Studio</div>
          <div className="text-black font-medium text-xs">📞 7087467976</div>
        </div>
      </section>

      <PublicFooter />

      {/* Universal modern floating CTA (WhatsApp, Call, Email, Book) */}
      <PublicFloatingCTA />
      {/* Booking modal */}
      <Dialog open={openBook} onOpenChange={(v) => { setOpenBook(v); if (v) setIframeLoaded(false); }}>
        <DialogContent className="relative max-w-4xl w-[96vw] h-[90vh] sm:h-[88vh] p-0 overflow-hidden rounded-2xl">
          {/* Close Button */}
          <button 
            onClick={() => setOpenBook(false)}
            className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {!iframeLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          )}
          <iframe src="/book-appointment?modal=1" className="w-full h-full border-0 rounded-2xl" onLoad={() => setIframeLoaded(true)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}