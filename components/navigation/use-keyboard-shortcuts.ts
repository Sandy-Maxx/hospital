"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;

      if (mod && event.key.toLowerCase() === "k") {
        // Search is handled by Header/SmartSearch; prevent default to avoid browser search
        event.preventDefault();
      }

      if (mod && event.key.toLowerCase() === "p") {
        event.preventDefault();
        router.push("/patients");
      }

      if (mod && event.key.toLowerCase() === "a") {
        event.preventDefault();
        router.push("/appointments");
      }

      if (mod && event.key.toLowerCase() === "b") {
        event.preventDefault();
        router.push("/billing");
      }

      if (mod && event.key.toLowerCase() === "q") {
        event.preventDefault();
        router.push("/queue");
      }

      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        router.push("/dashboard");
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);
}

