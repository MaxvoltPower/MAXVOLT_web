const benefits = [
  { icon: '✓', title: 'Genuine Products', desc: 'We focus on genuine branded power products only. No counterfeits.' },
  { icon: '💰', title: 'Transparent Pricing', desc: 'Clear and honest recommendations. No hidden charges or surprises.' },
  { icon: '🛠️', title: 'Professional Installation', desc: 'Expert installation and setup support when required.' },
  { icon: '🤝', title: 'Reliable After-Sales', desc: 'Warranty assistance and long-term customer support.' },
  { icon: '🎯', title: 'Right Product', desc: 'We help you choose based on actual need, not just sales pressure.' },
  { icon: '📍', title: 'Local Support', desc: 'Serving customers in Kolkata and surrounding areas with dedicated support.' },
];

export default function WhyMaxvolt() {
  return (
    <section className="light-bg" id="why-maxvolt">
      <div className="section-header">
        <h2>Why Choose MAXVOLT</h2>
        <p>We focus on what matters most: genuine products and your satisfaction</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="text-center p-6 rounded-2xl bg-dark-elevated border border-dark-border transition-all hover:-translate-y-1 hover:shadow-md hover:border-accent group"
          >
            <div className="w-16 h-16 mx-auto mb-4 grid place-items-center rounded-2xl bg-gradient-to-br from-primary-light to-accent text-white text-3xl shadow-lg shadow-primary/40 transition-transform group-hover:scale-110 group-hover:-rotate-6">
              {b.icon}
            </div>
            <h4 className="mb-2">{b.title}</h4>
            <p className="text-sm">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}