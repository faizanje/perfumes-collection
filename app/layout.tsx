import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { UserMetaProvider } from "@/lib/userMeta";
import { BottlePrefProvider } from "@/lib/bottlePref";
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
    "A searchable archive of 313 fragrances, with notes, families, seasons, occasions and layering.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "The Vault" },
  openGraph: {
    title: "The Vault · A Personal Fragrance Collection",
    description: "313 fragrances, enriched with notes, season, occasion and layering.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a160f" },
    { media: "(prefers-color-scheme: light)", color: "#f6f2e9" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applied before paint to avoid a theme flash. Default: dark.
const themeScript = `(function(){try{var t=localStorage.getItem('pc.theme');if(!t){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${plex.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <UserMetaProvider>
          <BottlePrefProvider>{children}</BottlePrefProvider>
        </UserMetaProvider>
      </body>
    </html>
  );
}
