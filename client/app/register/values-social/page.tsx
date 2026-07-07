import type { Metadata } from 'next';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { EditReturnBanner } from '../_components/EditReturnBanner';
import { ValuesSocialForm } from './ValuesSocialForm';

export const metadata: Metadata = {
  title: 'Registration — Values & Voice',
};

export default async function ValuesSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const fromReview = from === 'review';

  return (
    <>
      <RegHeader backHref="/register/athletics" stepLabel="STEP 3 OF 4" progressPercent={75} />

      <main className="flex-grow py-12">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          {fromReview ? <EditReturnBanner /> : null}
          <ValuesSocialForm fromReview={fromReview} />
        </div>
      </main>

      <RegFooter />
    </>
  );
}
