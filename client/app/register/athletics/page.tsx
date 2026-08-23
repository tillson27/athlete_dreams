import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { OnboardingStepGate } from '../_components/OnboardingStepGate';
import { AthleticsForm } from './AthleticsForm';

export const metadata: Metadata = {
  title: 'Registration: Your Results',
};

export default function AthleticsPage() {
  return (
    <>
      <RegHeader backHref="/register/personal-basics" stepLabel="Step 2 of 4" currentStep={2} />

      <main className="flex-grow py-12">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Suspense>
            <OnboardingStepGate requiresDraft>
              <AthleticsForm />
            </OnboardingStepGate>
          </Suspense>
        </div>
      </main>

      <RegFooter />
    </>
  );
}
