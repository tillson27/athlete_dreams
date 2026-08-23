import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_CONTACT_EMAIL } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What ARC collects, how it’s used, and the choices you have, written in plain English.',
};

const sections: { title: string; paragraphs: string[]; bullets?: string[] }[] = [
  {
    title: 'What we collect',
    paragraphs: ['We collect only what we need to run ARC:'],
    bullets: [
      'Account details: your name and email address when you sign up.',
      'Profile content: the story, results, races, values, and photos you choose to publish. This content is public by design; that’s what a profile is for.',
      'On-device data: while we build out our backend, in-progress profile edits and preferences (like who you follow) are stored in your own browser’s local storage, not on our servers.',
      'Basic technical data: logs the hosting infrastructure records to keep the site running and secure.',
    ],
  },
  {
    title: 'How we use it',
    paragraphs: ['We use your information to:'],
    bullets: [
      'Create and display your athlete profile.',
      'Operate, maintain, and improve the platform.',
      'Reply when you contact us.',
      'Send you service updates that affect your account, not marketing spam.',
    ],
  },
  {
    title: 'What we don’t do',
    paragraphs: [
      'We don’t sell your personal information. We don’t share it with third parties except the service providers who help us run the platform (like hosting), or when the law requires it.',
    ],
  },
  {
    title: 'Cookies and local storage',
    paragraphs: [
      'ARC uses your browser’s local storage to keep you signed in and to save in-progress work, like a profile you’re building. We don’t use advertising trackers.',
    ],
  },
  {
    title: 'Your choices',
    paragraphs: [
      'Your profile content is yours. You can edit it anytime, and you can ask us to delete your account and the data we hold by emailing us. Since some data lives in your own browser, clearing your browser storage removes it too.',
    ],
  },
  {
    title: 'Children',
    paragraphs: [
      'ARC is not directed at children under 13, and we don’t knowingly collect their information. If you believe a child has created an account, contact us and we’ll remove it.',
    ],
  },
  {
    title: 'Where we operate',
    paragraphs: [
      'ARC is built in Canada and handles personal information in line with Canadian privacy law (PIPEDA). If you access ARC from elsewhere, your information may be processed in Canada or where our service providers operate.',
    ],
  },
  {
    title: 'Changes to this policy',
    paragraphs: [
      'As features launch, and especially crowdfunding, which will involve payment providers, this policy will be updated before those features go live. Material changes will be announced on the site or by email.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16 md:py-20">
      <p className="eyebrow text-on-surface">Legal</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold text-on-surface md:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-on-surface-variant">Last updated: July 9, 2026</p>
      <p className="mt-6 text-lg leading-relaxed text-on-surface-variant">
        Transparency is the heart of ARC, and that includes how we handle your information. Here’s
        the plain-English version of what we collect and why.
      </p>

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
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
          <h2 className="font-display text-2xl font-bold text-on-surface">Contact us</h2>
          <p className="mt-3 leading-relaxed text-on-surface-variant">
            Questions or requests about your data? Email{' '}
            <a
              className="font-semibold text-primary underline"
              href={`mailto:${BRAND_CONTACT_EMAIL}`}
            >
              {BRAND_CONTACT_EMAIL}
            </a>{' '}
            and we answer every email. Our platform rules live in the{' '}
            <Link href="/terms" className="font-semibold text-primary underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
