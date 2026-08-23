import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { OnboardingStepGate } from '../_components/OnboardingStepGate';
import { ValuesSocialForm } from './ValuesSocialForm';

export const metadata: Metadata = {
  title: 'Registration: Values & Voice',
};

export default function ValuesSocialPage() {
  return (
    <>
      <RegHeader backHref="/register/athletics" stepLabel="Step 3 of 4" currentStep={3} />

      <main className="flex-grow py-12">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <Suspense>
            <OnboardingStepGate requiresDraft>
              <ValuesSocialForm />
            </OnboardingStepGate>
          </Suspense>
        </div>
      </main>

      <RegFooter />
    </>
  );
}
