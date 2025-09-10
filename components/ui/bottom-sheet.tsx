"use client";

import React, { useEffect } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3" />
        {title && <div className="px-4 py-2 text-center font-semibold text-gray-900">{title}</div>}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

