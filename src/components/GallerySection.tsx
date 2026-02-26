"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FaXmark, FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const galleryImages = [
  { src: "/images/gallery/01.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/02.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/03.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/04.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/05.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/06.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/07.png", alt: "TP Dumpsters California" },
  { src: "/images/gallery/08.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/09.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/10.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/11.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/12.png", alt: "TP Dumpsters California" },
  { src: "/images/gallery/13.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/14.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/15.png", alt: "TP Dumpsters California" },
  { src: "/images/gallery/16.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/17.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/18.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/19.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/20.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/21.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/22.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/23.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/24.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/25.jpg", alt: "TP Services" },
  { src: "/images/gallery/26.jpg", alt: "TP Dumpsters" },
  { src: "/images/gallery/27.jpg", alt: "TP Dumpster California" },
  { src: "/images/gallery/28.jpg", alt: "TP Dumpsters" },
];

const ITEMS_PER_PAGE = 8;

export default function GallerySection() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const totalPages = Math.ceil(galleryImages.length / ITEMS_PER_PAGE);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageImages = galleryImages.slice(start, start + ITEMS_PER_PAGE);

  const isModalOpen = selectedIndex !== null;
  const currentImage = isModalOpen ? galleryImages[selectedIndex] : null;
  const totalImages = galleryImages.length;

  const closeModal = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev !== null && prev < totalImages - 1 ? prev + 1 : prev
    );
  }, [totalImages]);

  // Keyboard: Escape, ArrowLeft, ArrowRight
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal, goToPrev, goToNext]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const scrollToGallery = () => {
    const el = document.getElementById("clients");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    scrollToGallery();
  };

  // Calculate the global index from the page-relative index
  const openModal = (pageRelativeIndex: number) => {
    const globalIndex = start + pageRelativeIndex;
    setSelectedIndex(globalIndex);
  };

  return (
    <section id="clients" className="py-20 pb-15 bg-white">
      <div className="w-[95%] max-w-[1600px] mx-auto relative">
        <h4 className="font-[var(--font-red-hat)] text-sm font-bold text-tp-gold uppercase tracking-[2px] mb-2 text-center">
          GALLERY
        </h4>
        <h2 className="font-[var(--font-poppins)] text-[26px] md:text-[32px] font-bold text-[#333] mb-10 text-center">
          Recent Services
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-10 lg:gap-[100px] mb-8">
          {pageImages.map((img, i) => (
            <div
              key={`${currentPage}-${i}`}
              role="button"
              tabIndex={0}
              aria-label={`View ${img.alt} full size (image ${start + i + 1} of ${totalImages})`}
              className="gallery-item rounded-2xl overflow-hidden bg-[#f0f0f0] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] cursor-pointer"
              onClick={() => openModal(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(i); } }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={400}
                height={516}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end items-center gap-2.5 mt-5">
          <button
            className={`px-3 py-1.5 border-none bg-transparent font-[var(--font-poppins)] text-sm cursor-pointer transition-colors duration-300 ${currentPage === 1 ? "text-[#ccc]" : "text-[#666] hover:text-tp-red"}`}
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`px-3 py-1.5 border-none bg-transparent font-[var(--font-poppins)] text-sm cursor-pointer transition-colors duration-300 ${page === currentPage ? "text-tp-red font-bold" : "text-[#666] hover:text-tp-red"}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className={`px-3 py-1.5 border-none bg-transparent font-[var(--font-poppins)] text-sm cursor-pointer transition-colors duration-300 ${currentPage === totalPages ? "text-[#ccc]" : "text-[#666] hover:text-tp-red"}`}
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isModalOpen && currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Image viewer: ${currentImage.alt} — ${selectedIndex + 1} of ${totalImages}`}
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-[fadeIn_0.2s_ease-out]"
          onClick={closeModal}
        >
          {/* Close button */}
          <button
            className="absolute top-3 right-3 md:top-5 md:right-5 text-white/80 hover:text-white text-xl md:text-2xl transition-colors duration-200 z-10 w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
            onClick={closeModal}
            aria-label="Close"
          >
            <FaXmark />
          </button>

          {/* Previous arrow */}
          <button
            className={`absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-lg md:text-xl transition-all duration-200 ${
              selectedIndex === 0
                ? "bg-white/10 text-white/30 cursor-default"
                : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-white cursor-pointer"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            disabled={selectedIndex === 0}
            aria-label="Previous image"
          >
            <FaChevronLeft />
          </button>

          {/* Next arrow */}
          <button
            className={`absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full text-lg md:text-xl transition-all duration-200 ${
              selectedIndex === totalImages - 1
                ? "bg-white/10 text-white/30 cursor-default"
                : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-white cursor-pointer"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            disabled={selectedIndex === totalImages - 1}
            aria-label="Next image"
          >
            <FaChevronRight />
          </button>

          {/* Image counter */}
          <div
            className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white/90 px-4 py-1.5 rounded-full text-xs md:text-sm font-[var(--font-poppins)] font-medium tracking-wide"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedIndex + 1} / {totalImages}
          </div>

          {/* Image container */}
          <div
            className="relative w-full h-[75vh] md:h-[82vh] max-w-4xl mx-14 md:mx-20"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 90vw, (max-width: 1024px) 80vw, 900px"
              priority
            />
          </div>
        </div>
      )}
    </section>
  );
}
