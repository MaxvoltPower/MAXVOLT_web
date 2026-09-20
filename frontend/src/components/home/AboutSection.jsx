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
          <h2>About MAXVOLT</h2>
          <p>Who we are and what drives us</p>
        </div>

        <div className="surface max-w-4xl mx-auto">
          <p className="text-lg leading-relaxed mb-8">
            MAXVOLT is a Kolkata-based power-solutions company focused on making batteries,
            inverters, and backup-power products easier to choose and purchase.
          </p>

          <h4 className="mb-4">Our Focus</h4>
          <ul className="grid gap-3">
            {focusAreas.map((area) => (
              <li key={area.label} className="text-[var(--text-muted)]">
                <strong className="text-accent">✓ {area.label}:</strong> {area.desc}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}