"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MessageCircle, Phone, Mail, Calendar } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface LandingSettings {
  showFloatingCta?: boolean;
  ctaWhatsApp?: string;
  ctaPhone?: string;
  ctaEmail?: string;
}

interface HospitalSettings {
  phone?: string;
  email?: string;
}

export default function PublicFloatingCTA() {
  const [lp, setLp] = useState<LandingSettings | null>(null);
  const [hs, setHs] = useState<HospitalSettings | null>(null);
  const [open, setOpen] = useState(true);
  const [openBook, setOpenBook] = useState(false);
  const [inFrame, setInFrame] = useState(false);

  useEffect(() => {
    try {
      if (window.self !== window.top) {
        setInFrame(true);
        return;
      }
    } catch {}

    fetch("/api/settings/landing-page").then(async (res) => {
      if (res.ok) setLp(await res.json());
    }).catch(() => {});
    fetch("/api/settings/hospital").then(async (res) => {
      if (res.ok) setHs(await res.json());
    }).catch(() => {});
  }, []);

  const enabled = lp?.showFloatingCta !== false; // default true

  const whatsappHref = useMemo(() => {
    const raw = (lp?.ctaWhatsApp?.trim() || hs?.phone?.trim() || "");
    let num = raw.replace(/[^0-9]/g, "");
    if (!num) return null;
    // If likely an Indian 10-digit number, prefix default country code 91
    if (num.length === 10) num = `91${num}`;
    if (num.length < 11) return null;
    const msg = encodeURIComponent("Hello, I would like to book an appointment.");
    return `https://wa.me/${num}?text=${msg}`;
  }, [lp?.ctaWhatsApp, hs?.phone]);

  const phoneHref = useMemo(() => {
    const raw = (lp?.ctaPhone || hs?.phone || "").trim();
    if (!raw) return null;
    return `tel:${raw.replace(/\s/g, "")}`;
  }, [lp?.ctaPhone, hs?.phone]);

  const emailHref = useMemo(() => {
    const raw = (lp?.ctaEmail || hs?.email || "").trim();
    if (!raw) return null;
    return `mailto:${raw}`;
  }, [lp?.ctaEmail, hs?.email]);

  if (!enabled || inFrame) return null;

  return (
    <>
      {/* Desktop floating stack */}
      <div className="hidden md:flex fixed right-5 bottom-6 z-50 flex-col gap-3">
        {/* Toggle/main button */}
        <button
          className="w-12 h-12 rounded-full bg-blue-600/80 hover:bg-blue-700/90 backdrop-blur-md border border-white/20 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
          onClick={() => setOpen((v) => !v)}
          aria-label="Contact options"
        >
          +
        </button>

        {open && (
          <div className="flex flex-col gap-2 transition-all">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-green-500/80 hover:bg-green-600/90 backdrop-blur-md border border-white/20 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
            {phoneHref && (
              <a
                href={phoneHref}
                className="w-12 h-12 rounded-full bg-blue-500/80 hover:bg-blue-600/90 backdrop-blur-md border border-white/20 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
                aria-label="Call"
                title="Call"
              >
                <Phone className="w-5 h-5" />
              </a>
            )}
            {emailHref && (
              <a
                href={emailHref}
                className="w-12 h-12 rounded-full bg-rose-500/80 hover:bg-rose-600/90 backdrop-blur-md border border-white/20 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
                aria-label="Email"
                title="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={() => setOpenBook(true)}
              className="w-12 h-12 rounded-full bg-indigo-600/80 hover:bg-indigo-700/90 backdrop-blur-md border border-white/20 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
              aria-label="Book Appointment"
              title="Book Appointment"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white/90 backdrop-blur border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-4 gap-2 text-xs text-gray-700">
          <button onClick={() => setOpenBook(true)} className="flex flex-col items-center justify-center py-1">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Book</span>
          </button>
          <a href={whatsappHref || '#'} target={whatsappHref ? '_blank' : undefined} rel={whatsappHref ? 'noopener noreferrer' : undefined} className={`flex flex-col items-center justify-center py-1 ${whatsappHref ? '' : 'opacity-40 pointer-events-none'}`}>
            <MessageCircle className="w-5 h-5 text-green-600" />
            <span>WhatsApp</span>
          </a>
          <a href={phoneHref || '#'} className={`flex flex-col items-center justify-center py-1 ${phoneHref ? '' : 'opacity-40 pointer-events-none'}`}>
            <Phone className="w-5 h-5 text-blue-600" />
            <span>Call</span>
          </a>
          <a href={emailHref || '#'} className={`flex flex-col items-center justify-center py-1 ${emailHref ? '' : 'opacity-40 pointer-events-none'}`}>
            <Mail className="w-5 h-5 text-rose-600" />
            <span>Email</span>
          </a>
        </div>
      </div>

      {/* Booking modal */}
      <Dialog open={openBook} onOpenChange={setOpenBook}>
        <DialogContent className="max-w-3xl w-[96vw] h-[88vh] p-0 overflow-hidden">
          <iframe src="/book-appointment?modal=1" className="w-full h-full border-0" />
        </DialogContent>
      </Dialog>
    </>
  );
}
