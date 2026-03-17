import type { Metadata } from "next";
import Header from "@/components/Header";
import FloatingButtons from "@/components/FloatingButtons";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import BookingWizard from "./components/BookingWizard";

export const metadata: Metadata = {
  title: "Book a Dumpster Online | TP Dumpsters - Bay Area",
  description:
    "Book your dumpster rental online. Choose your size, pick your dates, and get an instant quote. Same-day delivery available in the Bay Area. Call (510) 650-2083",
  robots: {
    index: true,
    follow: true,
  },
};

export default function BookingPage() {
  return (
    <>
      <Header />
      {/* Hero banner */}
      <section className="bg-black pt-28 pb-10 text-center">
        <div className="w-[92%] sm:w-[80%] max-w-[900px] mx-auto">
          <h1 className="font-[var(--font-oswald)] text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white uppercase mb-3 tracking-wide">
            Book Your Dumpster
          </h1>
          <p className="font-[var(--font-poppins)] text-sm sm:text-base text-white/70 max-w-lg mx-auto">
            Choose your service, pick your dates, and get an instant quote.
            <br />
            <span className="text-tp-gold font-semibold">Same-day delivery available!</span>
          </p>
        </div>
      </section>

      {/* Booking wizard */}
      <section className="bg-[#f5f5f5] min-h-screen pb-20">
        <ErrorBoundary
          fallback={
            <div className="w-[92%] max-w-[600px] mx-auto py-20 text-center">
              <h2 className="text-2xl font-bold text-[#333] mb-4">
                Something went wrong
              </h2>
              <p className="text-[#888] mb-6">
                Please call us to complete your booking.
              </p>
              <a
                href="tel:+15106502083"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-tp-red text-white font-bold"
              >
                Call (510) 650-2083
              </a>
            </div>
          }
        >
          <BookingWizard />
        </ErrorBoundary>
      </section>

      <FloatingButtons />
      <Footer />
    </>
  );
}
