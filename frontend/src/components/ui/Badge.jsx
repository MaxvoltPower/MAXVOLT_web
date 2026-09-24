import { classNames } from '@lib/utils';

const variants = {
  // Order statuses
  placed:     'bg-sky-500/15 text-sky-400 border-sky-500/25',
  pending:    'bg-slate-500/15 text-slate-400 border-slate-500/25',
  confirmed:  'bg-amber-500/15 text-amber-400 border-amber-500/25',
  processing: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  shipped:    'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  delivered:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  cancelled:  'bg-red-500/15 text-red-400 border-red-500/25',
  paid:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  failed:     'bg-red-500/15 text-red-400 border-red-500/25',

  // Quote statuses
  new:      'bg-sky-500/15 text-sky-400 border-sky-500/25',
  contacted:'bg-amber-500/15 text-amber-400 border-amber-500/25',
  quoted:   'bg-purple-500/15 text-purple-400 border-purple-500/25',
  won:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  lost:     'bg-red-500/15 text-red-400 border-red-500/25',

  // Availability
  available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  usually:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
  check:     'bg-red-500/15 text-red-400 border-red-500/25',

  default: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={classNames(
        'inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-bold uppercase tracking-wide border',
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}