// ============================================================
// MAXVOLT — Back to top button
// ============================================================

import { useState, useEffect } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollUp = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      onClick={scrollUp}
      aria-label="Back to top"
      className={`fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[900] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-dark-elevated border border-dark-border-strong text-[var(--text)] grid place-items-center shadow-lg hover:bg-secondary hover:text-white hover:border-secondary hover:-translate-y-0.5 transition-all ${
        visible
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      }`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}