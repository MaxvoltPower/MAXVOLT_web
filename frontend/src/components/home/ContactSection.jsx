import { openWhatsapp, CONFIG } from '@lib/utils';

export default function ContactSection() {
  return (
    <section className="band" id="contact">
      <div className="section-header">
        <span className="eyebrow">Get in Touch</span>
        <h2>Contact MAXVOLT</h2>
        <p>We're here to help — pick whichever channel works best for you.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7 max-w-5xl mx-auto">
        {/* WhatsApp */}
        <div className="group text-center p-6 sm:p-7 rounded-2xl bg-[var(--bg-elev)] border border-[var(--border)] shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg hover:border-[#25D366]/50">
          <div className="w-16 h-16 mx-auto mb-5 grid place-items-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#1FAA50] text-white text-2xl shadow-lg shadow-[#25D366]/30 transition-transform duration-300 group-hover:scale-110">
            💬
          </div>
          <h4 className="mb-2 text-[var(--text)]">WhatsApp</h4>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            Instant messaging for quick queries
          </p>
          <button
            onClick={() => openWhatsapp()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#25D366] to-[#1FAA50] text-white text-sm font-semibold shadow-md shadow-[#25D366]/25 hover:shadow-lg hover:shadow-[#25D366]/40 hover:-translate-y-0.5 transition-all"
          >
            Open WhatsApp
          </button>
        </div>

        {/* Phone */}
        <div className="group text-center p-6 sm:p-7 rounded-2xl bg-[var(--bg-elev)] border border-[var(--border)] shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg hover:border-brand/50">
          <div className="w-16 h-16 mx-auto mb-5 grid place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white text-2xl shadow-lg shadow-brand/30 transition-transform duration-300 group-hover:scale-110">
            📞
          </div>
          <h4 className="mb-2 text-[var(--text)]">Phone</h4>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            Call for detailed discussions
          </p>
          <a
            href={`tel:${CONFIG.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white text-sm font-semibold shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/40 hover:-translate-y-0.5 transition-all"
          >
            Call {CONFIG.phone}
          </a>
        </div>

        {/* Email */}
        <div className="group text-center p-6 sm:p-7 rounded-2xl bg-[var(--bg-elev)] border border-[var(--border)] shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg hover:border-accent/50">
          <div className="w-16 h-16 mx-auto mb-5 grid place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-dark text-white text-2xl shadow-lg shadow-accent/30 transition-transform duration-300 group-hover:scale-110">
            ✉️
          </div>
          <h4 className="mb-2 text-[var(--text)]">Email</h4>
          <p className="text-sm text-[var(--text-muted)] mb-5">
            Send us your inquiry
          </p>
          <a
            href={`mailto:${CONFIG.contactEmail}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-[1.5px] border-[var(--border-strong)] text-[var(--text)] text-sm font-semibold hover:bg-[var(--bg-muted)] hover:border-accent hover:-translate-y-0.5 transition-all"
          >
            Email Us
          </a>
        </div>
      </div>
    </section>
  );
}