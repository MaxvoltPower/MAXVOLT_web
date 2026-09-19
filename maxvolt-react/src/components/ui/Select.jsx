import { forwardRef } from 'react';
import { classNames } from '@lib/utils';

const Select = forwardRef(({
  label,
  error,
  hint,
  children,
  className,
  required,
  ...props
}, ref) => {
  return (
    <div className="form-group">
      {label && (
        <label className="block mb-2 font-semibold text-sm text-[var(--text)]">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={classNames(
            'w-full px-4 py-3 pr-10 rounded-xl border-[1.5px] bg-dark-muted text-[var(--text)] text-[0.95rem] transition-all duration-200 appearance-none cursor-pointer',
            'hover:border-dark-border-strong',
            'focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/25',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {hint && !error && (
        <p className="mt-1 text-xs text-[var(--text-subtle)]">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;