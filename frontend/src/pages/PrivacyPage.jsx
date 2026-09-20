export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Introduction',
      content:
        'MAXVOLT ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose and safeguard your information when you visit our website or use our services. By using our services you agree to the terms of this policy.',
    },
    {
      title: '2. Information We Collect',
      list: [
        'Account Information: name, email address, password (hashed by Firebase Authentication).',
        'Contact Information: phone number, delivery address, pin code.',
        'Order Information: products purchased, quantity, transaction amount, payment status.',
        'Payment Information: We do not store your card or UPI credentials. Payments are processed securely by Razorpay.',
        'Usage Data: pages visited, browser type, IP address, device information.',
        'Quote Requests: details you submit through our quote/contact forms.',
      ],
    },
    {
      title: '3. How We Use Your Information',
      list: [
        'To process orders, payments and deliveries.',
        'To contact you regarding your quote, order or inquiry.',
        'To improve our website, products and services.',
        'To send updates and offers (only if you opt in).',
        'To comply with applicable legal requirements.',
      ],
    },
    {
      title: '4. Third-Party Services',
      list: [
        'Firebase Authentication (Google): to manage your login securely.',
        'MongoDB Atlas: to store your account and order data.',
        "Razorpay: to process payments. Razorpay's privacy policy applies to payment data.",
        'Vercel: to host our website.',
      ],
    },
    {
      title: '5. Data Security',
      content:
        'We use industry-standard safeguards including HTTPS encryption, secure tokens, and hashed credentials. No method of transmission over the internet is 100% secure, but we take reasonable measures to protect your data.',
    },
    {
      title: '6. Data Retention',
      content:
        'We retain your personal data as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes and enforce agreements.',
    },
    {
      title: '7. Your Rights',
      content:
        'You may request to access, correct, or delete your personal data by emailing us at maxvolt.power@gmail.com. We will respond within 30 days.',
    },
    {
      title: '8. Cookies',
      content:
        'We use minimal cookies for authentication and site functionality. You may disable cookies in your browser, but some features may not work.',
    },
    {
      title: '9. Contact Us',
      content: 'For any privacy concerns, contact: MAXVOLT, Kolkata, West Bengal, India',
      contact: true,
    },
  ];

  return (
    <div className="container-custom py-12 max-w-3xl">
      <h1 className="mb-3">Privacy Policy</h1>
      <p className="text-[var(--text-subtle)] mb-8">
        Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {sections.map((sec) => (
        <section key={sec.title} className="mb-8">
          <h2 className="text-xl mb-3">{sec.title}</h2>
          {sec.content && <p>{sec.content}</p>}
          {sec.list && (
            <ul className="list-disc ml-6 space-y-2">
              {sec.list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
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