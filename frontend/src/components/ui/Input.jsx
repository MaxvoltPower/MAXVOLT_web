import { forwardRef } from 'react';
import { classNames } from '@lib/utils';

const Input = forwardRef(({
  label,
  error,
  hint,
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
      <input
        ref={ref}
        className={classNames(
          'w-full px-4 py-3 rounded-xl border-[1.5px] bg-dark-muted text-[var(--text)] text-[0.95rem] transition-all duration-200',
          'hover:border-dark-border-strong',
          'focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/25',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/25',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-[var(--text-subtle)]">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;