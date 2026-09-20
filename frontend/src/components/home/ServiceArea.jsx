import { Link } from 'react-router-dom';

export default function ServiceArea() {
  return (
    <section className="light-bg">
      <div className="section-header">
        <h2>Service Area</h2>
        <p>Primary service area: Kolkata, West Bengal</p>
      </div>

      <div className="surface text-center max-w-2xl mx-auto">
        <h4 className="mb-3">📍 Kolkata &amp; Nearby Areas</h4>
        <p className="mb-5">
          We provide battery selection, quotation, and installation support across Kolkata
          and surrounding areas.
        </p>
        <Link
          to="/#quotation"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          Check Availability for Your Area
        </Link>
      </div>
    </section>
  );
}