import { classNames } from '@lib/utils';

const variants = {
  new: 'bg-sky-500/15 text-sky-400',
  placed: 'bg-sky-500/15 text-sky-400',
  contacted: 'bg-amber-500/15 text-amber-400',
  confirmed: 'bg-amber-500/15 text-amber-400',
  quoted: 'bg-purple-500/15 text-purple-400',
  processing: 'bg-purple-500/15 text-purple-400',
  shipped: 'bg-purple-500/15 text-purple-400',
  won: 'bg-emerald-500/15 text-emerald-400',
  delivered: 'bg-emerald-500/15 text-emerald-400',
  paid: 'bg-emerald-500/15 text-emerald-400',
  lost: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-red-500/15 text-red-400',
  failed: 'bg-red-500/15 text-red-400',
  available: 'bg-emerald-500/15 text-emerald-400',
  usually: 'bg-amber-500/15 text-amber-400',
  check: 'bg-red-500/15 text-red-400',
  default: 'bg-slate-500/15 text-slate-400',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={classNames(
        'inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}