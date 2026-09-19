import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      showToast('Password reset email sent!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] grid place-items-center px-4 py-10">
      <form onSubmit={handleSubmit} className="surface w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="mb-6">
          Enter your account email and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm mb-4">
            ✓ Reset link sent! Check your inbox for <strong>{email}</strong>.
          </div>
        ) : (
          <>
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Send Reset Link
            </Button>
          </>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <p className="text-center text-sm mt-4">
          Remembered it?{' '}
          <Link to="/account/login" className="text-accent font-semibold">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}