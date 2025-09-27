"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Mail, Stethoscope, Menu, X } from "lucide-react";

type HospitalSettings = {
  name?: string;
  logo?: string;
  phone?: string;
  email?: string;
  primaryColor?: string;
};

export default function PublicHeader() {
  const [settings, setSettings] = useState<HospitalSettings>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings/hospital")
      .then(async (res) => {
        if (res.ok) setSettings(await res.json());
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-blue-900/95 via-blue-800/95 to-teal-700/95 backdrop-blur-md supports-[backdrop-filter]:bg-blue-900/90 border-b border-blue-700/30 shadow-xl">
      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {settings.logo ? (
            <img src={settings.logo} alt="logo" className="w-8 h-8 object-contain rounded" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-semibold text-white drop-shadow-md">{settings.name || "Medicaring Hospital"}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="text-white/90 hover:text-white transition-colors duration-200 drop-shadow-sm">Home</Link>
          <Link href="/about" className="text-white/90 hover:text-white transition-colors duration-200 drop-shadow-sm">About</Link>
          <Link href="/book-appointment" className="text-white/90 hover:text-white transition-colors duration-200 drop-shadow-sm">Book Appointment</Link>
          <Link href="/auth/signin" className="text-white/90 hover:text-white transition-colors duration-200 drop-shadow-sm">Login</Link>
          <Link href="/book-appointment" className="ml-2 inline-flex items-center px-6 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg">
            Book Now
          </Link>
        </nav>

        <button className="md:hidden p-2 rounded hover:bg-blue-700/40 transition-all duration-200" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          <div className="relative w-6 h-6">
            <Menu className={`w-6 h-6 text-white absolute transition-all duration-300 transform ${mobileOpen ? 'rotate-90 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'}`} />
            <X className={`w-6 h-6 text-white absolute transition-all duration-300 transform ${mobileOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-75'}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu with Animation */}
      <div className={`md:hidden border-t border-blue-700/30 bg-gradient-to-r from-blue-900/95 to-teal-700/95 backdrop-blur-md overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-3 space-y-2">
          <Link href="/" className="block py-2 text-white/90 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link href="/about" className="block py-2 text-white/90 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>About</Link>
          <Link href="/book-appointment" className="block py-2 text-white/90 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>Book Appointment</Link>
          <Link href="/auth/signin" className="block py-2 text-white/90 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>Login</Link>
        </div>
      </div>
    </header>
  );
}
