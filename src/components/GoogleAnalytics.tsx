"use client";

import { useEffect } from "react";
import Script from "next/script";

const GA_ID = "G-RLV3201E1G";
const AW_ID = "AW-17134217839";
const CONVERSION_LABEL = "AW-17134217839/EtBFCMDt_-EaEO_Uneo_";

export function trackConversion(value = 1.0, currency = "USD") {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: CONVERSION_LABEL,
      value,
      currency,
    });
  }
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  // Track conversions on link clicks (calls, CTAs, booking links)
  useEffect(() => {
    function getPageName(): string {
      const path = window.location.pathname;
      if (path === "/") return "home";
      return path.replace(/^\//, "").replace(/\//g, "_") || "home";
    }

    function getButtonLocation(el: HTMLElement): string {
      const section = el.closest("section");
      if (section?.id) return section.id;
      // Check if in header, footer, hero
      if (el.closest("header")) return "header";
      if (el.closest("footer")) return "footer";
      if (el.closest(".hero-bg, [id='home']")) return "hero";
      return "page";
    }

    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const page = getPageName();
      const location = getButtonLocation(anchor);

      // Phone call clicks
      if (anchor.href?.startsWith("tel:")) {
        trackConversion();
        if (typeof window.gtag === "function") {
          window.gtag("event", "call_click", {
            page,
            button_location: location,
          });
        }
      }

      // Booking/CTA link clicks
      if (anchor.href?.includes("/booking") || anchor.getAttribute("href") === "/booking") {
        if (typeof window.gtag === "function") {
          window.gtag("event", "cta_click", {
            page,
            cta_text: anchor.textContent?.trim()?.substring(0, 50) || "Book",
            button_location: location,
          });
        }
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      {/* Google Tag Manager */}
      <Script id="gtm-head" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NPD8BWW9');`}
      </Script>
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-NPD8BWW9"
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
          gtag('config', '${AW_ID}');
        `}
      </Script>
    </>
  );
}
