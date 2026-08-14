import Link from 'next/link';
import { AthleteRouteFallback } from '@/app/_components/AthleteRouteFallback';

// Root-level 404 — catches unmatched URLs outside the (marketing) group
// (e.g. bad /register/* paths), which the marketing not-found can't reach.
export default function RootNotFoundPage() {
  return (
    <AthleteRouteFallback>
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-6 px-5 py-24 text-center">
        <p className="label-bold text-on-surface">404</p>
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          That dream isn&rsquo;t on our map yet.
        </h1>
        <p className="max-w-md text-base text-on-surface-variant">
          The page you&rsquo;re looking for doesn&rsquo;t exist — or hasn&rsquo;t been built yet.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="label-bold rounded-button bg-primary px-6 py-3 text-on-primary transition-colors hover:bg-primary-strong"
          >
            Home
          </Link>
          <Link href="/athletes" className="label-bold text-on-surface hover:text-primary">
            Browse athletes &rarr;
          </Link>
        </div>
      </div>
    </AthleteRouteFallback>
  );
}
