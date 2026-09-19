import { classNames } from '@lib/utils';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={classNames(
        'bg-dark-elevated border border-dark-border rounded-2xl overflow-hidden',
        'shadow-sm',
        hover && 'transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:border-accent',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}