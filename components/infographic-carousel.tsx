"use client";

import { useEffect, useState } from "react";

interface Props {
  images: string[];
  pageSize?: number;
  autoAdvance?: boolean;
  interval?: number;
}

export default function InfographicCarousel({ images, pageSize = 2, autoAdvance = false, interval = 5000 }: Props) {
  const [page, setPage] = useState(0);

  const pages = Math.max(1, Math.ceil(images.length / pageSize));

  useEffect(() => {
    if (!autoAdvance || pages <= 1) return;
    const t = setInterval(() => setPage((p) => (p + 1) % pages), interval);
    return () => clearInterval(t);
  }, [autoAdvance, pages, interval]);

  const prev = () => setPage((p) => (p - 1 + pages) % pages);
  const next = () => setPage((p) => (p + 1) % pages);

  return (
    <div className="relative w-full max-w-full">
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-700 ease-in-out gap-4"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {images.map((src, i) => (
            <div key={i} className="flex-shrink-0 px-2" style={{ width: `${100 / pageSize}%`, boxSizing: 'border-box' }}>
              <div className="overflow-hidden rounded-lg">
                <img src={src} alt={`Infografia ${i + 1}`} className="w-full h-[420px] object-cover rounded-md shadow-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      {pages > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 text-[color:var(--cta-text)] p-2 rounded-full shadow-md hover:bg-white"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 text-[color:var(--cta-text)] p-2 rounded-full shadow-md hover:bg-white"
          >
            ›
          </button>
        </>
      )}

      {/* Indicators (per page) */}
      <div className="flex gap-2 justify-center mt-4">
        {Array.from({ length: pages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`w-3 h-3 rounded-full ${i === page ? "bg-[color:var(--cta-text)]" : "bg-gray-300"}`}
            aria-label={`Ir a página ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
