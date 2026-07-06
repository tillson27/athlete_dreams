import Link from 'next/link';
import { LinkButton } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-5 py-24 text-center">
      <p className="label-bold text-primary">404</p>
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        That dream isn&rsquo;t on our map yet.
      </h1>
      <p className="max-w-md text-base text-on-surface-variant">
        The page you&rsquo;re looking for doesn&rsquo;t exist — or hasn&rsquo;t been built yet. Head back to the directory and find an athlete to back.
      </p>
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/" tone="primary">
          Home
        </LinkButton>
        <Link
          href="/athletes"
          className="label-bold text-on-surface hover:text-primary"
        >
          Browse athletes →
        </Link>
      </div>
    </div>
  );
}
