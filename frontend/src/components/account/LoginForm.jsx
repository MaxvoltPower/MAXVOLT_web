import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';

export default function LoginForm({ onSuccess }) {
  const { signIn, signInGoogle } = useAuth();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
      showToast('Signed in successfully!', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInGoogle();
      showToast('Signed in with Google!', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
      <p className="mb-6">Sign in to your MAXVOLT account</p>

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
        placeholder="••••••••"
      />

      <Button type="submit" variant="primary" className="w-full" loading={loading}>
        Sign In
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full mt-2"
        onClick={handleGoogle}
        disabled={loading}
      >
        Continue with Google
      </Button>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <p className="text-center text-sm mt-4">
        New to MAXVOLT?{' '}
        <Link to="/account/register" className="text-accent font-semibold">
          Create account
        </Link>
      </p>
      <p className="text-center text-sm mt-2">
        <Link
          to="/account/forgot-password"
          className="text-[var(--text-muted)] hover:text-accent"
        >
          Forgot password?
        </Link>
      </p>
    </form>
  );
}