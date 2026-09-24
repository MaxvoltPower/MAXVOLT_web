import { classNames } from '@lib/utils';

export default function Skeleton({ className, ...props }) {
  return <div className={classNames('skeleton rounded-lg', className)} {...props} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-[var(--bg-elev)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="h-48 skeleton" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-8 w-full mt-4" />
      </div>
    </div>
  );
}