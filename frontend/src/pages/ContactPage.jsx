// ============================================================
// MAXVOLT — Contact page
// ============================================================

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ContactSection from '@components/home/ContactSection';
import QuotationForm from '@components/home/QuotationForm';
import ServiceArea from '@components/home/ServiceArea';

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact MAXVOLT — Kolkata</title>
        <meta
          name="description"
          content="Reach MAXVOLT by phone, WhatsApp, or email. Request a quote and we'll respond within 24 hours."
        />
      </Helmet>

      <section className="bg-gradient-to-br from-[#001f3f] to-[#003366] text-white py-12 sm:py-16">
        <div className="container-custom">
          <nav className="flex items-center gap-2 text-xs sm:text-sm mb-4 opacity-90">
            <Link to="/" className="hover:text-secondary-light transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Contact</span>
          </nav>
          <h1 className="text-white mb-3">Contact Us</h1>
          <p className="text-sm sm:text-base opacity-90 max-w-2xl">
            Questions, quote requests, or a second opinion on a battery — we're
            one message away.
          </p>
        </div>
      </section>

      <ContactSection />
      <QuotationForm />
      <ServiceArea />
    </>
  );
}