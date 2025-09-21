"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";

type DrawerSide = "left" | "right" | "bottom";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  side?: DrawerSide;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export default function Drawer({
  isOpen,
  onClose,
  side = "left",
  children,
  title,
  className = "",
}: DrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const variants =
    side === "bottom"
      ? { hidden: { y: "100%" }, visible: { y: 0 } }
      : side === "right"
      ? { hidden: { x: "100%" }, visible: { x: 0 } }
      : { hidden: { x: "-100%" }, visible: { x: 0 } };

  const panelBase =
    side === "bottom"
      ? "left-0 right-0 bottom-0 rounded-t-2xl"
      : side === "right"
      ? "right-0 top-0 bottom-0 rounded-l-2xl"
      : "left-0 top-0 bottom-0 rounded-r-2xl";

  const panelSize =
    side === "bottom" ? "max-h-[85vh] w-full" : "w-[86vw] max-w-sm";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className={`absolute bg-white shadow-xl ${panelBase} ${panelSize} overflow-y-auto pb-[env(safe-area-inset-bottom)] ${className}`}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            variants={variants}
          >
            {/* Handle for bottom sheet */}
            {side === "bottom" && (
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3" />
            )}
            {title && (
              <div className="px-4 py-3 text-base font-semibold text-gray-900">
                {title}
              </div>
            )}
            <div className="p-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}