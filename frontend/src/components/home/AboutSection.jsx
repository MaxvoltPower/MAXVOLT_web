export default function AboutSection() {
  const focusAreas = [
    { label: 'Genuine Products', desc: 'Only authentic branded solutions.' },
    { label: 'Practical Recommendations', desc: 'Right product for your actual need.' },
    { label: 'Professional Service', desc: 'Expert guidance and installation support.' },
    { label: 'Transparent Communication', desc: 'Clear pricing and honest answers.' },
    { label: 'Long-term Relationships', desc: 'We care about your satisfaction after the sale.' },
  ];

  return (
    <section id="about" className="section-padding">
      <div className="container-custom">
        <div className="section-header">
          <span className="eyebrow">About Us</span>
          <h2>About MAXVOLT</h2>
          <p>Who we are and what drives us</p>
        </div>

        <div className="surface max-w-4xl mx-auto">
          <p className="text-base sm:text-lg leading-relaxed mb-8 text-[var(--text-muted)]">
            MAXVOLT is a Kolkata-based power-solutions company focused on making
            batteries, inverters, and backup-power products easier to choose and
            purchase. We combine verified brands, honest advice, and local
            service to help you get the right product the first time.
          </p>

          <h4 className="mb-5 text-[var(--text)]">Our Focus</h4>
          <ul className="grid gap-4">
            {focusAreas.map((area) => (
              <li key={area.label} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 grid place-items-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white text-xs font-bold shadow-sm shadow-brand/30 mt-0.5">
                  ✓
                </span>
                <span className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                  <strong className="text-[var(--text)]">{area.label}:</strong>{' '}
                  {area.desc}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}