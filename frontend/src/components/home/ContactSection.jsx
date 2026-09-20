import { openWhatsapp, CONFIG } from '@lib/utils';

export default function ContactSection() {
  return (
    <section className="light-bg" id="contact">
      <div className="section-header">
        <h2>Contact MAXVOLT</h2>
        <p>Get in touch. We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="text-center p-6 rounded-2xl bg-dark-elevated border border-dark-border hover:-translate-y-1 hover:shadow-md hover:border-accent transition-all">
          <div className="w-16 h-16 mx-auto mb-4 grid place-items-center rounded-2xl bg-gradient-to-br from-primary-light to-accent text-white text-2xl shadow-lg">
            💬
          </div>
          <h4 className="mb-2">WhatsApp</h4>
          <p className="text-sm mb-4">Instant messaging for quick queries</p>
          <button
            onClick={() => openWhatsapp()}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#25d366] to-[#1faa50] text-white text-sm font-semibold hover:-translate-y-0.5 transition-all"
          >
            Open WhatsApp
          </button>
        </div>

        <div className="text-center p-6 rounded-2xl bg-dark-elevated border border-dark-border hover:-translate-y-1 hover:shadow-md hover:border-accent transition-all">
          <div className="w-16 h-16 mx-auto mb-4 grid place-items-center rounded-2xl bg-gradient-to-br from-primary-light to-accent text-white text-2xl shadow-lg">
            📞
          </div>
          <h4 className="mb-2">Phone</h4>
          <p className="text-sm mb-4">Call for detailed discussions</p>
          <a
            href={`tel:${CONFIG.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white text-sm font-semibold hover:-translate-y-0.5 transition-all"
          >
            Call {CONFIG.phone}
          </a>
        </div>

        <div className="text-center p-6 rounded-2xl bg-dark-elevated border border-dark-border hover:-translate-y-1 hover:shadow-md hover:border-accent transition-all">
          <div className="w-16 h-16 mx-auto mb-4 grid place-items-center rounded-2xl bg-gradient-to-br from-primary-light to-accent text-white text-2xl shadow-lg">
            ✉️
          </div>
          <h4 className="mb-2">Email</h4>
          <p className="text-sm mb-4">Send us your inquiry</p>
          <a
            href={`mailto:${CONFIG.contactEmail}`}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border-2 border-dark-border-strong text-[var(--text)] text-sm font-semibold hover:bg-dark-muted hover:border-accent hover:-translate-y-0.5 transition-all"
          >
            Email Us
          </a>
        </div>
      </div>
    </section>
  );
}