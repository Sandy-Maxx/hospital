"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Stethoscope, Phone, Mail, MapPin } from "lucide-react";

interface HospitalSettings {
  name?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export default function PublicFooter() {
  const [settings, setSettings] = useState<HospitalSettings>({});

  useEffect(() => {
    fetch("/api/settings/hospital").then(async (res) => {
      if (res.ok) setSettings(await res.json());
    }).catch(() => {});
  }, []);

  return (
    <footer className="border-t border-white/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {settings.logo ? (
                <img src={settings.logo} alt="logo" className="w-8 h-8 object-contain rounded" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-semibold text-white">{settings.name || "Hospital"}</span>
            </div>
            <p className="text-sm text-blue-200/80">Compassionate care. Modern facilities. Trusted doctors.</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-blue-200/80 hover:text-white transition-colors duration-200">Home</Link></li>
              <li><Link href="/about" className="text-blue-200/80 hover:text-white transition-colors duration-200">About</Link></li>
              <li><Link href="/book-appointment" className="text-blue-200/80 hover:text-white transition-colors duration-200">Book Appointment</Link></li>
              <li><Link href="/auth/signin" className="text-blue-200/80 hover:text-white transition-colors duration-200">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-blue-200/80">
              {settings.phone && (<li className="flex items-center gap-2"><Phone className="w-4 h-4" /> {settings.phone}</li>)}
              {settings.email && (<li className="flex items-center gap-2"><Mail className="w-4 h-4" /> {settings.email}</li>)}
              {settings.address && (<li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /> <span>{settings.address}</span></li>)}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Stay Updated</h4>
            <p className="text-sm text-blue-200/80 mb-3">Get updates on services, health tips, and more.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input type="email" placeholder="Your email" className="flex-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:ring-blue-400 focus:border-blue-400 px-3 py-2 text-sm" />
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-sm rounded-md hover:from-blue-600 hover:to-blue-800 transition-all duration-200 shadow-lg">Subscribe</button>
            </form>
          </div>
        </div>
      </div>
      <div className="border-t border-white/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-blue-200/80">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-4">
              {settings.socialMedia?.facebook && (<Link href={settings.socialMedia.facebook} className="hover:text-white transition-colors duration-200">Facebook</Link>)}
              {settings.socialMedia?.instagram && (<Link href={settings.socialMedia.instagram} className="hover:text-white transition-colors duration-200">Instagram</Link>)}
              {settings.socialMedia?.twitter && (<Link href={settings.socialMedia.twitter} className="hover:text-white transition-colors duration-200">X</Link>)}
              {settings.socialMedia?.linkedin && (<Link href={settings.socialMedia.linkedin} className="hover:text-white transition-colors duration-200">LinkedIn</Link>)}
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <span>© {new Date().getFullYear()} {settings.name || "Medicaring Hospital"}. All rights reserved.</span>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 text-center">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-semibold">🚧 Under Development by Elite ArchWeb Studio</span>
                <span className="text-blue-300/80 text-xs">Contact: 7087467976</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
