// ============================================================
// MAXVOLT — Auto-scrolling product marquee
// ============================================================

import { marqueeItems } from '@data/products';

export default function Marquee() {
  const doubled = [...marqueeItems, ...marqueeItems];

  return (
    <section
      className="relative bg-gradient-to-r from-[#000814] via-[#001a3d] to-[#000814] text-white py-4 overflow-hidden border-y border-[var(--border)]"
      aria-label="Featured products marquee"
    >
      {/* Fade edges */}
      <div className="absolute top-0 bottom-0 left-0 w-8 sm:w-20 z-10 bg-gradient-to-r from-[#000814] to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-8 sm:w-20 z-10 bg-gradient-to-l from-[#000814] to-transparent pointer-events-none" />

      {/* Subtle top/bottom accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="flex gap-8 sm:gap-14 w-max animate-marquee">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="text-xs sm:text-sm font-semibold whitespace-nowrap opacity-95 flex items-center"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}