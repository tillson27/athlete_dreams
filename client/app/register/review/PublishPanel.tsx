'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '../_components/Icon';

type Status = 'idle' | 'publishing' | 'published';

export function PublishPanel() {
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState(false);

  const publish = () => {
    if (!agreed) {
      setError(true);
      return;
    }
    setStatus('publishing');
    setTimeout(() => setStatus('published'), 1500);
  };

  if (status === 'published') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface p-5">
        <div className="mb-8 animate-bounce text-center">
          <Icon name="check-circle" className="h-28 w-28 text-primary" />
        </div>
        <h1 className="mb-4 font-display text-4xl font-extrabold text-on-surface">
          You are now Epic.
        </h1>
        <p className="mb-12 max-w-md text-center text-lg text-on-surface-variant">
          Your profile is live. The network is now able to see your journey and contribute to your
          success.
        </p>
        <Link
          href="/athletes"
          className="label-bold rounded-lg bg-secondary px-8 py-4 text-on-secondary"
        >
          GO TO DASHBOARD
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-4 ${error ? 'animate-pulse' : ''}`}>
        <input
          id="terms"
          type="checkbox"
          checked={agreed}
          onChange={(event) => {
            setAgreed(event.target.checked);
            if (event.target.checked) setError(false);
          }}
          className="h-5 w-5 cursor-pointer rounded border-outline text-primary focus:ring-primary"
        />
        <label htmlFor="terms" className="label-bold cursor-pointer select-none text-on-surface">
          I agree to the Radical Transparency guidelines
        </label>
      </div>
      <button
        type="button"
        onClick={publish}
        disabled={status === 'publishing'}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary py-4 font-display text-2xl font-bold text-on-primary transition-all hover:bg-[#832700] active:scale-95 disabled:opacity-80"
      >
        {status === 'publishing' ? (
          <>
            <Icon name="sync" className="h-6 w-6 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            Publish My Epic
            <Icon name="rocket" className="h-6 w-6" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-on-surface-variant">
        Your profile will be live immediately upon publishing.
      </p>
    </div>
  );
}
