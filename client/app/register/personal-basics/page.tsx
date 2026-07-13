import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { PersonalBasicsForm } from './PersonalBasicsForm';

export const metadata: Metadata = {
  title: 'Registration — Personal Basics',
};

export default function PersonalBasicsPage() {
  return (
    <>
      <RegHeader backHref="/register" stepLabel="Step 1 of 4" currentStep={1} />

      <main className="flex-grow py-12">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Suspense>
            <PersonalBasicsForm />
          </Suspense>
        </div>
      </main>

      <RegFooter />
    </>
  );
}
