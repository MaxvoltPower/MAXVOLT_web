// ============================================================
// MAXVOLT — Brand lockup (mark + wordmark + tagline)
// ============================================================
// Renders the "M" battery mark image next to the styled
// "MAXVOLT" wordmark. Colors match the logo:
//   navy  → #0A1F44  (MAX)
//   gold  → #D4A017  (VOLT)
// ============================================================

import { Link } from 'react-router-dom';

/**
 * @param {object}  props
 * @param {'sm'|'md'|'lg'} [props.size='md']  Controls overall scale.
 * @param {boolean} [props.showTagline=true]  Toggle the tagline line.
 * @param {string}  [props.className]         Extra classes on the wrapper.
 * @param {'link'|'static'} [props.as='link'] Render as <Link to="/"> or plain <div>.
 */
export default function BrandLogo({
  size = 'md',
  showTagline = true,
  className = '',
  as = 'link',
}) {
  const sizes = {
    sm: {
      mark: 'h-8 w-8',
      word: 'text-base sm:text-lg',
      tag: 'text-[0.55rem] sm:text-[0.6rem]',
      gap: 'gap-2',
    },
    md: {
      mark: 'h-9 w-9 sm:h-10 sm:w-10',
      word: 'text-lg sm:text-xl',
      tag: 'text-[0.6rem] sm:text-[0.65rem]',
      gap: 'gap-2.5',
    },
    lg: {
      mark: 'h-12 w-12 sm:h-14 sm:w-14',
      word: 'text-xl sm:text-2xl',
      tag: 'text-[0.65rem] sm:text-xs',
      gap: 'gap-3',
    },
  }[size];

  const content = (
    <span className={`inline-flex items-center ${sizes.gap} ${className}`}>
      {/* Mark — clipped to the top portion so the baked-in wordmark
          inside the source image isn't shown next to our rendered one. */}
      <span
        className={`${sizes.mark} shrink-0 overflow-hidden rounded-md bg-white grid place-items-start transition-transform group-hover:scale-105`}
        aria-hidden="true"
      >
        <img
          src="/assets/maxvolt-logo.png"
          alt=""
          className="w-full h-auto"
          style={{ transform: 'translateY(-4%) scale(1.02)' }}
          onError={(e) => {
            e.currentTarget.parentElement.style.display = 'none';
          }}
        />
      </span>

      {/* Wordmark + tagline */}
      <span className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight ${sizes.word} leading-none`}
          style={{ letterSpacing: '-0.01em' }}
        >
          <span className="brand-wordmark-navy" style={{ color: '#E8EDF7' }}>
            MAX
          </span>
          <span className="brand-wordmark-gold" style={{ color: '#FFC93C' }}>
            VOLT
          </span>
        </span>

        {showTagline && (
          <span
            className={`${sizes.tag} mt-1 font-semibold uppercase tracking-[0.18em] flex items-center gap-1.5 brand-tagline`}
            style={{ color: '#B9C2D4' }}
          >
            <span
              className="inline-block w-3 h-[2px] rounded-full"
              style={{ backgroundColor: '#FFC93C' }}
              aria-hidden="true"
            />
            <span className="whitespace-nowrap">Trusted Power Always</span>
            <span
              className="inline-block w-3 h-[2px] rounded-full"
              style={{ backgroundColor: '#FFC93C' }}
              aria-hidden="true"
            />
          </span>
        )}
      </span>
    </span>
  );

  if (as === 'static') {
    return <div className="group inline-flex">{content}</div>;
  }

  return (
    <Link
      to="/"
      className="group inline-flex items-center"
      aria-label="MAXVOLT — Trusted Power Always, home"
    >
      {content}
    </Link>
  );
}