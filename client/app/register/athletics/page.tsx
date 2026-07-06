import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { Icon } from '../_components/Icon';

export const metadata: Metadata = {
  title: 'Registration — Athletics & Achievements',
};

const fieldInput =
  'w-full rounded-lg border border-outline-variant/50 bg-white p-3 outline-none focus:ring-2 focus:ring-secondary';

export default function AthleticsPage() {
  return (
    <>
      <RegHeader backHref="/register/personal-basics" stepLabel="STEP 2 OF 4" progressPercent={50} />

      <main className="mx-auto w-full max-w-[var(--spacing-container-max)] flex-grow px-5 py-12 md:px-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: instructional/context */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <div className="card-lift rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-8">
              <h2 className="mb-4 font-display text-2xl font-bold text-on-surface">
                Athletics &amp; Achievements
              </h2>
              <p className="mb-6 leading-relaxed text-on-surface-variant">
                To build investor trust, we need hard data. Your &lsquo;Personal Bests&rsquo; and
                &lsquo;Career Highlights&rsquo; act as the fundamental metrics for your professional
                performance profile.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Icon name="verified" className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <p className="text-xs text-on-surface-variant">
                    Verification: All results must be verifiable via official race result URLs or
                    governing body databases.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="query-stats" className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <p className="text-xs text-on-surface-variant">
                    Performance Stats: These will be displayed as &ldquo;Key Performance
                    Indicators&rdquo; (KPIs) on your public funding page.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-lift relative hidden h-64 overflow-hidden rounded-lg lg:block">
              <Image
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=70"
                alt="Professional track athlete sprinting"
                fill
                sizes="400px"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
                <span className="font-display text-2xl font-bold text-white">
                  Validate Your Journey
                </span>
              </div>
            </div>
          </div>

          {/* Right: form canvas */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* Personal Bests */}
            <section className="card-lift rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-8">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon name="star" className="h-8 w-8 text-primary" />
                  <h3 className="font-display text-2xl font-bold">Running Personal Bests</h3>
                </div>
                <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold tracking-[0.05em] text-on-surface-variant">
                  SPORT: ATHLETICS (TRACK)
                </span>
              </div>
              <div className="mb-6 flex flex-col gap-4">
                <PbRow defaultDistance="marathon" timePlaceholder="e.g. 2:34:43" />
                <PbRow timePlaceholder="e.g. 18:45" />
              </div>
              <AddButton label="ADD ANOTHER PB" />
            </section>

            {/* Career Highlights */}
            <section className="card-lift rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-8">
              <SectionHead icon="trophy" title="Career Highlights" />
              <div className="space-y-6">
                <EventRow
                  eventValue="Diamond League - Brussels"
                  dateValue="2023-09-08"
                  resultValue="1st Place (Gold)"
                />
                <EventRow
                  eventPlaceholder="e.g. World Athletics Championships"
                  resultPlaceholder="e.g. Bronze Medal"
                />
              </div>
            </section>

            {/* Previous Races */}
            <section className="card-lift rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-8">
              <SectionHead icon="history" title="Previous Races" />
              <div className="space-y-6">
                <EventRow
                  eventPlaceholder="e.g. London Marathon"
                  resultPlaceholder="e.g. 2:45:12"
                />
              </div>
            </section>

            {/* Action bar */}
            <div className="flex flex-col items-center justify-between gap-6 border-t border-outline-variant/30 py-6 sm:flex-row">
              <Link
                href="/register/personal-basics"
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-outline px-8 py-4 font-bold text-on-surface-variant transition-all hover:bg-surface-container sm:w-auto"
              >
                <Icon name="arrow-back" className="h-5 w-5" />
                BACK
              </Link>
              <div className="flex w-full items-center gap-4 sm:w-auto">
                <p className="hidden italic text-on-surface-variant md:block">
                  Saving progress automatically...
                </p>
                <Link
                  href="/register/values-social"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-12 py-4 font-display text-2xl font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:brightness-90 active:scale-95 sm:w-auto"
                >
                  NEXT: VALUES
                  <Icon name="arrow-forward" className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RegFooter />
    </>
  );
}

function SectionHead({ icon, title }: { icon: 'trophy' | 'history'; title: string }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon name={icon} className="h-8 w-8 text-primary" />
        <h3 className="font-display text-2xl font-bold">{title}</h3>
      </div>
      <AddButton label="ADD ROW" />
    </div>
  );
}

function AddButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 font-bold text-secondary hover:underline"
    >
      <Icon name="add-circle" className="h-5 w-5" /> {label}
    </button>
  );
}

const distanceOptions = [
  { value: '5k', label: '5K' },
  { value: '10k', label: '10K' },
  { value: 'half-marathon', label: 'Half Marathon' },
  { value: 'marathon', label: 'Marathon' },
  { value: '50k', label: '50K' },
  { value: '100m', label: '100M' },
  { value: 'other', label: 'Other' },
];

function PbRow({
  defaultDistance,
  timePlaceholder,
}: {
  defaultDistance?: string;
  timePlaceholder: string;
}) {
  return (
    <div className="grid grid-cols-1 items-end gap-4 rounded-lg border border-outline-variant/20 bg-surface p-4 md:grid-cols-12">
      <div className="flex flex-col gap-2 md:col-span-6">
        <label className="label-bold text-on-surface-variant">DISTANCE</label>
        <select defaultValue={defaultDistance ?? ''} className={fieldInput}>
          {!defaultDistance ? (
            <option value="" disabled>
              Select Distance
            </option>
          ) : null}
          {distanceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2 md:col-span-5">
        <label className="label-bold text-on-surface-variant">TIME (HH:MM:SS)</label>
        <input type="text" placeholder={timePlaceholder} className={fieldInput} />
      </div>
      <div className="flex justify-center pb-2 md:col-span-1">
        <DeleteButton />
      </div>
    </div>
  );
}

function EventRow({
  eventValue,
  dateValue,
  resultValue,
  eventPlaceholder,
  resultPlaceholder,
}: {
  eventValue?: string;
  dateValue?: string;
  resultValue?: string;
  eventPlaceholder?: string;
  resultPlaceholder?: string;
}) {
  return (
    <div className="grid grid-cols-1 items-end gap-4 rounded-lg border border-outline-variant/20 bg-surface p-4 md:grid-cols-12">
      <div className="flex flex-col gap-2 md:col-span-5">
        <label className="label-bold text-on-surface-variant">EVENT NAME</label>
        <input type="text" defaultValue={eventValue} placeholder={eventPlaceholder} className={fieldInput} />
      </div>
      <div className="flex flex-col gap-2 md:col-span-3">
        <label className="label-bold text-on-surface-variant">DATE</label>
        <input type="date" defaultValue={dateValue} className={fieldInput} />
      </div>
      <div className="flex flex-col gap-2 md:col-span-3">
        <label className="label-bold text-on-surface-variant">RESULT</label>
        <input type="text" defaultValue={resultValue} placeholder={resultPlaceholder} className={fieldInput} />
      </div>
      <div className="flex justify-center pb-2 md:col-span-1">
        <DeleteButton />
      </div>

      <div className="mt-4 flex flex-col gap-2 md:col-span-12">
        <label className="label-bold uppercase text-on-surface-variant">Photo Upload</label>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            className="group flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant/50 bg-surface-container-low transition-colors hover:bg-surface-container"
          >
            <Icon
              name="add-photo"
              className="h-6 w-6 text-on-surface-variant/50 transition-colors group-hover:text-primary"
            />
            <span className="mt-1 px-1 text-center text-[10px] font-bold text-on-surface-variant/50 group-hover:text-primary">
              Add Event Photo
            </span>
          </button>
          <p className="self-end pb-2 text-xs text-on-surface-variant">Max 3 photos (JPG, PNG)</p>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 md:col-span-12">
        <label className="label-bold uppercase text-on-surface-variant">Results URL</label>
        <div className="relative">
          <Icon
            name="link"
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant/50"
          />
          <input
            type="url"
            placeholder="e.g. https://results.race.com/..."
            className={`${fieldInput} pl-12`}
          />
        </div>
      </div>
    </div>
  );
}

function DeleteButton() {
  return (
    <button
      type="button"
      aria-label="Remove row"
      className="rounded-full p-2 text-error transition-colors hover:bg-error-container/20"
    >
      <Icon name="delete" className="h-5 w-5" />
    </button>
  );
}
