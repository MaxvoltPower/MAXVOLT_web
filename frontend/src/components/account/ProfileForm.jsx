import { useEffect, useState } from 'react';
import { useAuth } from '@context/AuthContext';
import { api } from '@lib/api';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';

export default function ProfileForm({ onSaved }) {
  const { user, profile, setProfile } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || user?.displayName || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        pincode: profile.pincode || '',
      });
    }
  }, [profile, user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api.updateProfile(formData);
      setProfile(updated);
      showToast('Profile updated successfully!', 'success');
      if (onSaved) onSaved(updated);
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface w-full max-w-2xl">
      <Input
        label="Email"
        type="email"
        value={user?.email || ''}
        disabled
        className="opacity-60"
      />

      <Input
        label="Full Name"
        name="displayName"
        value={formData.displayName}
        onChange={handleChange}
      />

      <Input
        label="Phone"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        placeholder="+91 XXXXX XXXXX"
      />

      <div className="form-group">
        <label className="block mb-2 font-semibold text-sm">Address</label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={3}
          placeholder="House/Flat, Street, Landmark"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="Kolkata"
        />
        <Input
          label="PIN Code"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          maxLength={6}
          placeholder="700001"
        />
      </div>

      <Button type="submit" variant="primary" loading={loading}>
        Save Changes
      </Button>
    </form>
  );
}