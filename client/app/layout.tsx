import type { Metadata } from 'next';
import '../styles/globals.css';
import { SiteHeader } from '../components/site/SiteHeader';
import { SiteFooter } from '../components/site/SiteFooter';

export const metadata: Metadata = {
  metadataBase: new URL('https://fad.network'),
  title: {
    default: "Fund an Athlete's Dream",
    template: '%s · FAD Network',
  },
  description:
    "The world's most transparent athlete funding network. Discover athletes, fund specific events, and follow their journey.",
  openGraph: {
    type: 'website',
    title: "Fund an Athlete's Dream",
    description:
      'Crowdfund the athletes you believe in. See exactly what their money pays for and follow them every step of the way.',
    siteName: 'FAD Network',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
