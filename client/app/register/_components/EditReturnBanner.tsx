import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export function EditReturnBanner() {
  return (
    <div className="mb-8 flex flex-col items-start gap-3 rounded-card border border-secondary/30 bg-secondary-container/30 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="label-bold flex items-center gap-2 text-on-surface">
        <Icon name="fact-check" className="h-5 w-5 shrink-0" />
        Editing your profile — changes save as you type.
      </p>
      <Link
        href="/register/review"
        className="label-bold shrink-0 rounded-lg bg-secondary px-5 py-2.5 text-on-secondary transition-all hover:brightness-110 active:scale-95"
      >
        Back to review
      </Link>
    </div>
  );
}
