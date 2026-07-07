import type { Metadata } from 'next';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { EditReturnBanner } from '../_components/EditReturnBanner';
import { PersonalBasicsForm } from './PersonalBasicsForm';

export const metadata: Metadata = {
  title: 'Registration — Personal Basics',
};

export default async function PersonalBasicsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const fromReview = from === 'review';

  return (
    <>
      <RegHeader backHref="/register" stepLabel="Step 1 of 4" progressPercent={25} />

      <main className="flex-grow py-12">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          {fromReview ? <EditReturnBanner /> : null}
          <PersonalBasicsForm fromReview={fromReview} />
        </div>
      </main>

      <RegFooter />
    </>
  );
}
