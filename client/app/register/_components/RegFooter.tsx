const links = ['Support', 'Privacy Policy', 'Terms of Service', 'Security'];

export function RegFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-col items-center justify-between gap-6 px-5 py-8 md:flex-row md:px-16">
        <div className="flex flex-col gap-1">
          <span className="font-display text-2xl font-bold text-on-surface">Arc</span>
          <p className="text-xs text-on-surface-variant">
            © {new Date().getFullYear()} ARC. A home for your athletic story.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {links.map((label) => (
            <a
              key={label}
              href="#"
              className="text-xs text-on-surface-variant transition-colors hover:text-secondary hover:underline"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
