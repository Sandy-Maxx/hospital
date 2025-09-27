"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Heart, Target, Calendar, Shield, Stethoscope } from "lucide-react";
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
}

interface LandingSettings {
  aboutTitle: string;
  aboutDescription: string;
  aboutImage?: string;
  visionImage?: string;
  missionImage?: string;
}

export default function AboutPage() {
  const [hospital, setHospital] = useState<HospitalSettings | null>(null);
  const [lp, setLp] = useState<LandingSettings | null>(null);

  useEffect(() => {
    fetch("/api/settings/hospital").then(async (res) => {
      if (res.ok) setHospital(await res.json());
    });
    fetch("/api/settings/landing-page").then(async (res) => {
      if (res.ok) setLp(await res.json());
    });
  }, []);

  // Scroll reveal animations
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.reveal'));
    if (elements.length === 0) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900/50 via-slate-900/30 to-indigo-900/50 border-b border-white/20 pt-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="grid grid-cols-8 gap-4 transform skew-y-12 scale-150">
              {Array.from({length: 32}).map((_, i) => (
                <div key={i} className="h-24 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white reveal reveal-up mb-4">{lp?.aboutTitle || "About Medicaring Hospital"}</h1>
            <p className="text-lg text-blue-100/90 mt-3 max-w-3xl reveal reveal-up">
              {hospital?.tagline || "Your Health, Our Priority - Delivering Excellence in Healthcare"}
            </p>
          </div>
        </div>
      </section>

      {/* About Content - Zig Zag Layout */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          
          {/* Who We Are - Left Text, Right Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="reveal reveal-left">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Who We Are</h2>
                <p className="text-lg text-blue-100/90 leading-relaxed mb-6">
                  {lp?.aboutDescription ||
                    "We are committed to providing exceptional healthcare services with compassion, innovation, and excellence. Our dedicated team of medical professionals works tirelessly to ensure every patient receives the highest quality care."}
                </p>
                <div className="flex space-x-8 text-sm text-blue-200">
                  <div>
                    <div className="font-bold text-2xl text-blue-300">15+</div>
                    <div>Years Experience</div>
                  </div>
                  <div>
                    <div className="font-bold text-2xl text-green-300">25+</div>
                    <div>Specialties</div>
                  </div>
                  <div>
                    <div className="font-bold text-2xl text-purple-300">150+</div>
                    <div>Expert Doctors</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal reveal-right">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl transform rotate-3"></div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-500">
                  <img
                    src={lp?.aboutImage || "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
                    alt="About Our Hospital"
                    className="w-full h-96 object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Our Vision - Right Text, Left Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="reveal reveal-left order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 to-pink-500/30 rounded-2xl transform -rotate-3"></div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-500">
                  <img
                    src={lp?.visionImage || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
                    alt="Our Vision"
                    className="w-full h-96 object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
            <div className="reveal reveal-right order-1 lg:order-2">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-rose-400 to-rose-600 p-3 rounded-xl shadow-lg">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-white">Our Vision</h3>
                </div>
                <p className="text-lg text-blue-100/90 leading-relaxed">
                  {hospital?.vision || "To revolutionize healthcare by creating a world where advanced medical technology meets human compassion, ensuring every individual has access to personalized, world-class care that not only heals but empowers lives."}
                </p>
                <div className="mt-6 p-4 bg-rose-500/20 backdrop-blur-sm rounded-xl border border-rose-300/30">
                  <p className="text-rose-100 font-medium">"Pioneering the future of healthcare, one patient at a time."</p>
                </div>
              </div>
            </div>
          </div>

          {/* Our Mission - Left Text, Right Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="reveal reveal-left">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-white">Our Mission</h3>
                </div>
                <p className="text-lg text-blue-100/90 leading-relaxed">
                  {hospital?.mission || "We transform lives through innovative healthcare solutions, combining cutting-edge medical expertise with genuine human connection. Our mission is to deliver comprehensive, personalized care that exceeds expectations while fostering a healthier, stronger community for all."}
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
                    <span className="text-blue-100/90">Personalized Treatment Plans</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
                    <span className="text-blue-100/90">AI-Driven Diagnostics</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
                    <span className="text-blue-100/90">24/7 Patient Support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
                    <span className="text-blue-100/90">Preventive Health Focus</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal reveal-right">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-blue-500/30 rounded-2xl transform rotate-3"></div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-500">
                  <img
                    src={lp?.missionImage || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
                    alt="Our Mission"
                    className="w-full h-96 object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Values - Center Aligned */}
          <div className="text-center reveal reveal-up">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 mb-12 shadow-2xl">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Core Values</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 hover:bg-white/15 hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Compassion</h4>
                <p className="text-blue-100/80 leading-relaxed">We believe healing begins with human connection. Every interaction is guided by empathy, respect, and understanding of each patient's unique journey.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 hover:bg-white/15 hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-green-400 to-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Excellence</h4>
                <p className="text-blue-100/80 leading-relaxed">Excellence is not just our goal—it's our promise. We continuously push boundaries in medical innovation and maintain the highest clinical standards.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20 hover:bg-white/15 hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Innovation</h4>
                <p className="text-blue-100/80 leading-relaxed">We harness tomorrow's technology today, integrating AI, telemedicine, and breakthrough treatments to redefine what's possible in healthcare.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Strip - Compact */}
      <section className="py-4 bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-sm border-t border-white/20 overflow-hidden">
        <div className="relative">
          <div className="animate-scroll-right hover:pause-animation flex whitespace-nowrap">
            {[...Array(5)].map((_, repeatIndex) => (
              <div key={repeatIndex} className="flex items-center space-x-8 px-6 shrink-0">
                <div className="flex items-center space-x-3 text-white/95">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium text-sm">{hospital?.phone || "+91 98765 43210"}</span>
                </div>
                <div className="flex items-center space-x-3 text-white/95">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium text-sm">{hospital?.email || "info@medicaring.com"}</span>
                </div>
                <div className="flex items-center space-x-3 text-white/95">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium text-sm">{hospital?.address || "123 Medicaring Complex, Baner Road, Pune, Maharashtra 411045"}</span>
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
      </section>

      <PublicFooter />
      <PublicFloatingCTA />
    </div>
  );
}
