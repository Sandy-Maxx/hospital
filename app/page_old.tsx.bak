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
    name: "MediCare Hospital",
    tagline: "Your Health, Our Priority",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    phone: "+1 (555) 123-4567",
    email: "info@medicare.com",
    address: "123 Health Street, Medical City, MC 12345",
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

  return (
    <div ref={revealRootRef} className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
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
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
          {/* Floating Glass Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 animate-float hidden lg:block" />
          <div className="absolute top-40 left-20 w-24 h-24 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 animate-float-delayed hidden lg:block" />
          <div className="absolute bottom-40 right-40 w-20 h-20 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 animate-pulse hidden lg:block" />
          
          <div className={`max-w-5xl mx-auto relative ${lp?.enableAnimations !== false ? "animate-fade-in-up" : undefined}`}>
            {/* Main content glass container */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/20 p-8 md:p-12 shadow-2xl">
              {/* Medical Badge */}
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium mb-6 shadow-lg">
                <Stethoscope className="w-4 h-4 mr-2" />
                Trusted Healthcare Since 2020
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
                <span className="block">Excellence in</span>
                <span className="block bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Healthcare
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl md:text-3xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                Advanced medical care with compassion, cutting-edge technology, and a team of world-class specialists dedicated to your health and wellbeing.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-10 py-6 rounded-full shadow-2xl transform hover:scale-110 hover:shadow-cyan-500/25 transition-all duration-500 font-semibold border-2 border-white/20"
                  onClick={() => setOpenBook(true)}
                >
                  <Calendar className="w-6 h-6 mr-3" />
                  Book Appointment Now
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="border-3 border-white/40 text-white hover:bg-white hover:text-blue-900 text-lg px-10 py-6 rounded-full shadow-2xl transform hover:scale-110 hover:shadow-white/25 transition-all duration-500 font-semibold backdrop-blur-sm"
                >
                  <Link href="/about" className="flex items-center">
                    <Heart className="w-6 h-6 mr-3" />
                    Our Story
                  </Link>
                </Button>
              </div>

              {/* Slider dots */}
              {(lp?.enableHeroSlider && (lp?.heroImages?.length || 0) > 1) && (
                <div className="mt-8 flex justify-center space-x-2">
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
            <div className="absolute top-20 left-10 animate-float">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                <Stethoscope className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="absolute bottom-20 right-10 animate-float-delayed">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
            </div>
          </>
        )}

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
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
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Healthcare by the Numbers</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">Our commitment to excellence reflected in every statistic</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Medical Specialties */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-xl mb-6">
                  <Users className="w-8 h-8 text-blue-300" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  <Counter target={25} suffix="+" />
                </div>
                <h3 className="text-lg font-semibold text-blue-100 mb-2">Medical Specialties</h3>
                <p className="text-sm text-blue-200/80">Comprehensive care across all medical disciplines</p>
              </div>
            </div>
            
            {/* Expert Doctors */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-xl mb-6">
                  <Stethoscope className="w-8 h-8 text-emerald-300" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  <Counter target={150} suffix="+" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-100 mb-2">Expert Doctors</h3>
                <p className="text-sm text-emerald-200/80">Highly qualified medical professionals</p>
              </div>
            </div>
            
            {/* Patients Served */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500/20 rounded-xl mb-6">
                  <Heart className="w-8 h-8 text-rose-300" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  <Counter target={75} suffix="K+" />
                </div>
                <h3 className="text-lg font-semibold text-rose-100 mb-2">Lives Touched</h3>
                <p className="text-sm text-rose-200/80">Patients treated with compassionate care</p>
              </div>
            </div>
            
            {/* Emergency Care */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-xl mb-6">
                  <Shield className="w-8 h-8 text-amber-300" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  <Counter target={24} suffix="/7" />
                </div>
                <h3 className="text-lg font-semibold text-amber-100 mb-2">Emergency Care</h3>
                <p className="text-sm text-amber-200/80">Round-the-clock critical care services</p>
              </div>
            </div>
          </div>
          
          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                <Counter target={15} suffix=" Years" />
              </div>
              <p className="text-blue-200">Healthcare Excellence</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                <Counter target={98} suffix="%" />
              </div>
              <p className="text-blue-200">Patient Satisfaction</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                <Counter target={500} suffix="+" />
              </div>
              <p className="text-blue-200">Beds Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Services Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
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
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Medical Services</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">Comprehensive healthcare services with state-of-the-art facilities and expert medical professionals</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {/* Cardiology */}
            <div className="group relative h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-red-500/20 rounded-xl p-3 mb-4">
                      <Heart className="w-8 h-8 text-red-300" />
                    </div>
                    <h3 className="text-xl font-bold">Cardiology</h3>
                    <p className="text-sm text-red-200/80 mt-2">Heart Care</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
                    <h4 className="font-bold text-white mb-3">Cardiac Services</h4>
                    <ul className="text-sm text-red-200/90 space-y-1">
                      <li>• Cardiac Surgery</li>
                      <li>• Angioplasty</li>
                      <li>• ECG & Echo</li>
                      <li>• Heart Monitoring</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Neurology */}
            <div className="group relative h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-purple-500/20 rounded-xl p-3 mb-4">
                      <Target className="w-8 h-8 text-purple-300" />
                    </div>
                    <h3 className="text-xl font-bold">Neurology</h3>
                    <p className="text-sm text-purple-200/80 mt-2">Brain & Nerves</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
                    <h4 className="font-bold text-white mb-3">Neuro Services</h4>
                    <ul className="text-sm text-purple-200/90 space-y-1">
                      <li>• Brain Surgery</li>
                      <li>• Stroke Treatment</li>
                      <li>• Epilepsy Care</li>
                      <li>• MRI Scans</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Orthopedics */}
            <div className="group relative h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-blue-500/20 rounded-xl p-3 mb-4">
                      <Users className="w-8 h-8 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-bold">Orthopedics</h3>
                    <p className="text-sm text-blue-200/80 mt-2">Bones & Joints</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
                    <h4 className="font-bold text-white mb-3">Orthopedic Care</h4>
                    <ul className="text-sm text-blue-200/90 space-y-1">
                      <li>• Joint Replacement</li>
                      <li>• Sports Medicine</li>
                      <li>• Spine Surgery</li>
                      <li>• Fracture Care</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Emergency */}
            <div className="group relative h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-red-500/20 rounded-xl p-3 mb-4">
                      <Shield className="w-8 h-8 text-red-300" />
                    </div>
                    <h3 className="text-xl font-bold">Emergency</h3>
                    <p className="text-sm text-red-200/80 mt-2">24/7 Care</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
                    <h4 className="font-bold text-white mb-3">Emergency Care</h4>
                    <ul className="text-sm text-red-200/90 space-y-1">
                      <li>• Trauma Center</li>
                      <li>• ICU Care</li>
                      <li>• Ambulance</li>
                      <li>• Fast Response</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Women's Health */}
            <div className="group relative h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-pink-500/20 rounded-xl p-3 mb-4">
                      <Heart className="w-8 h-8 text-pink-300" />
                    </div>
                    <h3 className="text-xl font-bold">Women's Health</h3>
                    <p className="text-sm text-pink-200/80 mt-2">Maternity Care</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
                    <h4 className="font-bold text-white mb-3">Women's Care</h4>
                    <ul className="text-sm text-pink-200/90 space-y-1">
                      <li>• Maternity Ward</li>
                      <li>• Gynecology</li>
                      <li>• Fertility Care</li>
                      <li>• Wellness Programs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pediatrics */}
            <div className="group relative h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-green-500/20 rounded-xl p-3 mb-4">
                      <Users className="w-8 h-8 text-green-300" />
                    </div>
                    <h3 className="text-xl font-bold">Pediatrics</h3>
                    <p className="text-sm text-green-200/80 mt-2">Child Care</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
                    <h4 className="font-bold text-white mb-3">Child Care</h4>
                    <ul className="text-sm text-green-200/90 space-y-1">
                      <li>• Child Development</li>
                      <li>• Vaccinations</li>
                      <li>• NICU</li>
                      <li>• Pediatric Surgery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Oncology */}
            <div className="group relative h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-violet-500/20 rounded-xl p-3 mb-4">
                      <Target className="w-8 h-8 text-violet-300" />
                    </div>
                    <h3 className="text-xl font-bold">Oncology</h3>
                    <p className="text-sm text-violet-200/80 mt-2">Cancer Care</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
                    <h4 className="font-bold text-white mb-3">Cancer Treatment</h4>
                    <ul className="text-sm text-violet-200/90 space-y-1">
                      <li>• Chemotherapy</li>
                      <li>• Radiation</li>
                      <li>• Surgery</li>
                      <li>• Support Care</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Gastroenterology */}
            <div className="group relative h-48 w-full">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="flip-card w-full h-full relative">
                <div className="flip-card-inner relative w-full h-full">
                  <div className="flip-card-front absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-white shadow-xl hover:bg-white/15 transition-all duration-500">
                    <div className="bg-teal-500/20 rounded-xl p-3 mb-4">
                      <FileText className="w-8 h-8 text-teal-300" />
                    </div>
                    <h3 className="text-xl font-bold">Gastroenterology</h3>
                    <p className="text-sm text-teal-200/80 mt-2">Digestive Care</p>
                  </div>
                  <div className="flip-card-back absolute w-full h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
                    <h4 className="font-bold text-white mb-3">Digestive Health</h4>
                    <ul className="text-sm text-teal-200/90 space-y-1">
                      <li>• Endoscopy</li>
                      <li>• Liver Care</li>
                      <li>• Colonoscopy</li>
                      <li>• GI Surgery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="relative group inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <Link href="/book-appointment">
                <Button size="lg" className="relative bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-6 rounded-full text-lg shadow-2xl hover:bg-white/15 transform hover:scale-105 transition-all duration-500">
                  <Calendar className="w-6 h-6 mr-3" />
                  Book Your Consultation Today
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="grid grid-cols-8 gap-6 transform -rotate-12 scale-125">
              {Array.from({length: 64}).map((_, i) => (
                <div key={i} className="h-20 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Our Hospital?
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Experience healthcare excellence with our state-of-the-art facilities, expert medical team, and patient-centered approach to wellness.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-xl">
                    <Users className="w-8 h-8 text-blue-300" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Expert Physicians</h3>
                <p className="text-blue-200/80 leading-relaxed text-sm">
                  Board-certified specialists with years of experience providing personalized, compassionate medical care.
                </p>
                <div className="mt-4 text-blue-300 font-semibold text-sm">150+ Doctors</div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-xl">
                    <Calendar className="w-8 h-8 text-emerald-300" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">24</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Smart Scheduling</h3>
                <p className="text-emerald-200/80 leading-relaxed text-sm">
                  Advanced online booking system with real-time availability, automated reminders, and flexible rescheduling.
                </p>
                <div className="mt-4 text-emerald-300 font-semibold text-sm">24/7 Online Booking</div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-xl">
                    <FileText className="w-8 h-8 text-purple-300" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🔒</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Digital Health Records</h3>
                <p className="text-purple-200/80 leading-relaxed text-sm">
                  Secure, cloud-based electronic health records accessible to you and your care team anywhere, anytime.
                </p>
                <div className="mt-4 text-purple-300 font-semibold text-sm">HIPAA Compliant</div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-400 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                <div className="relative mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-xl">
                    <Shield className="w-8 h-8 text-red-300" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full">
                    <div className="w-full h-full rounded-full bg-green-500 animate-ping"></div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Emergency Services</h3>
                <p className="text-red-200/80 leading-relaxed text-sm">
                  Level I trauma center with rapid response teams, advanced life support, and critical care specialists.
                </p>
                <div className="mt-4 text-red-300 font-semibold text-sm">Response Time: &lt; 5 min</div>
              </div>
            </div>
          </div>
          
          {/* Additional Features Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Advanced Diagnostics</h4>
                <p className="text-cyan-200/80 text-sm">State-of-the-art imaging technology including MRI, CT, PET scans, and comprehensive lab services.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Precision Medicine</h4>
                <p className="text-teal-200/80 text-sm">Personalized treatment plans based on genetic testing, biomarkers, and individual patient characteristics.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-pink-300" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Holistic Wellness</h4>
                <p className="text-pink-200/80 text-sm">Integrative approach combining traditional medicine with wellness programs, nutrition counseling, and mental health support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Stories Carousel */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="grid grid-cols-10 gap-3 transform rotate-45 scale-150">
              {Array.from({length: 80}).map((_, i) => (
                <div key={i} className="h-16 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Patient Stories</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">Real experiences from patients who trust us with their healthcare journey</p>
          </div>
          
          {/* Interactive Carousel */}
          <div className="relative">
            {/* Navigation Buttons */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
              <button className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-3 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <ArrowRight className="w-6 h-6 text-white rotate-180" />
              </button>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
              <button className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-3 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <ArrowRight className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <div className="overflow-hidden rounded-2xl">
              <div className="flex space-x-6 animate-scroll-left px-16" style={{ width: 'calc(350px * 12)' }}>
              {[
                { 
                  quote: "The cardiac surgery team saved my life with expertise and compassion.", 
                  name: "Rajesh Singh", 
                  role: "Heart Surgery Patient",
                  avatar: "RS",
                  service: "Cardiology",
                  gradient: "from-red-500 to-pink-500"
                },
                { 
                  quote: "Maternity care exceeded expectations. Professional and caring staff.", 
                  name: "Priya Patel", 
                  role: "New Mother",
                  avatar: "PP",
                  service: "Maternity",
                  gradient: "from-pink-500 to-rose-500"
                },
                { 
                  quote: "Emergency response at 2 AM was swift and saved my father's life.", 
                  name: "Amit Kumar", 
                  role: "Family Member",
                  avatar: "AK",
                  service: "Emergency",
                  gradient: "from-red-500 to-orange-500"
                },
                { 
                  quote: "Knee replacement surgery was flawless. Back to tennis at 65!", 
                  name: "Dr. Sunita Rao", 
                  role: "Retired Professor",
                  avatar: "SR",
                  service: "Orthopedics",
                  gradient: "from-blue-500 to-cyan-500"
                },
                { 
                  quote: "Pediatric care was exceptional. Child-friendly and expert doctors.", 
                  name: "Neha Gupta", 
                  role: "Mother",
                  avatar: "NG",
                  service: "Pediatrics",
                  gradient: "from-green-500 to-emerald-500"
                },
                { 
                  quote: "Cancer treatment gave me hope. Expert care and emotional support.", 
                  name: "Vikram Singh", 
                  role: "Cancer Survivor",
                  avatar: "VS",
                  service: "Oncology",
                  gradient: "from-purple-500 to-indigo-500"
                },
                // Duplicate for seamless loop
                { 
                  quote: "The cardiac surgery team saved my life with expertise and compassion.", 
                  name: "Rajesh Singh", 
                  role: "Heart Surgery Patient",
                  avatar: "RS",
                  service: "Cardiology",
                  gradient: "from-red-500 to-pink-500"
                },
                { 
                  quote: "Maternity care exceeded expectations. Professional and caring staff.", 
                  name: "Priya Patel", 
                  role: "New Mother",
                  avatar: "PP",
                  service: "Maternity",
                  gradient: "from-pink-500 to-rose-500"
                },
                { 
                  quote: "Emergency response at 2 AM was swift and saved my father's life.", 
                  name: "Amit Kumar", 
                  role: "Family Member",
                  avatar: "AK",
                  service: "Emergency",
                  gradient: "from-red-500 to-orange-500"
                },
                { 
                  quote: "Knee replacement surgery was flawless. Back to tennis at 65!", 
                  name: "Dr. Sunita Rao", 
                  role: "Retired Professor",
                  avatar: "SR",
                  service: "Orthopedics",
                  gradient: "from-blue-500 to-cyan-500"
                },
                { 
                  quote: "Pediatric care was exceptional. Child-friendly and expert doctors.", 
                  name: "Neha Gupta", 
                  role: "Mother",
                  avatar: "NG",
                  service: "Pediatrics",
                  gradient: "from-green-500 to-emerald-500"
                },
                { 
                  quote: "Cancer treatment gave me hope. Expert care and emotional support.", 
                  name: "Vikram Singh", 
                  role: "Cancer Survivor",
                  avatar: "VS",
                  service: "Oncology",
                  gradient: "from-purple-500 to-indigo-500"
                },
              ].map((t, i) => (
                <div key={i} className="group flex-shrink-0 w-80 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`}></div>
                  <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold shadow-lg`}>
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{t.name}</div>
                        <div className="text-xs text-blue-200/70">{t.role}</div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <span className="inline-block bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                        {t.service}
                      </span>
                    </div>
                    
                    <p className="text-blue-100/90 text-sm leading-relaxed italic mb-3">
                      "{t.quote}"
                    </p>
                    
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-300 text-sm">★</span>
                      ))}
                      <span className="text-blue-200/70 text-xs ml-2">5.0</span>
                    </div>
                  </div>
                </div>
              ))
            </div>
          </div>
          
          {/* Rating Summary */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full shadow-xl hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center space-x-1 mr-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-300 text-lg">★</span>
                ))}
              </div>
              <div className="text-white">
                <span className="font-bold text-2xl">4.9</span>
                <span className="text-blue-200/80 ml-2">from 2,500+ reviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission moved to About page */}

      {/* Contact Strip */}
      <section className="py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 overflow-hidden">
        <div className="relative">
          <div className="flex space-x-12 animate-scroll-contact whitespace-nowrap">
            {/* Duplicate items for seamless loop */}
            <div className="flex items-center space-x-4 text-white">
              <Phone className="w-5 h-5" />
              <span className="font-medium">{settings.phone}</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <Mail className="w-5 h-5" />
              <span className="font-medium">{settings.email}</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <MapPin className="w-5 h-5" />
              <span className="font-medium">{settings.address}</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">24/7 Emergency Care Available</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <Shield className="w-5 h-5" />
              <span className="font-medium">NABH Accredited Hospital</span>
            </div>
            
            {/* Repeat for seamless loop */}
            <div className="flex items-center space-x-4 text-white">
              <Phone className="w-5 h-5" />
              <span className="font-medium">{settings.phone}</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <Mail className="w-5 h-5" />
              <span className="font-medium">{settings.email}</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <MapPin className="w-5 h-5" />
              <span className="font-medium">{settings.address}</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">24/7 Emergency Care Available</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <Shield className="w-5 h-5" />
              <span className="font-medium">NABH Accredited Hospital</span>
            </div>
            
            {/* Triple repeat for smooth scrolling */}
            <div className="flex items-center space-x-4 text-white">
              <Phone className="w-5 h-5" />
              <span className="font-medium">{settings.phone}</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <Mail className="w-5 h-5" />
              <span className="font-medium">{settings.email}</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <MapPin className="w-5 h-5" />
              <span className="font-medium">{settings.address}</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">24/7 Emergency Care Available</span>
            </div>
            <div className="flex items-center space-x-4 text-white">
              <Shield className="w-5 h-5" />
              <span className="font-medium">NABH Accredited Hospital</span>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />

      {/* Universal modern floating CTA (WhatsApp, Call, Email, Book) */}
      <PublicFloatingCTA />
      {/* Booking modal */}
      <Dialog open={openBook} onOpenChange={(v) => { setOpenBook(v); if (v) setIframeLoaded(false); }}>
        <DialogContent className="relative max-w-4xl w-[96vw] h-[90vh] sm:h-[88vh] p-0 overflow-hidden rounded-2xl">
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
