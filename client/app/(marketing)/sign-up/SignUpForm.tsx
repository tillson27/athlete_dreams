'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { signUp } from '@/lib/session';
import { toAuthErrorView, type AuthErrorView } from '@/lib/authErrors';
import { authInputClass } from '@/components/ui/formStyles';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { passwordIsStrong } from '@/lib/passwordStrength';
import { safeAuthDestination } from '@/lib/authRedirect';

const PANES = ['name', 'email', 'password'] as const;
type Pane = (typeof PANES)[number];

const LAST_PANE_INDEX = PANES.length - 1;

const PANE_COPY: Record<Pane, { stepLabel: string; heading: string; hint: string }> = {
  name: {
    stepLabel: 'Your name',
    heading: 'First, what should we call you?',
    hint: 'This is the name that heads your profile. You can change it later.',
  },
  email: {
    stepLabel: 'Your email',
    heading: 'Where can supporters reach you?',
    hint: 'We use it to sign you in and send updates about your profile. It stays private.',
  },
  password: {
    stepLabel: 'Your password',
    heading: 'Last one: pick a password.',
    hint: 'Ten characters or more, with a letter and a number.',
  },
};

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authDestination = safeAuthDestination(searchParams.get('next'), '/register/personal-basics');
  const [paneIndex, setPaneIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailIsValid, setEmailIsValid] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AuthErrorView | null>(null);
  const paneInputRef = useRef<HTMLInputElement>(null);
  const focusedPaneRef = useRef(0);

  const pane = PANES[paneIndex];
  const trimmedName = name.trim();
  const isLastPane = paneIndex === LAST_PANE_INDEX;
  const paneIsComplete =
    pane === 'name' ? trimmedName.length > 0 : pane === 'email' ? emailIsValid : true;

  useEffect(() => {
    // Moving between panes must carry focus with it, or a keyboard user lands on
    // a pane whose only field is unreachable without tabbing back through the
    // header. Keyed on the pane actually focused rather than on a first-render
    // flag, so StrictMode's double-invoked mount effect cannot steal focus (and
    // scroll) on page load.
    if (focusedPaneRef.current === paneIndex) return;
    focusedPaneRef.current = paneIndex;
    paneInputRef.current?.focus();
  }, [paneIndex]);

  // A submit error belongs to the values that produced it, so leaving the pane
  // clears it rather than letting it hang over an answer the athlete is fixing.
  const goToPane = (index: number) => {
    setPaneIndex(index);
    setError(null);
  };

  const advance = () => {
    if (!paneIsComplete || isLastPane) return;
    goToPane(paneIndex + 1);
  };

  const goBack = () => {
    goToPane(Math.max(0, paneIndex - 1));
  };

  // Enter must advance rather than submit until the last pane, or the browser
  // posts a half-filled form from the first pane. Only the field is intercepted —
  // swallowing Enter on the back control or the progress dots would make them
  // keyboard-dead.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== 'Enter' || isLastPane) return;
    if (!(event.target instanceof HTMLInputElement)) return;
    event.preventDefault();
    advance();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!passwordIsStrong(password)) {
      setError({ message: 'Use at least 10 characters with a letter and a number.' });
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ name: trimmedName, email: email.trim(), password });
      router.push(authDestination);
    } catch (cause) {
      setError(toAuthErrorView('sign-up', cause));
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between gap-4">
        {paneIndex > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-pill pr-3 text-sm font-semibold text-secondary hover:bg-surface-container"
          >
            <Icon name="arrow-back" className="h-4 w-4" />
            Back
          </button>
        ) : (
          <span className="eyebrow text-on-surface-variant">
            Step {paneIndex + 1} of {PANES.length}
          </span>
        )}
        <nav aria-label="Sign-up progress" className="flex items-center gap-1.5">
          {PANES.map((paneName, index) => (
            <button
              key={paneName}
              type="button"
              onClick={() => goToPane(index)}
              disabled={index > paneIndex}
              aria-label={`Step ${index + 1}: ${PANE_COPY[paneName].stepLabel}`}
              aria-current={index === paneIndex ? 'step' : undefined}
              className="flex min-h-11 items-center px-1"
            >
              <span
                className={`block rounded-pill transition-all ${
                  index === paneIndex
                    ? 'h-2.5 w-6 bg-primary'
                    : index < paneIndex
                      ? 'h-2.5 w-2.5 bg-primary/50'
                      : 'h-2.5 w-2.5 bg-surface-container-highest'
                }`}
              />
            </button>
          ))}
        </nav>
      </div>

      <div key={pane} className="signup-pane space-y-4">
        <div>
          <h2 className="font-display text-xl font-extrabold leading-tight">
            {PANE_COPY[pane].heading}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">{PANE_COPY[pane].hint}</p>
        </div>

        {pane === 'name' ? (
          <Field
            inputRef={paneInputRef}
            name="displayName"
            type="text"
            autoComplete="name"
            label="Full name"
            placeholder="Maya Okafor"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        ) : null}

        {pane === 'email' ? (
          <Field
            inputRef={paneInputRef}
            name="email"
            type="email"
            autoComplete="email"
            label="Email"
            placeholder="you@runmail.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              // The input's own constraint validation decides what counts as an
              // address, so there is no hand-rolled regex to drift from it.
              setEmailIsValid(event.target.validity.valid && event.target.value.trim().length > 0);
            }}
          />
        ) : null}

        {pane === 'password' ? (
          <>
            <Field
              inputRef={paneInputRef}
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              label="Password"
              placeholder="At least 10 characters"
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-2 text-xs font-semibold text-secondary hover:bg-surface-container hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              }
            />
            <PasswordStrengthMeter password={password} />
          </>
        ) : null}
      </div>

      {isLastPane ? (
        <Button tone="primary" size="lg" className="w-full" type="submit" disabled={submitting}>
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Icon name="sync" className="h-4 w-4 animate-spin" />
              Creating your profile…
            </span>
          ) : (
            'Start my profile'
          )}
        </Button>
      ) : (
        <Button
          tone="primary"
          size="lg"
          className="w-full"
          type="button"
          onClick={advance}
          disabled={!paneIsComplete}
        >
          Continue
        </Button>
      )}

      {error ? (
        <p
          role="alert"
          className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          {error.message}
          {error.linkToSignIn ? (
            <>
              {' '}
              <Link
                href={`/sign-in?next=${encodeURIComponent(authDestination)}`}
                className="inline-flex min-h-11 items-center underline"
              >
                sign in instead
              </Link>
              .
            </>
          ) : null}
        </p>
      ) : null}

      {trimmedName ? <NameEcho name={trimmedName} /> : null}
    </form>
  );
}

// Echoes the typed name back as the beginnings of a profile card, so sign-up
// reads as the first step of building a page rather than as a form.
function NameEcho({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-outline-variant bg-surface-container-low p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container font-display text-sm font-extrabold text-on-primary-container">
        {initialsFrom(name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-extrabold text-on-surface">
          {name}
        </span>
        <span className="block text-xs text-on-surface-variant">Your athlete profile</span>
      </span>
    </div>
  );
}

function initialsFrom(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

function Field({
  name,
  type,
  label,
  placeholder,
  autoComplete,
  minLength,
  trailing,
  value,
  onChange,
  inputRef,
}: {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  trailing?: React.ReactNode;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="label-bold text-on-surface">{label}</span>
      <span className="relative block">
        <input
          ref={inputRef}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${authInputClass} ${trailing ? 'pr-16' : ''}`}
        />
        {trailing ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </span>
    </label>
  );
}
