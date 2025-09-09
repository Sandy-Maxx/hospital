"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Suggestion {
  type: "patient" | "doctor";
  id: string;
  text: string;
  subText?: string;
}

export default function SmartSearch({ placeholder }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          fetch(
            `/api/patients?search=${encodeURIComponent(debouncedQuery)}&limit=5&page=1`,
          ),
          fetch("/api/doctors"),
        ]);
        const patientData = patientsRes.ok
          ? await patientsRes.json()
          : { patients: [] };
        const doctorData = doctorsRes.ok
          ? await doctorsRes.json()
          : { doctors: [] };
        const doctors = (doctorData.doctors || []).filter((d: any) =>
          (d.name || "").toLowerCase().includes(debouncedQuery.toLowerCase()),
        );
        const list: Suggestion[] = [];
        for (const p of patientData.patients || []) {
          list.push({
            type: "patient",
            id: p.id,
            text: `${p.firstName} ${p.lastName}`.trim(),
            subText: p.phone,
          });
        }
        for (const d of doctors.slice(0, 5)) {
          list.push({
            type: "doctor",
            id: d.id,
            text: d.name,
            subText: d.department || "",
          });
        }
        if (mounted) setSuggestions(list);
      } catch {
        if (mounted) setSuggestions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/patients/new");
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  const onSelect = (s: Suggestion) => {
    setOpen(false);
    if (s.type === "patient")
      router.push(`/patients?search=${encodeURIComponent(s.text)}`);
    if (s.type === "doctor")
      router.push(`/appointments?doctor=${encodeURIComponent(s.id)}`);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder || "Search..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="w-80 md:w-96 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.id}-${i}`}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              onClick={() => onSelect(s)}
            >
              <div className="font-medium">{s.text}</div>
              {s.subText && (
                <div className="text-sm text-gray-500">{s.subText}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
