import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';

export default function RegisterForm({ onSuccess }) {
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(formData.email, formData.password, formData.name);
      showToast('Account created successfully!', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Create Account</h1>
      <p className="mb-6">Join MAXVOLT to manage orders and quotes</p>

      <Input
        label="Full Name"
        required
        value={formData.name}
        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
        placeholder="Your name"
      />

      <Input
        label="Email"
        type="email"
        required
        value={formData.email}
        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
        placeholder="you@example.com"
      />

      <Input
        label="Password"
        type="password"
        required
        minLength={6}
        value={formData.password}
        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
        placeholder="Min 6 characters"
        hint="At least 6 characters"
      />

      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        Create Account
      </Button>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <p className="text-center text-sm mt-4">
        Already registered?{' '}
        <Link to="/account/login" className="text-accent font-semibold">
          Sign in
        </Link>
      </p>
    </form>
  );
}