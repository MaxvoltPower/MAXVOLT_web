// ============================================================
// MAXVOLT — Solutions page
// ============================================================

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SolutionsSection from '@components/home/SolutionsSection';
import WhyMaxvolt from '@components/home/WhyMaxvolt';
import ServiceArea from '@components/home/ServiceArea';

export default function SolutionsPage() {
  return (
    <>
      <Helmet>
        <title>Power Solutions — MAXVOLT</title>
        <meta
          name="description"
          content="Complete home inverter + battery solutions, sizing guidance, and professional installation across Kolkata."
        />
      </Helmet>

      <section className="bg-gradient-to-br from-[#001f3f] to-[#003366] text-white py-12 sm:py-16">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-xs sm:text-sm mb-4 opacity-90">
            <Link to="/" className="hover:text-secondary-light transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Solutions</span>
          </nav>
          <h1 className="text-white mb-3">Power Solutions</h1>
          <p className="text-sm sm:text-base opacity-90 max-w-2xl">
            From sizing an inverter to choosing the right battery for your home,
            vehicle, or business — we help you get it right the first time.
          </p>
        </div>
      </section>

      <SolutionsSection />
      <WhyMaxvolt />
      <ServiceArea />
    </>
  );
}