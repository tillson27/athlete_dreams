import type { ReactNode } from 'react';

export type RegIconName =
  | 'arrow-back'
  | 'arrow-forward'
  | 'help'
  | 'location'
  | 'chevron-down'
  | 'shield-check'
  | 'person'
  | 'medal'
  | 'sync'
  | 'fact-check'
  | 'star'
  | 'trophy'
  | 'history'
  | 'add-circle'
  | 'delete'
  | 'add-photo'
  | 'link'
  | 'run'
  | 'camera'
  | 'calendar'
  | 'watch'
  | 'chart'
  | 'share'
  | 'hub'
  | 'check'
  | 'verified'
  | 'query-stats'
  | 'lock'
  | 'rocket'
  | 'check-circle';

const paths: Record<RegIconName, ReactNode> = {
  'arrow-back': (
    <path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z" />
  ),
  'arrow-forward': <path d="M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z" />,
  help: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.9 15h-1.8v-1.8h1.8V17Zm1.9-6.9-.8.8c-.6.6-1 1.1-1 2.1h-1.8v-.5c0-.8.4-1.5 1-2.1l1.1-1.1c.3-.3.5-.7.5-1.2a1.9 1.9 0 0 0-3.8 0H8.2A3.8 3.8 0 1 1 14.8 10Z" />
  ),
  location: <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />,
  'chevron-down': (
    <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'shield-check': (
    <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z" />
  ),
  person: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />,
  medal: (
    <path d="M12 2 8 8h8l-4-6Zm0 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3 1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L12 11Z" />
  ),
  sync: (
    <path d="M12 6V3L8 7l4 4V8a4 4 0 0 1 3.9 5H18a6 6 0 0 0-6-7Zm-3.9 5H6a6 6 0 0 0 6 7v3l4-4-4-4v3a4 4 0 0 1-3.9-5Z" />
  ),
  'fact-check': (
    <path d="M20 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM10 17H5v-2h5v2Zm0-4H5v-2h5v2Zm0-4H5V7h5v2Zm4.5 8L11 13.5l1.4-1.4 2.1 2.1 3.6-3.6 1.4 1.4L14.5 17Z" />
  ),
  star: <path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 6.9L12 17.8 5.8 21l1.4-6.9L2 9.3l7-.8L12 2Z" />,
  trophy: (
    <path d="M6 4h12v2h3v3a4 4 0 0 1-4 4h-.3A6 6 0 0 1 13 16.9V19h3v2H8v-2h3v-2.1A6 6 0 0 1 7.3 13H7a4 4 0 0 1-4-4V6h3V4Zm12 4V6h-1.2A6 6 0 0 1 18 8Zm-12 0a6 6 0 0 1 1.2-2H6v2Z" />
  ),
  history: (
    <path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2 4.9l-1.4 1.5A9 9 0 1 0 13 3Zm-1 4v5l4.3 2.6.7-1.2-3.5-2.1V7H12Z" />
  ),
  'add-circle': (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2Z" />
  ),
  delete: (
    <path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7Zm3-3h6l1 2h4v2H2V6h4l1-2Z" />
  ),
  'add-photo': (
    <path d="M4 5h3l1.8-2h4.4L15 5h1V3h2v2h2v2h-2v2h-2V7H4v12h12v-4h2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm6 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
  ),
  link: (
    <path d="M10.6 13.4a1 1 0 0 0 1.4 0l3-3a3 3 0 0 0-4.2-4.2l-1 1 1.4 1.4 1-1a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 0 0 1.4Zm2.8-2.8a1 1 0 0 0-1.4 0l-3 3a3 3 0 0 0 4.2 4.2l1-1-1.4-1.4-1 1a1 1 0 1 1-1.4-1.4l3-3a1 1 0 0 0 0-1.4Z" />
  ),
  run: (
    <path d="M13.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 20l1.4-6L5 12v-3l4.5-1.9c.8-.3 1.7 0 2.2.7l1 1.6c.6 1 1.7 1.6 2.9 1.6v2c-1.6 0-3.1-.7-4.1-1.9l-.6 3 2.1 2 .9 5h-2.1l-.8-4.2L11 17l-1 3H6Z" />
  ),
  camera: (
    <path d="M9 3h6l1.5 2H20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3.5L9 3Zm3 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
  ),
  calendar: (
    <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 8v10H5V10h14Z" />
  ),
  watch: (
    <path d="M8 2h8l.8 4.2A7 7 0 0 1 16.8 17.8L16 22H8l-.8-4.2A7 7 0 0 1 7.2 6.2L8 2Zm4 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
  ),
  chart: <path d="M4 20V10h3v10H4Zm6.5 0V4h3v16h-3ZM17 20v-7h3v7h-3Z" />,
  share: (
    <path d="M18 16a3 3 0 0 0-2.3 1.1l-6.9-3.5a3 3 0 0 0 0-1.2l6.9-3.5a3 3 0 1 0-.7-1.9l-6.9 3.5a3 3 0 1 0 0 5l6.9 3.5A3 3 0 1 0 18 16Z" />
  ),
  hub: (
    <path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM4 5.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-16 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6 7.4l4.4 3.3-1.2 1.6L4.8 9 6 7.4Zm12 0L19.2 9l-4.4 3.3-1.2-1.6L18 7.4ZM9.2 13.7l1.2 1.6L6 18.6 4.8 17l4.4-3.3Zm5.6 0L19.2 17 18 18.6l-4.4-3.3 1.2-1.6Z" />
  ),
  check: (
    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
  ),
  verified: (
    <path d="m12 1 2.4 1.8 3 .1 1 2.8 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-1 2.8-3 .1L12 23l-2.4-1.8-3-.1-1-2.8L3.2 16.5l.9-2.9-.9-2.9 2.4-1.8 1-2.8 3-.1L12 1Zm-1 14 5.7-5.7-1.4-1.4L11 12.2 8.7 9.9l-1.4 1.4L11 15Z" />
  ),
  'query-stats': (
    <path d="M3 3v18h18v-2H5V3H3Zm14.5 2A3.5 3.5 0 0 0 14 8.5c0 .5.1 1 .3 1.4l-2 2-2-2a1 1 0 0 0-1.4 0l-2.6 2.6 1.4 1.4 1.9-1.9 2 2a1 1 0 0 0 1.4 0l2.5-2.5c.3.1.6.2 1 .2A3.5 3.5 0 1 0 17.5 5Zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
  ),
  lock: (
    <path d="M12 1a5 5 0 0 0-5 5v3H5v13h14V9h-2V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 0 1 6 0v3Zm-3 4a2 2 0 0 1 1 3.7V19h-2v-2.3A2 2 0 0 1 12 13Z" />
  ),
  rocket: (
    <path d="M12 2c3 1 6 4.5 6 9 0 1.6-.4 3-.9 4.2l-1.6-1.6a5 5 0 0 0 .5-2.6c0-2.9-1.7-5.4-4-6.6-2.3 1.2-4 3.7-4 6.6a5 5 0 0 0 .5 2.6L6.9 15.2A10.2 10.2 0 0 1 6 11c0-4.5 3-8 6-9Zm-2 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM8 18l2-1 2 3 2-3 2 1-1 4H9l-1-4Z" />
  ),
  'check-circle': (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.2L6.5 12l1.4-1.4 2.9 2.9 5.3-5.3L17.5 9.6l-6.7 6.6Z" />
  ),
};

export function Icon({ name, className }: { name: RegIconName; className?: string }) {
  const isStroke = name === 'chevron-down';
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isStroke ? 'none' : 'currentColor'}
      aria-hidden="true"
      className={className ?? 'h-6 w-6'}
    >
      {paths[name]}
    </svg>
  );
}
