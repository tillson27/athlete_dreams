import { SlideShell, type Slide } from '../_shell';

const sources = [
  {
    id: 'S1',
    label: 'IEG / SponsorshipX 2025 — North American sport sponsorship spend',
  },
  {
    id: 'S2',
    label: 'USOPC 2024 athlete financial well-being study',
  },
  {
    id: 'S3',
    label: 'Canadian Sport Institute 2024 athlete cost-of-competition survey',
  },
  {
    id: 'S4',
    label: 'World Athletics 2024 participation + race-entry data',
  },
  {
    id: 'S5',
    label: 'Stripe Connect platform metrics (2025 published benchmarks)',
  },
  {
    id: 'S6',
    label: 'FAD primary research — athlete survey (n=120, 2025-2026)',
  },
  {
    id: 'S7',
    label: 'FAD primary research — recurring donor interviews (n=38, 2026)',
  },
  {
    id: 'S8',
    label: 'GoFundMe S-1 + 2024 transparency reporting',
  },
  {
    id: 'S9',
    label: 'OpenSponsorship 2025 marketplace metrics (public)',
  },
];

export const a03Sources: Slide = {
  id: 'a03-sources',
  title: 'Sources',
  section: 'appendix',
  render: () => (
    <SlideShell eyebrow="Appendix · Sources">
      <h2 className="font-display text-2xl font-bold text-on-surface">
        Citations for every stat in the deck.
      </h2>
      <p className="mt-2 max-w-4xl text-[14px] leading-snug text-on-surface-variant">
        Public benchmarks, federation reports, and FAD primary research. Detailed write-ups available on
        request.
      </p>

      <ul className="mt-6 grid flex-1 grid-cols-2 gap-3">
        {sources.map((source) => (
          <li
            key={source.id}
            className="flex items-start gap-3 rounded-card border border-outline-variant/70 bg-surface-container-lowest p-4"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
              {source.id}
            </span>
            <span className="text-[12px] leading-relaxed text-on-surface">{source.label}</span>
          </li>
        ))}
      </ul>
    </SlideShell>
  ),
};
