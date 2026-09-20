import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { heroSlides } from '@data/products';
import { openWhatsapp } from '@lib/utils';

const AUTO_MS = 6000;

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, moved: false });

  const goToSlide = useCallback((index) => {
    setCurrentIndex((prev) => {
      const next = (index + heroSlides.length) % heroSlides.length;
      return next;
    });
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    
    timerRef.current = setInterval(() => {
      if (!document.hidden) nextSlide();
    }, AUTO_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  // Pause when tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch handlers
  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      moved: false,
    };
  };

  const handleTouchMove = () => {
    touchStartRef.current.moved = true;
  };

  const handleTouchEnd = (e) => {
    const { x: startX, y: startY, moved } = touchStartRef.current;
    if (!moved) return;
    
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  };

  const currentSlide = heroSlides[currentIndex];

  return (
    <section
      className="relative overflow-hidden min-h-[480px] sm:min-h-[540px] lg:min-h-[640px] bg-[#000814]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="MAXVOLT highlights"
    >
      {/* Slides */}
      {heroSlides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === currentIndex
              ? 'opacity-100 z-10 pointer-events-auto'
              : 'opacity-0 z-0 pointer-events-none'
          }`}
          aria-hidden={i !== currentIndex}
        >
          <SlideContent slide={slide} isActive={i === currentIndex} />
        </div>
      ))}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/8 z-20 overflow-hidden">
        <div
          key={currentIndex}
          className="h-full bg-gradient-to-r from-secondary to-secondary-light shadow-[0_0_12px_rgba(255,107,0,0.6)]"
          style={{
            animation: isPaused ? 'none' : `heroProgress ${AUTO_MS}ms linear infinite`,
          }}
        />
      </div>

      {/* Arrows */}
      <button
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 grid place-items-center text-white text-2xl bg-[rgba(10,15,26,0.5)] border border-white/25 rounded-full backdrop-blur hover:bg-secondary hover:border-secondary hover:scale-110 transition-all"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        ‹
      </button>
      <button
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 grid place-items-center text-white text-2xl bg-[rgba(10,15,26,0.5)] border border-white/25 rounded-full backdrop-blur hover:bg-secondary hover:border-secondary hover:scale-110 transition-all"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            className={`h-2.5 rounded-full transition-all duration-200 ${
              i === currentIndex
                ? 'w-7 bg-secondary'
                : 'w-2.5 bg-white/35 hover:bg-white/60'
            }`}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-selected={i === currentIndex}
          />
        ))}
      </div>
    </section>
  );
}

function SlideContent({ slide, isActive }) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (isActive) setAnimKey((k) => k + 1);
  }, [isActive]);

  const animationStyle = (delay) => ({
    animation: isActive
      ? `fadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`
      : 'none',
    opacity: isActive ? undefined : 0,
  });

  const isExternalWhatsapp = (href) => href === 'whatsapp';

  const renderCta = (cta, variant, delay) => {
    if (isExternalWhatsapp(cta.href)) {
      return (
        <button
          onClick={() => openWhatsapp()}
          className={
            variant === 'primary'
              ? 'inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white text-base font-semibold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all'
              : 'inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/55 text-white text-base font-semibold hover:bg-white/12 hover:border-white transition-all'
          }
          style={animationStyle(delay)}
        >
          {cta.text}
        </button>
      );
    }

    const isAnchor = cta.href.startsWith('#');
    const to = isAnchor ? cta.href : cta.href;

    return (
      <Link
        to={to}
        className={
          variant === 'primary'
            ? 'inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-br from-secondary to-secondary-light text-white text-base font-semibold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all'
            : 'inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/55 text-white text-base font-semibold hover:bg-white/12 hover:border-white transition-all'
        }
        style={animationStyle(delay)}
      >
        {cta.text}
      </Link>
    );
  };

  // Center layout
  if (slide.type === 'center') {
    return (
      <div
        className={`h-full flex items-center justify-center text-center px-4 py-20 ${
          slide.id === 'brand'
            ? 'bg-[radial-gradient(circle_at_50%_40%,rgba(0,153,204,0.28),transparent_55%),radial-gradient(circle_at_50%_110%,rgba(255,107,0,0.18),transparent_60%),linear-gradient(160deg,#000814_0%,#001f3f_60%,#002b5c_100%)]'
            : 'bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(56,189,248,0.12),transparent_50%),linear-gradient(150deg,#061626_0%,#0b2540_55%,#061626_100%)]'
        }`}
      >
        {/* Decorative rings for brand slide */}
        {slide.id === 'brand' && (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] border border-accent/15 rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-secondary/18 rounded-full pointer-events-none" />
          </>
        )}

        <div className="relative z-10 max-w-3xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold tracking-wide mb-6 backdrop-blur border ${
              slide.id === 'ups'
                ? 'bg-sky-500/12 border-sky-500/40 text-sky-300'
                : 'bg-white/8 border-white/18 text-white'
            }`}
            style={animationStyle(100)}
          >
            {slide.tagline}
          </div>

          <h1 className="text-white text-3xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.08] mb-4" style={animationStyle(220)}>
            {slide.title}
            {slide.titleAccent && (
              <>
                <br />
                {slide.titleAccent}
              </>
            )}
          </h1>

          <p className="text-white/85 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed" style={animationStyle(360)}>
            {slide.description}
          </p>

          {slide.features && (
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {slide.features.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-sky-500/8 border border-sky-500/28 text-sky-200"
                  style={animationStyle(480 + i * 100)}
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4" style={animationStyle(slide.features ? 800 : 520)}>
            {renderCta(slide.ctaPrimary, 'primary', 0)}
            {renderCta(slide.ctaSecondary, 'secondary', 0)}
          </div>
        </div>
      </div>
    );
  }

  // Split layout (home slide)
  if (slide.type === 'split') {
    return (
      <div className="h-full flex items-center bg-[radial-gradient(circle_at_85%_30%,rgba(245,158,11,0.14),transparent_55%),linear-gradient(120deg,#001a3a_0%,#002a52_45%,#001933_100%)] border-l-[6px] border-secondary">
        <div className="container-custom w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div className="max-w-xl">
              <div
                className="inline-block px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase text-amber-300 bg-amber-500/12 border border-amber-500/35 mb-6"
                style={animationStyle(100)}
              >
                {slide.tagline}
              </div>
              <h1 className="text-white text-3xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.08] mb-4" style={animationStyle(220)}>
                {slide.title}
              </h1>
              <p className="text-white/85 text-base sm:text-lg mb-8 leading-relaxed" style={animationStyle(360)}>
                {slide.description}
              </p>
              <div className="flex flex-wrap gap-4" style={animationStyle(520)}>
                {renderCta(slide.ctaPrimary, 'primary', 0)}
                {renderCta(slide.ctaSecondary, 'secondary', 0)}
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-4 relative">
              <div
                className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-5 py-4 rounded-2xl bg-[rgba(10,15,26,0.75)] border border-white/12 backdrop-blur-lg shadow-2xl max-w-[340px] transition-transform hover:translate-x-1.5"
                style={animationStyle(380)}
              >
                <span className="row-span-2 text-3xl self-center">🔋</span>
                <span className="text-2xl font-extrabold text-secondary-light tracking-tight">150Ah</span>
                <span className="text-xs text-white/65">Most popular capacity</span>
              </div>
              <div
                className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-5 py-4 rounded-2xl bg-[rgba(10,15,26,0.75)] border border-white/12 backdrop-blur-lg shadow-2xl max-w-[340px] ml-auto -mr-5 transition-transform hover:translate-x-1.5"
                style={animationStyle(520)}
              >
                <span className="row-span-2 text-3xl self-center">⏱️</span>
                <span className="text-2xl font-extrabold text-secondary-light tracking-tight">4–6 hrs</span>
                <span className="text-xs text-white/65">Typical backup time</span>
              </div>
              <div
                className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-5 py-4 rounded-2xl bg-[rgba(10,15,26,0.75)] border border-white/12 backdrop-blur-lg shadow-2xl max-w-[340px] transition-transform hover:translate-x-1.5"
                style={animationStyle(660)}
              >
                <span className="row-span-2 text-3xl self-center">🛡️</span>
                <span className="text-2xl font-extrabold text-secondary-light tracking-tight">48 mo</span>
                <span className="text-xs text-white/65">Warranty on tubular</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Bold layout (toto slide)
  if (slide.type === 'bold') {
    return (
      <div className="relative h-full flex items-center justify-center text-center bg-[radial-gradient(circle_at_20%_80%,rgba(255,107,0,0.22),transparent_50%),linear-gradient(135deg,#0a0a0a_0%,#1a0d00_55%,#2a1100_100%)] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,107,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 75%)',
          }}
        />
        <div
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[340px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,107,0,0.35), transparent 65%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="text-[clamp(3.5rem,8vw,5.5rem)] leading-none mb-4 inline-block animate-float" style={animationStyle(80)}>
            🛺
          </div>
          <div
            className="inline-block px-5 py-2 rounded-full text-sm font-semibold bg-secondary/15 border border-secondary/50 text-orange-300 mb-6"
            style={animationStyle(200)}
          >
            {slide.tagline}
          </div>
          <h1
            className="text-3xl sm:text-5xl lg:text-[4.25rem] font-black leading-[1.05] mb-4 bg-clip-text text-transparent"
            style={{
              ...animationStyle(300),
              backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #ffb072 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {slide.title}
          </h1>
          <p className="text-white/78 text-base sm:text-lg mb-8 max-w-xl mx-auto" style={animationStyle(440)}>
            {slide.description}
          </p>
          <div className="flex flex-wrap justify-center gap-4" style={animationStyle(560)}>
            {renderCta(slide.ctaPrimary, 'primary', 0)}
            {renderCta(slide.ctaSecondary, 'secondary', 0)}
          </div>
        </div>
      </div>
    );
  }

  return null;
}