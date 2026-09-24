import { forwardRef } from 'react';
import { classNames } from '@lib/utils';

const variants = {
  primary:
    'bg-gradient-to-b from-brand to-brand-dark text-white shadow-md shadow-brand/25 hover:shadow-lg hover:shadow-brand/40 hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-gradient-to-b from-accent to-accent-dark text-white shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/40 hover:-translate-y-0.5 active:translate-y-0',
  outline:
    'bg-transparent text-[var(--text)] border-[1.5px] border-[var(--border-strong)] hover:border-brand hover:bg-brand/10 hover:-translate-y-0.5',
  ghost:
    'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]',
  danger:
    'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/40 hover:-translate-y-0.5',
  success:
    'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5',
  link:
    'bg-transparent text-brand-light hover:text-accent-light underline-offset-4 hover:underline px-0',
};

const sizes = {
  xs:   'px-3 py-1.5 text-xs rounded-lg',
  sm:   'px-4 py-2 text-sm rounded-lg',
  md:   'px-5 py-2.5 text-sm rounded-xl',
  lg:   'px-7 py-3.5 text-base rounded-xl',
  xl:   'px-8 py-4 text-base rounded-xl',
  icon: 'p-2.5 rounded-xl',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    loading,
    as: Component = 'button',
    ...props
  },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none ' +
    'transition-all duration-200 ease-out-expo ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none';

  const classes = classNames(base, variants[variant], sizes[size], className);

  if (Component === 'a') {
    return (
      <a ref={ref} className={classes} {...props}>
        {loading && <Spinner />}
        {children}
      </a>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
});

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

Button.displayName = 'Button';
export default Button;