import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { Icon } from '../_components/Icon';

export const metadata: Metadata = {
  title: 'Registration — Personal Basics',
};

export default function PersonalBasicsPage() {
  return (
    <>
      <RegHeader backHref="/register" stepLabel="Step 1 of 4" progressPercent={25} />

      <main className="flex-grow py-12">
        <div className="mx-auto grid w-full max-w-[var(--spacing-container-max)] gap-6 px-5 md:grid-cols-12 md:px-16">
          {/* Left: imagery & brand message */}
          <div className="order-2 flex flex-col justify-center gap-8 md:order-1 md:col-span-5">
            <div className="group relative aspect-[4/5] overflow-hidden rounded-xl shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&w=1000&q=70"
                alt="Professional athlete action shot"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="glass-effect absolute inset-x-8 bottom-8 rounded-lg p-6">
                <h2 className="mb-2 font-display text-2xl font-bold text-on-surface">
                  Build Your Legacy
                </h2>
                <p className="text-on-surface-variant">
                  Arc provides the professional framework for athletes to connect with supporters
                  and fund their journey to the podium.
                </p>
              </div>
            </div>
          </div>

          {/* Right: registration form */}
          <div className="order-1 flex flex-col gap-8 md:order-2 md:col-span-7">
            <div>
              <span className="label-bold mb-2 block uppercase tracking-widest text-primary md:hidden">
                Step 1 of 4
              </span>
              <h2 className="mb-2 font-display text-4xl font-extrabold text-on-surface">
                Personal Basics
              </h2>
              <p className="text-lg text-tertiary">
                Let&rsquo;s start with who you are and where you&rsquo;re heading. This information
                will be the foundation of your public funding profile.
              </p>
            </div>

            <form className="flex flex-col gap-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
              <Field label="Full Professional Name" htmlFor="full_name">
                <input
                  id="full_name"
                  type="text"
                  placeholder="e.g. Marcus Thorne"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Primary Sport" htmlFor="sport">
                  <div className="relative">
                    <select id="sport" defaultValue="" className={`${inputClass} appearance-none pr-10`}>
                      <option value="" disabled>
                        Select your discipline
                      </option>
                      <option value="running">Running</option>
                      <option value="climbing">Climbing</option>
                      <option value="bodybuilding">Bodybuilding</option>
                    </select>
                    <Icon
                      name="chevron-down"
                      className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary"
                    />
                  </div>
                </Field>

                <Field label="Location (City, Country)" htmlFor="location">
                  <div className="relative">
                    <Icon
                      name="location"
                      className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary"
                    />
                    <input
                      id="location"
                      type="text"
                      placeholder="e.g. Boulder, USA"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="label-bold text-on-surface" htmlFor="bio">
                    Professional Bio
                  </label>
                  <span className="text-xs text-tertiary">Min. 150 characters</span>
                </div>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Briefly describe your athletic career, major achievements, and funding goals..."
                  className={inputClass}
                />
              </div>

              <div className="pt-4">
                <Link
                  href="/register/athletics"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-sm font-bold uppercase tracking-[0.05em] text-on-primary transition-all hover:bg-[#832700] active:scale-[0.98]"
                >
                  Next: Athletics
                  <Icon name="arrow-forward" className="h-5 w-5" />
                </Link>
                <p className="mt-4 text-center text-xs text-tertiary">
                  By continuing, you agree to Arc&rsquo;s{' '}
                  <a href="#" className="underline hover:text-primary">
                    Terms of Professional Conduct
                  </a>
                  .
                </p>
              </div>
            </form>

            {/* Transparency indicator */}
            <div className="flex items-start gap-4 rounded-xl border border-secondary/20 bg-secondary-container/10 p-6">
              <Icon name="shield-check" className="h-6 w-6 shrink-0 text-secondary" />
              <div>
                <h4 className="label-bold text-on-secondary-fixed-variant">
                  Identity Transparency
                </h4>
                <p className="mt-1 text-tertiary">
                  Arc uses bank-grade verification to ensure every athlete profile is authentic.
                  Your backers trust the data we provide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RegFooter />
    </>
  );
}

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-[#F8FAFC] p-3 text-base outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary';

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="label-bold text-on-surface" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
