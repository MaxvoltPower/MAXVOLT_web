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
    <section id="solutions" className="light-bg">
      <div className="section-header">
        <h2>Home Inverter + Battery Solutions</h2>
        <p>Backup power designed for your home or small business</p>
      </div>

      <div className="surface text-center mb-8 sm:mb-10">
        <h3 className="mb-3 text-base sm:text-lg">
          Inverter + Battery = Complete Backup Solution
        </h3>
        <p className="mb-5 text-sm sm:text-base">
          An inverter converts DC power from a battery to AC power for your home
          appliances. Together, they provide seamless backup during power cuts.
        </p>
        <Link
          to="/#calculator"
          className="inline-flex items-center justify-center px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm sm:text-base"
        >
          Calculate My Requirement
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {capacities.map((c) => (
          <div
            key={c.label}
            className="text-center p-4 sm:p-6 rounded-2xl bg-dark-elevated border border-dark-border hover:-translate-y-1 hover:shadow-md hover:border-accent transition-all"
          >
            <h4 className="mb-2 text-sm sm:text-base">{c.label}</h4>
            <p className="text-xs sm:text-sm">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link
          to="/products?category=homeInverterBatteries"
          className="inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white text-base sm:text-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          Browse Home Battery Solutions
        </Link>
      </div>
    </section>
  );
}