import { OnboardingProvider } from './_components/OnboardingContext';

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
