"use client";

import { useEffect } from "react";
import Script from "next/script";

const GA_ID = "G-WYM186DG5B";
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
  // Track conversions on any tel: link click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (anchor?.href?.startsWith("tel:")) {
        trackConversion();
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
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
