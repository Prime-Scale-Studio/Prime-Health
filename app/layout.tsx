import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

import { getBaseUrl } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Prime Health — AI‑Powered Clinic Management",
    template: "%s | Prime Health",
  },
  description:
    "Prime Health empowers doctors to manage appointments, patients, and services effortlessly. AI‑powered booking widget. Real‑time notifications. Built for modern clinics.",
  keywords: [
    "clinic management",
    "doctor appointment booking",
    "AI booking widget",
    "patient management",
    "healthcare SaaS",
    "Prime Health",
  ],
  authors: [{ name: "Prime Scale Studio" }],
  creator: "Prime Scale Studio",
  openGraph: {
    type: "website",
    siteName: "Prime Health",
    title: "Prime Health — AI‑Powered Clinic Management",
    description:
      "Manage your clinic with AI‑powered scheduling, patient records, and an embeddable booking widget.",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prime Health Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Health — AI‑Powered Clinic Management",
    description:
      "Manage your clinic with AI‑powered scheduling, patient records, and an embeddable booking widget.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={inter.variable}
    >
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
