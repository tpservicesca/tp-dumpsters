import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | TP Dumpsters",
  robots: { index: false, follow: false },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "TP Manager",
    "mobile-web-app-capable": "yes",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="manifest" href="/manifest-dashboard.json" />
      <meta name="theme-color" content="#000000" />
      <link rel="apple-touch-icon" href="/images/logo/TP.png" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            }
          `,
        }}
      />
      {children}
    </>
  );
}
