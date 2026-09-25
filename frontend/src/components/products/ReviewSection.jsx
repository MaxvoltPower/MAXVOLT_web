// ============================================================
// MAXVOLT — Product reviews section
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@lib/api';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@components/ui/Toast';
import Button from '@components/ui/Button';
import { formatDate } from '@lib/utils';

function Stars({ value = 0, size = 'md', onChange = null, interactive = false }) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`inline-flex items-center gap-0.5 ${sizeClass}`} role={interactive ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(n)}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              filled ? 'text-amber-400' : 'text-[var(--text-subtle)]'
            } leading-none`}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default function ReviewSection({ productId }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, average: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  const load = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await api.getReviews(productId);
      const items = Array.isArray(data?.items) ? data.items : [];
      setReviews(items);
      setStats({
        total: data?.total ?? items.length,
        average: data?.average ?? 0,
        distribution: data?.distribution ?? {},
      });
      if (user) {
        setHasReviewed(items.some((r) => r.uid === user.uid));
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err.message);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (myRating < 1) {
      showToast('Please select a star rating', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await api.createReview({
        productId,
        rating: myRating,
        comment: myComment.trim(),
      });
      showToast('Thanks for your review!', 'success');
      setMyRating(0);
      setMyComment('');
      setHasReviewed(true);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.deleteReview(id);
      showToast('Review deleted', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const dist = stats.distribution || {};
  const maxCount = Math.max(1, ...Object.values(dist).map((n) => Number(n) || 0));

  return (
    <section id="reviews" className="band">
      <div className="section-header">
        <span className="eyebrow">Customer Feedback</span>
        <h2>Reviews &amp; Ratings</h2>
        <p>
          {stats.total > 0
            ? `${stats.total} review${stats.total === 1 ? '' : 's'} from verified customers`
            : 'Be the first to review this product'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 max-w-5xl mx-auto">
        {/* Summary panel */}
        <aside className="surface h-fit">
          <div className="text-center mb-4">
            <div className="text-5xl font-extrabold text-amber-400 leading-none mb-2">
              {stats.average ? stats.average.toFixed(1) : '—'}
            </div>
            <Stars value={Math.round(stats.average)} />
            <div className="text-xs text-[var(--text-subtle)] mt-2">
              Based on {stats.total} review{stats.total === 1 ? '' : 's'}
            </div>
          </div>

          <div className="space-y-2 mt-6">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = Number(dist[n] || 0);
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-[var(--text-subtle)] tabular-nums">{n}★</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[var(--text-subtle)] tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Form + list */}
        <div>
          {/* Write review form */}
          {!user ? (
            <div className="surface mb-6 text-center">
              <p className="mb-3 text-[var(--text-muted)]">
                Please sign in to write a review.
              </p>
              <Link
                to="/account/login"
                onClick={() =>
                  sessionStorage.setItem(
                    'redirect_after_login',
                    window.location.pathname
                  )
                }
                className="inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-b from-brand to-brand-dark text-white font-semibold hover:-translate-y-0.5 transition-all"
              >
                Sign In
              </Link>
            </div>
          ) : hasReviewed ? (
            <div className="surface mb-6">
              <p className="text-sm text-emerald-400 font-semibold">
                ✓ You have already reviewed this product. Thanks!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="surface mb-6">
              <h3 className="text-base font-bold mb-4 text-[var(--text)]">
                Write a Review
              </h3>

              <div className="mb-4">
                <label className="block mb-2 font-semibold text-sm text-[var(--text)]">
                  Your Rating
                </label>
                <Stars value={myRating} size="lg" interactive onChange={setMyRating} />
              </div>

              <div className="form-group mb-4">
                <label className="block mb-2 font-semibold text-sm text-[var(--text)]">
                  Your Review (optional)
                </label>
                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Share your experience with this product..."
                />
                <div className="text-right text-xs text-[var(--text-subtle)] mt-1">
                  {myComment.length}/1000
                </div>
              </div>

              <Button type="submit" variant="primary" loading={submitting}>
                Submit Review
              </Button>
            </form>
          )}

          {/* Reviews list */}
          {loading ? (
            <div className="text-center py-8 text-[var(--text-subtle)]">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="surface text-center py-10">
              <div className="text-4xl mb-3 opacity-60">💬</div>
              <p className="text-[var(--text-muted)]">
                No reviews yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r._id} className="surface">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm text-[var(--text)]">
                          {r.userName || 'Customer'}
                        </strong>
                        <Stars value={r.rating} size="sm" />
                      </div>
                      <div className="text-xs text-[var(--text-subtle)] mt-1">
                        {formatDate(r.createdAt)}
                      </div>
                    </div>
                    {(user?.uid === r.uid || user?.isAdmin) && (
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="text-xs text-red-400 hover:text-red-300 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-2">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}