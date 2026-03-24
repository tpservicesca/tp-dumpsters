'use client';

import { use } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import Image from 'next/image';
import Link from 'next/link';
import { FiPhone, FiArrowLeft, FiClock, FiCalendar, FiChevronRight, FiStar, FiShield, FiCheckCircle } from 'react-icons/fi';
import { blogPosts } from '@/data/blog-posts';

/* ───── blog content registry ───── */
import DumpsterRentalCost from '../_articles/dumpster-rental-cost';
import YardWasteDisposal from '../_articles/yard-waste-disposal';
import HowToRentADumpster from '../_articles/how-to-rent-a-dumpster';
import ConstructionDebrisDisposal from '../_articles/construction-debris-disposal';
import WhatSizeDumpster from '../_articles/what-size-dumpster-do-i-need';
import DemolitionDebrisRemoval from '../_articles/demolition-debris-removal';
import HomeRenovationDumpster from '../_articles/home-renovation-dumpster';
import WhatCanGoInDumpster from '../_articles/what-can-go-in-a-dumpster';

const articleComponents: Record<string, React.ComponentType> = {
  'dumpster-rental-cost': DumpsterRentalCost,
  'yard-waste-disposal': YardWasteDisposal,
  'how-to-rent-a-dumpster': HowToRentADumpster,
  'construction-debris-disposal': ConstructionDebrisDisposal,
  'what-size-dumpster-do-i-need': WhatSizeDumpster,
  'demolition-debris-removal': DemolitionDebrisRemoval,
  'home-renovation-dumpster': HomeRenovationDumpster,
  'what-can-go-in-a-dumpster': WhatCanGoInDumpster,
};

/* ───── CTA components ───── */
function CallNowMobile() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-tp-red p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <a
        href="tel:+15106502083"
        className="flex items-center justify-center gap-2 bg-white text-tp-red font-bold py-3 rounded-full text-lg"
      >
        <FiPhone className="w-5 h-5" /> Call Now — Free Quote
      </a>
    </div>
  );
}

function InlineCTA({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  if (variant === 'secondary') {
    return (
      <div className="my-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8 text-center">
        <p className="text-lg text-gray-700 mb-2">
          <strong>Need a dumpster for your project?</strong>
        </p>
        <p className="text-gray-600 mb-5">
          TP Dumpsters offers same-day delivery across the Bay Area with transparent pricing. Bilingual support available in English &amp; Spanish.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:+15106502083"
            className="inline-flex items-center justify-center gap-2 bg-tp-red text-white font-bold px-6 py-3 rounded-full hover:bg-tp-red-dark transition-all"
          >
            <FiPhone className="w-[18px] h-[18px]" /> Call for Free Quote
          </a>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 bg-white text-tp-red font-bold px-6 py-3 rounded-full border-2 border-tp-red hover:bg-red-50 transition-all"
          >
            Book Online
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="my-10 bg-gradient-to-r from-tp-red to-red-700 rounded-2xl p-6 md:p-8 text-center text-white">
      <h3 className="font-[var(--font-oswald)] text-2xl md:text-3xl font-bold mb-3">
        Ready to Book Your Dumpster?
      </h3>
      <p className="text-white/90 mb-5 max-w-lg mx-auto">
        Get a free, no-obligation quote from TP Dumpsters. Same-day delivery available across the Bay Area — transparent pricing, no hidden fees.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="tel:+15106502083"
          className="inline-flex items-center justify-center gap-2 bg-white text-tp-red font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-all"
        >
          <FiPhone className="w-[18px] h-[18px]" /> (510) 650-2083
        </a>
        <Link
          href="/booking"
          className="inline-flex items-center justify-center gap-2 bg-transparent text-white font-bold px-6 py-3 rounded-full border-2 border-white hover:bg-white/10 transition-all"
        >
          Book Your Dumpster <FiChevronRight className="w-[18px] h-[18px]" />
        </Link>
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-sm text-white/80">
        <span className="flex items-center gap-1"><FiStar className="w-3.5 h-3.5" /> 5.0 Rating</span>
        <span className="flex items-center gap-1"><FiShield className="w-3.5 h-3.5" /> Transparent Pricing</span>
        <span className="flex items-center gap-1"><FiCheckCircle className="w-3.5 h-3.5" /> Same-Day Delivery</span>
      </div>
    </div>
  );
}

function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  const related = blogPosts.filter((p) => p.slug !== currentSlug).slice(0, 3);
  return (
    <div className="mt-16 border-t border-gray-200 pt-12">
      <h2 className="font-[var(--font-oswald)] text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
        More Articles You Might Like
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-tp-red text-white text-xs font-bold px-3 py-1 rounded-full">
                {post.category}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-[var(--font-oswald)] text-lg font-bold text-gray-900 group-hover:text-tp-red transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 mt-2">{post.readTime}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ───── main page ───── */
export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return null;

  const ArticleContent = articleComponents[slug];

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-end pt-[100px]">
        <div className="absolute inset-0 z-0">
          <Image src={post.image} alt={post.title} fill className="object-cover" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-[1]" />
        <div className="relative z-[2] w-full max-w-[900px] mx-auto px-5 pb-10 md:pb-16">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>
          </div>
          <div className="inline-block bg-tp-red text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            {post.category}
          </div>
          <h1 className="font-[var(--font-oswald)] text-[2rem] sm:text-[2.8rem] lg:text-[3.5rem] font-bold text-white leading-[1.1] mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-1">
              <FiCalendar className="w-3.5 h-3.5" /> {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <FiClock className="w-3.5 h-3.5" /> {post.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Article body */}
      <article className="max-w-[900px] mx-auto px-5 py-12 md:py-16">
        {ArticleContent ? (
          <ArticleContent />
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500 mb-6">This article is coming soon!</p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-tp-red text-white font-bold px-6 py-3 rounded-full hover:bg-tp-red-dark transition-all"
            >
              <FiArrowLeft className="w-[18px] h-[18px]" /> Back to Blog
            </Link>
          </div>
        )}

        {ArticleContent && (
          <>
            <InlineCTA variant="primary" />
            <RelatedPosts currentSlug={slug} />
          </>
        )}
      </article>

      <CallNowMobile />

      <div className="pb-16 md:pb-0">
        <FloatingButtons />
        <Footer />
      </div>
    </>
  );
}

export { InlineCTA };
