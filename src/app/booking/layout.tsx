export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="manifest" href="/manifest-booking.json" />
      <meta name="theme-color" content="#dc2626" />
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
