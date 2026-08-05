import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/landing/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.cdonna.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ClouDonna — Enterprise Decision Intelligence",
  description:
    "ClouDonna helps organizations make evidence-based enterprise technology decisions through AI, structured market intelligence, trusted benchmarks and expert knowledge.",
  openGraph: {
    siteName: "ClouDonna",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ClouDonna",
  url: SITE_URL,
  logo: `${SITE_URL}/cloudonna-favicon-512.png`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
