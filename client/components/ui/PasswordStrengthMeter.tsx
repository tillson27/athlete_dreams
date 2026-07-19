import { Icon } from './Icon';
import { passwordRequirements } from '@/lib/passwordStrength';

export function PasswordStrengthMeter({ password }: { password: string }) {
  const requirements = passwordRequirements(password);
  const metCount = requirements.filter((requirement) => requirement.met).length;
  const percent = Math.round((metCount / requirements.length) * 100);

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="h-2 overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="grid grid-cols-1 gap-1 text-xs text-on-surface-variant sm:grid-cols-3">
        {requirements.map((requirement) => (
          <li key={requirement.label} className="flex min-h-6 items-center gap-1.5">
            <Icon
              name={requirement.met ? 'check-circle' : 'info'}
              className={`h-4 w-4 shrink-0 ${
                requirement.met ? 'text-success' : 'text-on-surface-variant'
              }`}
            />
            <span className={requirement.met ? 'font-semibold text-on-surface' : undefined}>
              {requirement.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
