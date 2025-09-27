import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

import fs from "fs";
import path from "path";

function readIconVersion() {
  try {
    const sPath = path.join(process.cwd(), "data", "hospital-settings.json");
    const data = JSON.parse(fs.readFileSync(sPath, "utf8"));
    return data.faviconVersion || 1;
  } catch {
    return 1;
  }
}

export const metadata: Metadata = {
  title: "Medicaring Hospital - Your Health, Our Priority",
  description: "Medicaring Hospital in Pune - 15+ years of excellence in healthcare with state-of-the-art facilities and expert medical professionals",
  manifest: "/manifest.json",
  icons: {
    icon: `/favicon.ico?v=${readIconVersion()}`,
    shortcut: `/favicon.ico?v=${readIconVersion()}`,
    apple: "/icon.png",
  },
  applicationName: "Medicaring Hospital",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Medicaring Hospital"
  }
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
