const benefits = [
  {
    icon: '✓',
    title: 'Genuine Products',
    desc: 'We focus on genuine branded power products only. No counterfeits, ever.',
  },
  {
    icon: '💰',
    title: 'Transparent Pricing',
    desc: 'Clear and honest recommendations. No hidden charges or surprises.',
  },
  {
    icon: '🛠️',
    title: 'Professional Installation',
    desc: 'Expert installation and setup support when required.',
  },
  {
    icon: '🤝',
    title: 'Reliable After-Sales',
    desc: 'Warranty assistance and long-term customer support.',
  },
  {
    icon: '🎯',
    title: 'Right Product',
    desc: 'We help you choose based on actual need, not just sales pressure.',
  },
  {
    icon: '📍',
    title: 'Local Support',
    desc: 'Serving customers in Kolkata and surrounding areas with dedicated support.',
  },
];

export default function WhyMaxvolt() {
  return (
    <section className="band" id="why-maxvolt">
      <div className="section-header">
        <span className="eyebrow">Why Us</span>
        <h2>Why Choose MAXVOLT</h2>
        <p>
          We focus on what matters most: genuine products and your long-term
          satisfaction.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="group relative text-center p-6 sm:p-7 rounded-2xl bg-[var(--bg-elev)] border border-[var(--border)] shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg hover:border-brand/60"
          >
            <div className="w-16 h-16 mx-auto mb-5 grid place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white text-2xl shadow-lg shadow-brand/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              {b.icon}
            </div>
            <h4 className="mb-2 text-[var(--text)]">{b.title}</h4>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {b.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}