// ============================================================
// MAXVOLT — About page
// ============================================================

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AboutSection from '@components/home/AboutSection';
import WhyMaxvolt from '@components/home/WhyMaxvolt';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About MAXVOLT — Trusted Power Always</title>
        <meta
          name="description"
          content="MAXVOLT is a Kolkata-based power-solutions company focused on genuine batteries, honest advice, and reliable local service."
        />
      </Helmet>

      <section className="bg-gradient-to-br from-[#001f3f] to-[#003366] text-white py-12 sm:py-16">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-xs sm:text-sm mb-4 opacity-90">
            <Link to="/" className="hover:text-secondary-light transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">About</span>
          </nav>
          <h1 className="text-white mb-3">About MAXVOLT</h1>
          <p className="text-sm sm:text-base opacity-90 max-w-2xl">
            Who we are, what drives us, and why customers across Kolkata trust us
            with their power needs.
          </p>
        </div>
      </section>

      <AboutSection />
      <WhyMaxvolt />
    </>
  );
}