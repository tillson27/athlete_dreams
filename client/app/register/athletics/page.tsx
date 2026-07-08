import type { Metadata } from 'next';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { EditReturnBanner } from '../_components/EditReturnBanner';
import { AthleticsForm } from './AthleticsForm';

export const metadata: Metadata = {
  title: 'Registration — Your Results',
};

export default async function AthleticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const fromReview = from === 'review';

  return (
    <>
      <RegHeader backHref="/register/personal-basics" stepLabel="Step 2 of 4" progressPercent={50} />

      <main className="flex-grow py-12">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          {fromReview ? <EditReturnBanner /> : null}
          <AthleticsForm fromReview={fromReview} />
        </div>
      </main>

      <RegFooter />
    </>
  );
}
