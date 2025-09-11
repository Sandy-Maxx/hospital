import { useMemo } from "react";
import toastLib from "react-hot-toast";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const api = useMemo(() => {
    return {
      toast: ({ title, description, variant = "default" }: ToastOptions) => {
        const message = [title, description].filter(Boolean).join(" - ");
        if (variant === "destructive") {
          toastLib.error(message || "Error");
        } else {
          toastLib.success(message || "Success");
        }
      },
    };
  }, []);

  return api;
}

