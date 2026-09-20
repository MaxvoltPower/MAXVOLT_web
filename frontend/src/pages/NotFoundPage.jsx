import { Link } from 'react-router-dom';
import Button from '@components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="container-custom py-24 text-center">
      <div className="text-7xl mb-6">🔋</div>
      <h1 className="text-5xl font-black mb-4">404</h1>
      <h2 className="text-2xl mb-4">Page Not Found</h2>
      <p className="mb-8 text-[var(--text-muted)]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-br from-primary-light to-primary text-white font-semibold hover:-translate-y-0.5 transition-all"
        >
          Go Home
        </Link>
        <Link
          to="/products"
          className="inline-flex px-6 py-3 rounded-xl border-2 border-dark-border-strong font-semibold hover:bg-dark-muted hover:border-accent transition-all"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
}