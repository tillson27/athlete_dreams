'use client';

import { useState } from 'react';

const VALUES = [
  'Grit',
  'Community',
  'Transparency',
  'Innovation',
  'Resilience',
  'Integrity',
  'Discipline',
  'Hard Work',
  'Perseverance',
  'Excellence',
  'Sustainability',
  'Global Impact',
  'Leadership',
  'Mental Toughness',
  'Legacy',
];

const MAX_SELECTED = 3;

export function ValueChips() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (value: string) => {
    setSelected((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      if (current.length >= MAX_SELECTED) {
        return current;
      }
      return [...current, value];
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      {VALUES.map((value) => {
        const isActive = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => toggle(value)}
            className={`rounded-full border px-6 py-3 font-bold transition-all duration-200 ${
              isActive
                ? 'border-primary bg-primary-container text-white'
                : 'border-outline text-on-surface-variant hover:border-primary'
            }`}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}
