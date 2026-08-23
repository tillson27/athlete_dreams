import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_CONTACT_EMAIL } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The plain-English agreement for using ARC: your account, your content, and the Radical Transparency guidelines every athlete commits to.',
};

const sections: { id?: string; title: string; paragraphs: string[]; bullets?: string[] }[] = [
  {
    title: 'Who we are',
    paragraphs: [
      'ARC is a home for an athlete’s story: a profile for your results, your journey, and the community following it. These terms are a plain-English agreement between you and ARC. By creating an account or using the site, you agree to them.',
    ],
  },
  {
    title: 'Your account',
    paragraphs: [
      'You must provide accurate information when you sign up, and you’re responsible for activity that happens under your account. One account per person. If you believe your account has been accessed without your permission, contact us right away.',
    ],
  },
  {
    id: 'transparency',
    title: 'Radical Transparency guidelines',
    paragraphs: [
      'Trust is the entire point of ARC. Every athlete on the platform commits to these guidelines:',
    ],
    bullets: [
      'Results you post must be real and yours. Where an official, public results page exists, link it so anyone can check.',
      'Your story must be your own. No impersonation, no fabricated accomplishments.',
      'When crowdfunding opens: every campaign must itemize what the money is for, funded expenses must be backed by receipts, and supporters receive post-event updates showing the outcome.',
      'Breaking these guidelines can lead to content removal or account termination.',
    ],
  },
  {
    title: 'Backing and payments',
    paragraphs: [
      'Crowdfunding is not live yet. Until it launches, no money moves through ARC. When backing opens, we’ll update these terms with the details, including fees, payment processing, and refunds, before any payment feature is available to you.',
    ],
  },
  {
    title: 'Acceptable use',
    paragraphs: ['Keep it honest and keep it safe. You agree not to:'],
    bullets: [
      'Post content that is unlawful, hateful, or harassing.',
      'Misrepresent results, identity, or affiliations.',
      'Scrape, spam, or attempt to disrupt the service.',
      'Upload content you don’t have the right to share.',
    ],
  },
  {
    title: 'Your content',
    paragraphs: [
      'Your story, photos, and results remain yours. By posting them on ARC, you give us permission to display and distribute them as part of running the platform, for example showing your profile to visitors or in a share link preview. You can remove your content, or ask us to delete your account, at any time.',
    ],
  },
  {
    title: 'Disclaimers',
    paragraphs: [
      'ARC is provided as-is while we build. We work hard to keep the platform available and accurate, but we can’t guarantee uninterrupted service, and we aren’t responsible for content posted by athletes or third parties. To the fullest extent permitted by law, ARC’s liability to you is limited to the amount you’ve paid us (currently: nothing).',
    ],
  },
  {
    title: 'Changes to these terms',
    paragraphs: [
      'As ARC grows, and especially when crowdfunding launches, these terms will evolve. When they change in a way that matters, we’ll tell you on the site or by email before the change takes effect.',
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16 md:py-20">
      <p className="eyebrow text-on-surface">Legal</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-on-surface md:text-5xl">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-on-surface-variant">Last updated: July 9, 2026</p>
      <p className="mt-6 text-lg leading-relaxed text-on-surface-variant">
        We wrote these to be read. No walls of legalese, just what you can expect from ARC and
        what ARC expects from you.
      </p>

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <div key={section.title} id={section.id} className={section.id ? 'scroll-mt-32' : undefined}>
            <h2 className="font-display text-2xl font-bold text-on-surface">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-on-surface-variant">
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-on-surface-variant">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}

        <div>
          <h2 className="font-display text-2xl font-bold text-on-surface">Questions</h2>
          <p className="mt-3 leading-relaxed text-on-surface-variant">
            Email us at{' '}
            <a
              className="font-semibold text-primary underline"
              href={`mailto:${BRAND_CONTACT_EMAIL}`}
            >
              {BRAND_CONTACT_EMAIL}
            </a>{' '}
            and we answer every email. Our privacy practices live in the{' '}
            <Link href="/privacy" className="font-semibold text-primary underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
