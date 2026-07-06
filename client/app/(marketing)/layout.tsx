import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { MobileBottomNav } from '@/components/site/MobileBottomNav';

// Marketing chrome (header, footer, mobile bottom nav) wraps every audience-
// facing page. Transactional flows outside this group (e.g. /register) render
// their own chrome instead.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileBottomNav />
    </>
  );
}
