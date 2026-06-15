import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import '../styles/globals.css';
import { SiteHeader } from '../components/site/SiteHeader';
import { SiteFooter } from '../components/site/SiteFooter';
import { MobileBottomNav } from '../components/site/MobileBottomNav';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://arc.network'),
  title: {
    default: 'ARC — Back the athletes you believe in',
    template: '%s · ARC',
  },
  description:
    "The world's most transparent athlete funding network. Back specific events, follow the math, and watch the dream come together.",
  openGraph: {
    type: 'website',
    title: 'ARC — Back the athletes you believe in',
    description:
      'Crowdfund the athletes you believe in. See exactly what their money pays for and follow them every step of the way.',
    siteName: 'ARC',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-dvh flex flex-col bg-surface text-on-surface antialiased">
        <SiteHeader />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <SiteFooter />
        <MobileBottomNav />
      </body>
    </html>
  );
}
