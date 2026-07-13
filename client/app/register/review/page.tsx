import type { Metadata } from 'next';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { ReviewSummary } from './ReviewSummary';

export const metadata: Metadata = {
  title: 'Registration — Final Review',
};

export default function FinalReviewPage() {
  return (
    <>
      <RegHeader backHref="/register/values-social" stepLabel="Step 4 of 4" currentStep={4} />

      <main className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-12 md:px-16">
        <ReviewSummary />
      </main>

      <RegFooter />
    </>
  );
}
