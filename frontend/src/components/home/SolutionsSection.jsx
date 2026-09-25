// ============================================================
// MAXVOLT — Home inverter + battery solutions
// ============================================================

import { Link } from 'react-router-dom';

export default function SolutionsSection() {
  const capacities = [
    { label: '100Ah / Entry', desc: 'For basic backup requirements' },
    { label: '120Ah', desc: 'Small to medium homes' },
    { label: '150Ah', desc: 'Stronger household backup' },
    { label: '180–200Ah', desc: 'High backup requirements' },
  ];

  return (
    <section id="solutions" className="band">
      <div className="section-header">
        <span className="eyebrow">Complete Backup</span>
        <h2>Home Inverter + Battery Solutions</h2>
        <p>Backup power designed for your home or small business</p>
      </div>

      <div className="surface text-center mb-8 sm:mb-10">
        <h3 className="mb-3 text-base sm:text-lg text-[var(--text)]">
          Inverter + Battery = Complete Backup Solution
        </h3>
        <p className="mb-6 text-sm sm:text-base text-[var(--text-muted)] max-w-2xl mx-auto">
          An inverter converts DC power from a battery to AC power for your home
          appliances. Together, they provide seamless backup during power cuts.
        </p>
        <Link
          to="/calculator"
          className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white font-semibold shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/40 hover:-translate-y-0.5 transition-all text-sm sm:text-base"
        >
          Calculate My Requirement
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-10">
        {capacities.map((c) => (
          <div
            key={c.label}
            className="group text-center p-4 sm:p-6 rounded-2xl bg-[var(--bg-elev)] border border-[var(--border)] shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg hover:border-accent/60"
          >
            <div className="w-10 h-10 mx-auto mb-3 grid place-items-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 text-accent text-lg font-bold">
              ⚡
            </div>
            <h4 className="mb-1.5 text-sm sm:text-base text-[var(--text)]">
              {c.label}
            </h4>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          to="/products?category=homeInverterBatteries"
          className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-b from-accent to-accent-dark text-white text-base sm:text-lg font-semibold shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/40 hover:-translate-y-0.5 transition-all"
        >
          Browse Home Battery Solutions
          <svg
            className="w-5 h-5"
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