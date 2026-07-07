import { OnboardingProvider } from './_components/OnboardingContext';

// Shared onboarding state persists across the registration steps so the live
// profile preview keeps growing from step to step.
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
