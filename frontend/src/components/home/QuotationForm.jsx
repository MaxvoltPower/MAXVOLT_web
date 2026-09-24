// ============================================================
// MAXVOLT — Quotation request form
// ============================================================

import { useState } from 'react';
import { api } from '@lib/api';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Select from '@components/ui/Select';
import { openWhatsapp } from '@lib/utils';

const EMPTY = {
  name: '',
  phone: '',
  email: '',
  location: '',
  requirement: '',
  message: '',
};

export default function QuotationForm() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.requirement) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    let saved = false;
    try {
      await api.submitQuote(formData);
      saved = true;
      showToast('Quote request submitted! We will contact you shortly.', 'success');
    } catch (err) {
      showToast(
        "Could not save your request, but we'll still reach out via WhatsApp.",
        'warning'
      );
    } finally {
      const waMessage = `Hello MAXVOLT, My name is ${formData.name}. I need: ${formData.requirement}. Please contact me at ${formData.phone}.`;
      // Only auto-open WhatsApp if the API call failed, so we don't
      // double-contact users on every successful submit.
      if (!saved) {
        setTimeout(() => openWhatsapp(waMessage), 600);
      }
      setFormData(EMPTY);
      setLoading(false);
    }
  };

  return (
    <section id="quotation" className="section-padding">
      <div className="container-custom">
        <div className="section-header">
          <h2>Get Your MAXVOLT Quote</h2>
          <p>Simple. Quick. No hassle. We'll contact you within 24 hours.</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto surface">
          <Input
            label="Name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            autoComplete="name"
          />

          <Input
            label="Phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 XXXXX XXXXX"
            autoComplete="tel"
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Your area / locality"
          />

          <Select
            label="What do you need?"
            name="requirement"
            required
            value={formData.requirement}
            onChange={handleChange}
          >
            <option value="">Select...</option>
            <option>Home Inverter + Battery</option>
            <option>Car Battery</option>
            <option>TOTO / E-Rickshaw Battery</option>
            <option>E-Bike Battery</option>
            <option>UPS System</option>
            <option>Solar Solution</option>
            <option>Other Power Solution</option>
          </Select>

          <div className="form-group">
            <label className="block mb-2 font-semibold text-sm">
              Tell us more (optional)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="e.g., Currently using XYZ battery, looking for upgrade..."
              rows={4}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5"
            loading={loading}
          >
            Request Quote
          </Button>

          <p className="text-center text-xs sm:text-sm text-[var(--text-subtle)] mt-3">
            We'll contact you via WhatsApp or phone to confirm details and provide
            pricing.
          </p>
        </form>
      </div>
    </section>
  );
}