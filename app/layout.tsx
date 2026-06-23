import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { UserMetaProvider } from "@/lib/userMeta";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono-plex",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Vault · A Personal Fragrance Collection",
  description:
    "A curated, searchable archive of 313 fragrances — notes, families, seasons, occasions and layering, all in one place.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "The Vault" },
  openGraph: {
    title: "The Vault · A Personal Fragrance Collection",
    description: "313 fragrances, enriched with notes, season, occasion and layering.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4efe6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plex.variable}`}>
      <body>
        <UserMetaProvider>{children}</UserMetaProvider>
      </body>
    </html>
  );
}
