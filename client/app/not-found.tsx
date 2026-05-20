import Link from 'next/link';
import { LinkButton } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/55">404</p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        That dream isn't on our map yet.
      </h1>
      <p className="max-w-md text-base text-ink/70">
        The page you're looking for doesn't exist — or hasn't been built yet. Head back to the directory and find an athlete to back.
      </p>
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/" tone="primary">Home</LinkButton>
        <Link href="/athletes" className="text-sm font-semibold text-ink hover:text-flame">
          Browse athletes →
        </Link>
      </div>
    </div>
  );
}
