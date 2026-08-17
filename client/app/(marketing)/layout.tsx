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
      {/* No bottom padding for the fixed mobile nav here — SiteFooter's `pb-24`
          already clears it, and doubling up left an empty band above the footer. */}
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <MobileBottomNav />
    </>
  );
}
