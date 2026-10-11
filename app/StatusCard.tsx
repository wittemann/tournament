import type { ReactNode } from 'react';

// One-line card for loading, empty and error states. `warning` uses the
// amber scorer tones; the rest of the markup is shared.
export default function StatusCard({
  children,
  tone = 'muted',
  className = '',
}: {
  children: ReactNode;
  tone?: 'muted' | 'warning';
  className?: string;
}) {
  const colors =
    tone === 'warning'
      ? 'border border-scorer-line bg-scorer-bg text-scorer-ink'
      : 'bg-base-100 text-muted';
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-card px-4 py-4 text-center text-sm ${colors} ${className}`}
    >
      {children}
    </div>
  );
}
