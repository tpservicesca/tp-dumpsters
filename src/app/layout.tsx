import type { Metadata } from "next";
import { Poppins, Oswald, Red_Hat_Display, Open_Sans } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Rent a Dumpster in California! - TP Dumpsters",
  description:
    "Fast, reliable dumpster rentals in the Bay Area. 10, 20 & 30 yard roll-off dumpsters for contractors, remodelers & cleanups. Same-day delivery. Bilingual support. Transparent pricing.",
  keywords: [
    "dumpster rental",
    "Bay Area dumpster",
    "California dumpster rental",
    "roll-off dumpster",
    "construction dumpster",
    "TP Dumpsters",
    "10 yard dumpster",
    "20 yard dumpster",
    "30 yard dumpster",
    "same day dumpster delivery",
    "Oakland dumpster rental",
    "Pinole dumpster",
  ],
  icons: {
    icon: "https://tpservicesca.com/wp-content/uploads/2025/06/cropped-TP-32x32.png",
  },
  openGraph: {
    title: "Rent a Dumpster in California! - TP Dumpsters",
    description:
      "Fast, reliable dumpster rentals in the Bay Area. 10, 20 & 30 yard roll-off dumpsters. Same-day delivery available.",
    url: "https://tpservicesca.com",
    siteName: "TP Dumpsters",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://tpservicesca.com/wp-content/uploads/2025/06/red-dumpster-construction.png",
        width: 1200,
        height: 630,
        alt: "TP Dumpsters - Fast, Reliable Dumpster Rentals in California",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rent a Dumpster in California! - TP Dumpsters",
    description:
      "Fast, reliable dumpster rentals in the Bay Area. Same-day delivery available.",
    images: [
      "https://tpservicesca.com/wp-content/uploads/2025/06/red-dumpster-construction.png",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://tpservicesca.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${poppins.variable} ${oswald.variable} ${redHatDisplay.variable} ${openSans.variable} font-[var(--font-open-sans)] text-sm text-[#666] bg-white leading-[1.7em] font-medium antialiased`}
      >
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
