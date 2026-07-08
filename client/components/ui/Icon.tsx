import type { ReactNode } from 'react';

// Single inline-SVG icon registry for the whole client. Server-safe (no hooks).
// Glyphs are the exact paths previously duplicated across register/, the athlete
// profile, the manage editor, and the marketing pages. `chevron` (stroke) and
// `chevron-solid` (filled) are both kept to preserve their distinct looks.
type IconDef = {
  node: ReactNode;
  viewBox?: string;
  svgFill?: 'none';
};

const ICONS = {
  'arrow-back': { node: <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z" /> },
  'arrow-forward': { node: <path d="M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z" /> },
  arrow: {
    viewBox: '0 0 20 20',
    svgFill: 'none',
    node: (
      <path
        d="M4 10h12m-4-4 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  'add-circle': { node: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2Z" /> },
  'bar-chart': { node: <path d="M4 20V10h3v10H4Zm6.5 0V4h3v16h-3ZM17 20v-7h3v7h-3Z" /> },
  book: { node: <path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h13V3H6Zm0 2h11v12H6a2 2 0 0 0-1 .27V5Zm2 2v2h7V7H8Zm0 4v2h7v-2H8Z" /> },
  calendar: { node: <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 8v10H5V10h14Z" /> },
  camera: { node: <path d="M9 3h6l1.5 2H20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3.5L9 3Zm3 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" /> },
  chevron: {
    svgFill: 'none',
    node: <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  'chevron-solid': { node: <path d="M12 15.4 5.6 9 7 7.6l5 5 5-5L18.4 9 12 15.4Z" /> },
  check: { node: <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /> },
  'check-badge': { node: <path d="M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm3.86 6.39-4.6 4.6-2.13-2.12a.9.9 0 1 0-1.27 1.27l2.77 2.77a.9.9 0 0 0 1.27 0l5.23-5.23a.9.9 0 1 0-1.27-1.27Z" /> },
  'check-circle': { node: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.2L6.5 12l1.4-1.4 2.9 2.9 5.3-5.3L17.5 9.6l-6.7 6.6Z" /> },
  close: { node: <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3z" /> },
  diamond: { node: <path d="M6 2h12l4 6-10 14L2 8l4-6Zm.5 2L4 8h5.2l1.3-4H6.5Zm5.5 0-1.3 4h2.6L12 4Zm2.3 0 1.3 4H20l-2.5-4h-2.7Z" /> },
  edit: { node: <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" /> },
  edu: { node: <path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3Zm0 14L5 13.2v3.3l7 3.8 7-3.8v-3.3L12 17Z" /> },
  external: { node: <path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3Zm-9 2h5v2H5v12h12v-5h2v7H3V5h2Z" /> },
  'fact-check': { node: <path d="M20 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM10 17H5v-2h5v2Zm0-4H5v-2h5v2Zm0-4H5V7h5v2Zm4.5 8L11 13.5l1.4-1.4 2.1 2.1 3.6-3.6 1.4 1.4L14.5 17Z" /> },
  flag: { node: <path d="M6 3v18H4V3h2Zm2 1h12l-2.5 4L20 12H8V4Z" /> },
  gallery: { node: <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v9l4-4 3 3 3-3 3 3V6H5Zm3 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" /> },
  groups: { node: <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 2c-3 0-6 1.5-6 4.5V20h8v-2.5c0-1.2.5-2.3 1.3-3.2A9.6 9.6 0 0 0 8 13Zm8 0c-.7 0-1.4.1-2 .2 1.2 1 2 2.3 2 3.8V20h6v-2.5c0-3-3-4.5-6-4.5Z" /> },
  heart: { node: <path d="M12 21s-7-4.35-9.5-8.5C.5 9 2 5.5 5.5 5.5c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 5 3.5 3 7C19 16.65 12 21 12 21Z" /> },
  help: { node: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.9 15h-1.8v-1.8h1.8V17Zm1.9-6.9-.8.8c-.6.6-1 1.1-1 2.1h-1.8v-.5c0-.8.4-1.5 1-2.1l1.1-1.1c.3-.3.5-.7.5-1.2a1.9 1.9 0 0 0-3.8 0H8.2A3.8 3.8 0 1 1 14.8 10Z" /> },
  history: { node: <path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2 4.9l-1.4 1.5A9 9 0 1 0 13 3Zm-1 4v5l4.3 2.6.7-1.2-3.5-2.1V7H12Z" /> },
  hub: { node: <path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM4 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-16 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6 7.4l4.4 3.3-1.2 1.6L4.8 9 6 7.4Zm12 0L19.2 9l-4.4 3.3-1.2-1.6L18 7.4ZM9.2 13.7l1.2 1.6L6 18.6 4.8 17l4.4-3.3Zm5.6 0L19.2 17 18 18.6l-4.4-3.3 1.2-1.6Z" /> },
  info: { node: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" /> },
  instagram: { node: <path d="M12 2.2c3.2 0 3.6 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.64.07 4.85s0 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.06 15.58 2.05 15.2 2.05 12s0-3.58.07-4.85C2.27 3.96 3.79 2.42 7.02 2.27 8.42 2.21 8.8 2.2 12 2.2Zm0 3.64A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" /> },
  insights: { node: <path d="m3.5 15 5-5 4 4 7-7L21 8.4 12.5 17l-4-4-3.6 3.6L3.5 15Z" /> },
  link: { node: <path d="M10.6 13.4a1 1 0 0 0 1.4 0l3-3a3 3 0 0 0-4.2-4.2l-1 1 1.4 1.4 1-1a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 0 0 1.4Zm2.8-2.8a1 1 0 0 0-1.4 0l-3 3a3 3 0 0 0 4.2 4.2l1-1-1.4-1.4-1 1a1 1 0 1 1-1.4-1.4l3-3a1 1 0 0 0 0-1.4Z" /> },
  location: { node: <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" /> },
  lock: { node: <path d="M12 1a5 5 0 0 0-5 5v3H5v13h14V9h-2V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 0 1 6 0v3Zm-3 4a2 2 0 0 1 1 3.7V19h-2v-2.3A2 2 0 0 1 12 13Z" /> },
  medal: { node: <path d="M12 2 8 8h8l-4-6Zm0 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3 1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L12 11Z" /> },
  pencil: { node: <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" /> },
  person: { node: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" /> },
  'person-add': { node: <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h12v-1c0-2.8 0-5-4-5Zm9-3v-3h-2v3h-3v2h3v3h2v-3h3v-2h-3Z" /> },
  play: { node: <path d="M6 4.5v15a1 1 0 0 0 1.5.87l12-7.5a1 1 0 0 0 0-1.74l-12-7.5A1 1 0 0 0 6 4.5Z" /> },
  plus: { node: <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" /> },
  rocket: { node: <path d="M12 2c3 1 6 4.5 6 9 0 1.6-.4 3-.9 4.2l-1.6-1.6a5 5 0 0 0 .5-2.6c0-2.9-1.7-5.4-4-6.6-2.3 1.2-4 3.7-4 6.6a5 5 0 0 0 .5 2.6L6.9 15.2A10.2 10.2 0 0 1 6 11c0-4.5 3-8 6-9Zm-2 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM8 18l2-1 2 3 2-3 2 1-1 4H9l-1-4Z" /> },
  run: { node: <path d="M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 20l1.4-6L5 12v-3l4.5-1.9c.8-.3 1.7 0 2.2.7l1 1.6c.6 1 1.7 1.6 2.9 1.6v2c-1.6 0-3.1-.7-4.1-1.9l-.6 3 2.1 2 .9 5h-2.1l-.8-4.2L11 17l-1 3H6Z" /> },
  share: { node: <path d="M18 16a3 3 0 0 0-2.3 1.1l-6.9-3.5a3 3 0 0 0 0-1.2l6.9-3.5a3 3 0 1 0-.7-1.9l-6.9 3.5a3 3 0 1 0 0 5l6.9 3.5A3 3 0 1 0 18 16Z" /> },
  shield: { node: <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z" /> },
  'shield-check': { node: <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z" /> },
  star: { node: <path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 6.9L12 17.8 5.8 21l1.4-6.9L2 9.3l7-.8L12 2Z" /> },
  sync: { node: <path d="M12 6V3L8 7l4 4V8a4 4 0 0 1 3.9 5H18a6 6 0 0 0-6-7Zm-3.9 5H6a6 6 0 0 0 6 7v3l4-4-4-4v3a4 4 0 0 1-3.9-5Z" /> },
  target: { node: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" /> },
  timer: { node: <path d="M9 1h6v2H9V1Zm3 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm1 10h-2V9h2v6Z" /> },
  trail: { node: <path d="M14 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3.5 2.5L8 11l2 2v6h2v-7l-2-2 2.5-2.5L15 10l3 1 .6-1.8-2.4-.8-2.5-3a2 2 0 0 0-1.6-.8c-.5 0-1 .2-1.4.5L6.5 8 8 9.5l2.5-2.5Z" /> },
  trash: { node: <path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7Zm3-3h6l1 2h4v2H2V6h4l1-2Z" /> },
  trophy: { node: <path d="M6 4h12v2h3v3a4 4 0 0 1-4 4h-.3A6 6 0 0 1 13 16.9V19h3v2H8v-2h3v-2.1A6 6 0 0 1 7.3 13H7a4 4 0 0 1-4-4V6h3V4Zm12 4V6h-1.2A6 6 0 0 1 18 8Zm-12 0a6 6 0 0 1 1.2-2H6v2Z" /> },
  verified: { node: <path d="m12 1 2.4 1.8 3 .1 1 2.8 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-1 2.8-3 .1L12 23l-2.4-1.8-3-.1-1-2.8L3.2 16.5l.9-2.9-.9-2.9 2.4-1.8 1-2.8 3-.1L12 1Zm-1 14 5.7-5.7-1.4-1.4L11 12.2 8.7 9.9l-1.4 1.4L11 15Z" /> },
  watch: { node: <path d="M8 2h8l.8 4.2A7 7 0 0 1 16.8 17.8L16 22H8l-.8-4.2A7 7 0 0 1 7.2 6.2L8 2Zm4 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" /> },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const def: IconDef = ICONS[name];
  return (
    <svg
      viewBox={def.viewBox ?? '0 0 24 24'}
      fill={def.svgFill ?? 'currentColor'}
      aria-hidden="true"
      className={className}
    >
      {def.node}
    </svg>
  );
}
