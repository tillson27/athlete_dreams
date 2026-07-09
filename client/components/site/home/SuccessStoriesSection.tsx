import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/site/Reveal';
import { Icon } from '@/components/ui/Icon';
import { successStories } from '@/lib/homeContent';

export function SuccessStoriesSection() {
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
        <Reveal>
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold text-on-surface md:text-5xl">
              Success Stories
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Real runners, real arcs — journeys unfolding on ARC right now.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-8 md:grid-cols-2">
          {successStories.map((story, index) => (
            <Reveal key={story.name} delay={index * 100} className="h-full">
              <div className="group h-full overflow-hidden rounded-card border border-outline-variant bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_55px_-24px_rgba(0,0,0,0.28)]">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={story.image}
                    alt={story.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-8">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h4 className="font-display text-2xl font-bold text-on-surface">
                        {story.name}
                      </h4>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {story.sport}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="label-bold text-on-surface-variant">Followers</p>
                      <p className="font-display text-xl font-bold text-on-surface">
                        {story.followers}
                      </p>
                    </div>
                  </div>
                  <p className="label-bold mb-4 inline-flex items-center gap-2 rounded-pill bg-surface-container-low px-3 py-1.5 text-on-surface">
                    <Icon name="medal" className="h-4 w-4 text-primary" />
                    {story.highlight}
                  </p>
                  <blockquote className="mb-6 border-l-4 border-primary pl-4 italic text-on-surface-variant">
                    &ldquo;{story.quote}&rdquo;
                  </blockquote>
                  <Link
                    href={story.href}
                    className="inline-flex items-center gap-2 font-bold text-primary hover:underline"
                  >
                    Read Story
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
