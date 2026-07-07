import type { Metadata } from 'next';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { AthleticsForm } from './AthleticsForm';

export const metadata: Metadata = {
  title: 'Registration — Your Results',
};

export default function AthleticsPage() {
  return (
    <>
      <RegHeader backHref="/register/personal-basics" stepLabel="STEP 2 OF 4" progressPercent={50} />

      <main className="flex-grow py-12">
        <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
          <AthleticsForm />
        </div>
      </main>

      <RegFooter />
    </>
  );
}
