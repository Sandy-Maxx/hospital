"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import * as Icons from "lucide-react";

type IconKey = keyof typeof Icons;

// Use string[] to avoid compile-time errors when a key isn't available in the installed lucide-react version.
const DEFAULT_ICON_KEYS: string[] = [
  "Stethoscope",
  "Heart",
  "Activity",
  "Pill",
  "Syringe",
  "Shield",
  "Brain",
  "Bone",
  "Hospital",
  "FileHeart",
  "User",
  "Users",
  "Scan",
  "Microscope",
  "FlaskConical",
  "Thermometer",
  "Tooth",
  "Ambulance",
  "Building2",
  "ClipboardList",
  "Calendar",
  "Clock",
];

interface IconPickerProps {
  value: string; // icon name (Lucide component key), e.g., "Stethoscope"
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function IconPicker({ value, onChange, placeholder = "Select an icon", className = "" }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options: { key: string; Comp: React.ComponentType<any> }[] = useMemo(() => {
    // Some Lucide exports are forwardRef exotic components (typeof === 'object').
    // Consider any truthy export as a valid component.
    const keys = DEFAULT_ICON_KEYS.filter((k) => Boolean((Icons as any)[k]));
    return keys.map((key) => ({ key, Comp: (Icons as any)[key] }));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.key.toLowerCase().includes(q));
  }, [options, query]);

  const Selected = (value && (Icons as any)[value as string]) || null;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white flex items-center justify-between"
     >
        <span className="flex items-center gap-2">
          {Selected ? (
            <Selected className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4 rounded bg-gray-200 inline-block" />
          )}
          <span className="text-sm text-gray-700">
            {value || placeholder}
          </span>
        </span>
        <Icons.ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full border bg-white rounded-md shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search icons..."
              className="w-full h-9 px-2 border border-gray-300 rounded"
            />
          </div>
          <div className="max-h-64 overflow-auto p-2 grid grid-cols-4 gap-2">
            {filtered.map(({ key, Comp }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-100 border ${
                  value === key ? "border-blue-500" : "border-transparent"
                }`}
                title={key}
              >
                <Comp className="w-5 h-5" />
                <span className="text-[10px] text-gray-600 truncate w-full text-center">{key}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-4 text-center text-sm text-gray-500 py-4">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

