import { Link } from 'react-router-dom';

export default function ServiceArea() {
  return (
    <section className="band">
      <div className="section-header">
        <span className="eyebrow">Coverage</span>
        <h2>Service Area</h2>
        <p>Primary service area: Kolkata, West Bengal</p>
      </div>

      <div className="surface text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 mx-auto mb-5 grid place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white text-3xl shadow-lg shadow-brand/30">
          📍
        </div>
        <h4 className="mb-3 text-[var(--text)]">Kolkata &amp; Nearby Areas</h4>
        <p className="mb-6 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
          We provide battery selection, quotation, and installation support across
          Kolkata and surrounding areas.
        </p>
        <Link
          to="/#quotation"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white font-semibold shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/40 hover:-translate-y-0.5 transition-all"
        >
          Check Availability for Your Area
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}