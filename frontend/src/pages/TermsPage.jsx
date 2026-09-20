export default function TermsPage() {
  const sections = [
    { title: '1. Acceptance of Terms', content: 'By accessing or using the MAXVOLT website and services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.' },
    { title: '2. Eligibility', content: 'You must be at least 18 years old and capable of entering into a legally binding contract to place orders on our website.' },
    { title: '3. Products & Pricing', content: 'All product descriptions, images and specifications are provided in good faith and are subject to change without notice. Prices displayed are in Indian Rupees (₹) and include applicable GST unless otherwise stated. We reserve the right to correct pricing errors and cancel affected orders.' },
    { title: '4. Orders & Payments', content: 'Orders are confirmed once payment is received (for prepaid) or upon confirmation (for COD). Payments are securely processed via Razorpay. We do not store your card details. We reserve the right to refuse or cancel any order at our discretion.' },
    { title: '5. Shipping & Delivery', content: 'Delivery timelines are estimates and not guarantees. We currently deliver within Kolkata and nearby areas. Additional charges may apply for far locations. Risk of loss passes to you upon delivery.' },
    { title: '6. Returns, Refunds & Warranty', content: 'Physical products must be inspected on delivery. Report damage within 48 hours. Warranty is provided directly by the manufacturer. MAXVOLT assists with claims. Refunds for prepaid orders are processed to the original payment method within 5–7 business days. Custom or used items are not eligible for return.' },
    { title: '7. Governing Law', content: 'These terms are governed by the laws of India. Any dispute shall be subject to the exclusive jurisdiction of courts in Kolkata, West Bengal.' },
    { title: '8. Contact', content: 'MAXVOLT, Kolkata, West Bengal, India', contact: true },
  ];

  return (
    <div className="container-custom py-12 max-w-3xl">
      <h1 className="mb-3">Terms & Conditions</h1>
      <p className="text-[var(--text-subtle)] mb-8">
        Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {sections.map((sec) => (
        <section key={sec.title} className="mb-8">
          <h2 className="text-xl mb-3">{sec.title}</h2>
          <p>{sec.content}</p>
          {sec.contact && (
            <div className="mt-3">
              <p>📧 maxvolt.power@gmail.com</p>
              <p>📞 +91 7595941311</p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}