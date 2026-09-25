// ============================================================
// MAXVOLT — Calculator page
// ============================================================

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import CalculatorSection from '@components/home/CalculatorSection';

export default function CalculatorPage() {
  return (
    <>
      <Helmet>
        <title>Backup Power Calculator — MAXVOLT</title>
        <meta
          name="description"
          content="Tell us what you need to power and we'll recommend the right inverter and battery combination from our available stock."
        />
      </Helmet>

      <section className="bg-gradient-to-br from-[#001f3f] to-[#003366] text-white py-12 sm:py-16">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-xs sm:text-sm mb-4 opacity-90">
            <Link to="/" className="hover:text-secondary-light transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Calculator</span>
          </nav>
          <h1 className="text-white mb-3">Backup Power Calculator</h1>
          <p className="text-sm sm:text-base opacity-90 max-w-2xl">
            Enter the appliances you want to back up and how long you need them
            to run. We'll match you with the closest inverter and battery from
            our live catalogue.
          </p>
        </div>
      </section>

      <CalculatorSection />
    </>
  );
}