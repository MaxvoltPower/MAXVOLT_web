import { forwardRef } from 'react';
import { classNames } from '@lib/utils';

const variants = {
  primary: 'bg-gradient-to-br from-primary-light to-primary text-white shadow-sm hover:shadow-lg hover:shadow-primary/50 hover:-translate-y-0.5',
  secondary: 'bg-gradient-to-br from-secondary to-secondary-light text-white shadow-md shadow-secondary/35 hover:shadow-xl hover:shadow-secondary/50 hover:-translate-y-0.5',
  outline: 'bg-transparent text-[var(--text)] border-2 border-dark-border-strong hover:bg-dark-muted hover:border-accent hover:-translate-y-0.5 hover:shadow-md',
  ghost: 'bg-transparent text-[var(--text)] hover:bg-dark-muted',
  danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/50 hover:-translate-y-0.5',
  success: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/50 hover:-translate-y-0.5',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  icon: 'p-3',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  as: Component = 'button',
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap select-none transition-all duration-200 active:translate-y-px active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  const classes = classNames(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );

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
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

Button.displayName = 'Button';
export default Button;