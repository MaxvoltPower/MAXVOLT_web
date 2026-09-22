// ============================================================
// MAXVOLT — Hero carousel
// Production-grade, accessible, mobile-first.
// ============================================================

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { Link } from 'react-router-dom';
import { heroSlides } from '@data/products';
import { openWhatsapp } from '@lib/utils';

const AUTO_MS = 6500;

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, locked: false });
  const total = heroSlides.length;

  // Respect user's reduced-motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const goToSlide = useCallback(
    (index) => {
      const next = ((index % total) + total) % total;
      setCurrentIndex(next);
    },
    [total]
  );

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-advance (paused on hover/focus, disabled with reduced-motion)
  useEffect(() => {
    if (isPaused || prefersReducedMotion) return undefined;
    const timer = setInterval(() => {
      if (!document.hidden) nextSlide();
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, prefersReducedMotion]);

  // Keyboard nav — only when carousel has focus
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    },
    [nextSlide, prevSlide]
  );

  // Touch handlers — lock to horizontal swipe so vertical scroll still works
  const onTouchStart = (e) => {
    const t = e.changedTouches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, locked: false };
  };

  const onTouchMove = (e) => {
    const t = e.changedTouches[0];
    const start = touchStartRef.current;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    if (!start.locked) {
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
        start.locked = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (start.locked && e.cancelable) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e) => {
    const t = e.changedTouches[0];
    const start = touchStartRef.current;
    if (!start.locked) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  };

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative w-full overflow-hidden bg-[#000814] isolate
                 h-[min(88vh,620px)] min-h-[440px]
                 sm:min-h-[520px] lg:min-h-[600px]"
      role="region"
      aria-roledescription="carousel"
      aria-label="MAXVOLT highlights"
    >
      {/* Slides stack */}
      <div
        className="absolute inset-0"
        aria-live={isPaused ? 'polite' : 'off'}
      >
        {heroSlides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === currentIndex
                ? 'opacity-100 z-10 pointer-events-auto'
                : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={i !== currentIndex}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${total}`}
          >
            <SlideContent
              slide={slide}
              isActive={i === currentIndex}
              reducedMotion={prefersReducedMotion}
            />
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-20 overflow-hidden"
        aria-hidden="true"
      >
        <div
          key={`${currentIndex}-${isPaused ? 'p' : 'r'}`}
          className="h-full bg-gradient-to-r from-secondary to-secondary-light shadow-[0_0_12px_rgba(255,107,0,0.6)] origin-left"
          style={
            prefersReducedMotion
              ? { width: '100%', opacity: 0.4 }
              : isPaused
              ? { width: '100%', opacity: 0.35 }
              : { animation: `heroProgress ${AUTO_MS}ms linear forwards` }
          }
        />
      </div>

      {/* Arrows — desktop only, hidden on mobile */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous slide"
        className="hidden sm:grid absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-30
                   w-11 h-11 lg:w-12 lg:h-12 place-items-center
                   text-white rounded-full
                   bg-black/40 border border-white/25 backdrop-blur-md
                   hover:bg-secondary hover:border-secondary hover:scale-110
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary
                   transition-all duration-200"
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next slide"
        className="hidden sm:grid absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-30
                   w-11 h-11 lg:w-12 lg:h-12 place-items-center
                   text-white rounded-full
                   bg-black/40 border border-white/25 backdrop-blur-md
                   hover:bg-secondary hover:border-secondary hover:scale-110
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary
                   transition-all duration-200"
      >
        <Chevron dir="right" />
      </button>

      {/* Bottom dots — single source of slide navigation */}
      <div
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2.5"
        role="tablist"
        aria-label="Slide navigation"
      >
        {heroSlides.map((s, i) => {
          const active = i === currentIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToSlide(i)}
              role="tab"
              aria-selected={active}
              aria-label={`Go to slide ${i + 1}: ${s.tagline || s.title}`}
              className={`h-2.5 rounded-full transition-all duration-200 ${
                active
                  ? 'w-8 bg-secondary shadow-[0_0_10px_rgba(255,107,0,0.6)]'
                  : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Slide content renderers                                                    */
/* -------------------------------------------------------------------------- */

function SlideContent({ slide, isActive, reducedMotion }) {
  const animStyle = useMemo(() => {
    const mk = (delay) => {
      if (reducedMotion) {
        return { opacity: isActive ? 1 : 0 };
      }
      return {
        animation: isActive
          ? `heroFadeUp 650ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`
          : 'none',
        opacity: isActive ? undefined : 0,
      };
    };
    return mk;
  }, [isActive, reducedMotion]);

  const renderCta = (cta, variant, delay) => {
    if (!cta) return null;

    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
      'text-sm sm:text-base px-5 sm:px-7 py-3 sm:py-3.5 ' +
      'transition-all duration-200 hover:-translate-y-0.5 ' +
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary';

    const primary =
      `${base} bg-gradient-to-br from-secondary to-secondary-light text-white ` +
      'shadow-lg shadow-secondary/30 hover:shadow-xl hover:shadow-secondary/50';

    const secondary =
      `${base} border-2 border-white/55 text-white bg-white/5 backdrop-blur-sm ` +
      'hover:bg-white/15 hover:border-white';

    const cls = variant === 'primary' ? primary : secondary;

    if (cta.href === 'whatsapp') {
      return (
        <button
          type="button"
          onClick={() => openWhatsapp()}
          className={cls}
          style={animStyle(delay)}
        >
          {cta.text}
        </button>
      );
    }

    if (cta.href.startsWith('#')) {
      return (
        <a href={cta.href} className={cls} style={animStyle(delay)}>
          {cta.text}
        </a>
      );
    }

    return (
      <Link to={cta.href} className={cls} style={animStyle(delay)}>
        {cta.text}
      </Link>
    );
  };

  /* ------------------------------ Center layout ---------------------------- */
  if (slide.type === 'center') {
    const isBrand = slide.id === 'brand';

    return (
      <div
        className={`relative w-full h-full flex items-center justify-center text-center px-4 sm:px-6 py-14 sm:py-20 ${
          isBrand
            ? 'bg-[radial-gradient(circle_at_50%_40%,rgba(0,153,204,0.28),transparent_55%),radial-gradient(circle_at_50%_110%,rgba(255,107,0,0.18),transparent_60%),linear-gradient(160deg,#000814_0%,#001f3f_60%,#002b5c_100%)]'
            : 'bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(56,189,248,0.12),transparent_50%),linear-gradient(150deg,#061626_0%,#0b2540_55%,#061626_100%)]'
        }`}
      >
        {isBrand && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[480px] sm:h-[480px] lg:w-[620px] lg:h-[620px] border border-accent/15 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] sm:w-[300px] sm:h-[300px] lg:w-[380px] lg:h-[380px] border border-secondary/20 rounded-full" />
          </div>
        )}

        <div className="relative z-10 max-w-3xl mx-auto w-full">
          <div
            className={`inline-flex items-center gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-semibold tracking-wide mb-4 sm:mb-6 backdrop-blur border ${
              slide.id === 'ups'
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'bg-white/10 border-white/20 text-white'
            }`}
            style={animStyle(80)}
          >
            {slide.tagline}
          </div>

          <h1
            className="text-white font-extrabold tracking-tight leading-[1.08]
                       text-[clamp(1.75rem,6vw,3.5rem)] mb-3 sm:mb-4"
            style={animStyle(180)}
          >
            <span className="block">{slide.title}</span>
            {slide.titleAccent && (
              <span className="block mt-1 text-secondary-light">
                {slide.titleAccent}
              </span>
            )}
          </h1>

          <p
            className="text-white/85 text-sm sm:text-base lg:text-lg leading-relaxed
                       max-w-2xl mx-auto mb-6 sm:mb-8"
            style={animStyle(300)}
          >
            {slide.description}
          </p>

          {slide.features && slide.features.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              {slide.features.map((f, i) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full
                             text-[11px] sm:text-sm font-semibold
                             bg-sky-500/10 border border-sky-500/30 text-sky-200"
                  style={animStyle(400 + i * 80)}
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          <div
            className="flex flex-wrap justify-center gap-3 sm:gap-4"
            style={animStyle(slide.features ? 700 : 480)}
          >
            {renderCta(slide.ctaPrimary, 'primary', 0)}
            {renderCta(slide.ctaSecondary, 'secondary', 0)}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ Split layout ----------------------------- */
  if (slide.type === 'split') {
    return (
      <div
        className="relative w-full h-full flex items-center overflow-hidden
                   bg-[radial-gradient(circle_at_85%_30%,rgba(245,158,11,0.14),transparent_55%),linear-gradient(120deg,#001a3a_0%,#002a52_45%,#001933_100%)]"
      >
        <div className="container-custom w-full py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center">
            <div className="max-w-xl">
              <div
                className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg
                           text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase
                           text-amber-300 bg-amber-500/15 border border-amber-500/35
                           mb-4 sm:mb-6"
                style={animStyle(80)}
              >
                {slide.tagline}
              </div>

              <h1
                className="text-white font-extrabold tracking-tight leading-[1.08]
                           text-[clamp(1.75rem,6vw,3.5rem)] mb-3 sm:mb-4"
                style={animStyle(180)}
              >
                {slide.title}
              </h1>

              <p
                className="text-white/85 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 sm:mb-8"
                style={animStyle(300)}
              >
                {slide.description}
              </p>

              <div
                className="flex flex-wrap gap-3 sm:gap-4"
                style={animStyle(440)}
              >
                {renderCta(slide.ctaPrimary, 'primary', 0)}
                {renderCta(slide.ctaSecondary, 'secondary', 0)}
              </div>
            </div>

            {/* Stat cards — desktop only. Right margin keeps them clear of the
                next-slide arrow button. */}
            <div className="hidden lg:flex flex-col gap-4 relative pr-12">
              <StatCard
                icon="🔋"
                big="150Ah"
                small="Most popular capacity"
                delay={320}
                animStyle={animStyle}
              />
              <StatCard
                icon="⏱️"
                big="4–6 hrs"
                small="Typical backup time"
                delay={440}
                animStyle={animStyle}
                className="ml-auto"
              />
              <StatCard
                icon="🛡️"
                big="48 mo"
                small="Warranty on tubular"
                delay={560}
                animStyle={animStyle}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ Bold layout ------------------------------ */
  if (slide.type === 'bold') {
    return (
      <div
        className="relative w-full h-full flex items-center justify-center text-center overflow-hidden
                   bg-[radial-gradient(circle_at_20%_80%,rgba(255,107,0,0.22),transparent_50%),linear-gradient(135deg,#0a0a0a_0%,#1a0d00_55%,#2a1100_100%)]"
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,107,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage:
              'radial-gradient(circle at center, black 30%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(circle at center, black 30%, transparent 75%)',
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[300px] sm:h-[340px]"
            style={{
              background:
                'radial-gradient(circle, rgba(255,107,0,0.35), transparent 65%)',
              filter: 'blur(40px)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div
            className="text-[clamp(2.5rem,7vw,5rem)] leading-none mb-3 sm:mb-4 inline-block animate-float"
            style={animStyle(60)}
          >
            🛺
          </div>

          <div
            className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-full
                       text-[11px] sm:text-sm font-semibold
                       bg-secondary/15 border border-secondary/50 text-orange-300
                       mb-4 sm:mb-6"
            style={animStyle(160)}
          >
            {slide.tagline}
          </div>

          <h1
            className="font-black leading-[1.05] tracking-tight mb-4
                       text-[clamp(1.75rem,7vw,4rem)]
                       bg-clip-text text-transparent"
            style={{
              ...animStyle(260),
              backgroundImage:
                'linear-gradient(180deg, #ffffff 0%, #ffb072 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {slide.title}
          </h1>

          <p
            className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed
                       max-w-xl mx-auto mb-6 sm:mb-8"
            style={animStyle(380)}
          >
            {slide.description}
          </p>

          <div
            className="flex flex-wrap justify-center gap-3 sm:gap-4"
            style={animStyle(500)}
          >
            {renderCta(slide.ctaPrimary, 'primary', 0)}
            {renderCta(slide.ctaSecondary, 'secondary', 0)}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Small pieces                                                               */
/* -------------------------------------------------------------------------- */

function StatCard({ icon, big, small, delay, animStyle, className = '' }) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr] gap-x-4 gap-y-1
                  px-5 py-4 rounded-2xl
                  bg-[rgba(10,15,26,0.75)] border border-white/12
                  backdrop-blur-lg shadow-2xl max-w-[340px]
                  transition-transform hover:translate-x-1.5 ${className}`}
      style={animStyle(delay)}
    >
      <span className="row-span-2 text-3xl self-center">{icon}</span>
      <span className="text-2xl font-extrabold text-secondary-light tracking-tight">
        {big}
      </span>
      <span className="text-xs text-white/65">{small}</span>
    </div>
  );
}

function Chevron({ dir = 'right' }) {
  const isLeft = dir === 'left';
  return (
    <svg
      className="w-5 h-5 lg:w-6 lg:h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {isLeft ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}