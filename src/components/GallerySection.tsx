"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FaXmark, FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const galleryImages = [
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/a0727b36-6eb3-409e-b261-c448ce8928ae-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/a0727b36-6eb3-409e-b261-c448ce8928ae-2-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/e9eb5c80-510c-4c91-8ddc-559f28c534a2-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/70d0e955-1d61-4cef-bb2a-1856a44ab8ba-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/facb3b25-a44e-40ed-956f-bc5905f88f21-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/6abccbb9-0e2e-4a60-ad40-8c102e69c362-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/3-400x516.png", alt: "TP Dumpsters California" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/8af9ecef-f2b7-4563-8bf1-7f5782d4753b-2-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/47cef18d-00db-43a6-b4dd-268793e01120-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/2c46e916-7725-4230-9e8d-77916bb0855b-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/d70972d5-1b1a-413b-955a-b87923594ecd-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/Diseno-sin-titulo-5-400x516.png", alt: "TP Dumpsters California" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/6f819665-12a4-46fd-b23e-15591614c896-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/3399a861-91dd-4304-94b7-fda116ccb252-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/5-400x516.png", alt: "TP Dumpsters California" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/b56b626f-6d9f-4975-afd3-5f9af62c032c-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/9caf8401-1410-45df-82e4-4113a2f12f6f-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/e28260f1-432c-463c-b470-bd6e0945b955-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/eb8b857f-c761-4268-a850-e15a078a0ca0-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/8af9ecef-f2b7-4563-8bf1-7f5782d4753b-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/b8b71cfa-8439-4024-ac72-c93d33267a75-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/2e9b0dcd-6b2d-4964-b17e-beecb198716b-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/89a8f225-b27f-4144-9398-0fa0ca17b663-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/2c46e916-7725-4230-9e8d-77916bb0855b-2-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/1f50b16a-bc3d-44b0-8b25-88815896318e-400x516.jpg", alt: "TP Services" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/e9b01c28-cd63-4148-8e5d-10fff45519b2-400x516.jpg", alt: "TP Dumpsters" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/83fd2ec0-c296-4bfb-afb5-dcc2667614d2-400x516.jpg", alt: "TP Dumpster California" },
  { src: "https://tpservicesca.com/wp-content/uploads/2025/06/6987546d-159b-4e70-9528-afea5f315a06-400x516.jpg", alt: "TP Dumpsters" },
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
