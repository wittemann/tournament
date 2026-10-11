import type { SlotStatus } from '@/lib/slots';

/**
 * Heading of a time slot in the all-teams view (design: SpielplanAlle): time
 * in the condensed font, then "beendet" (time muted too), a red "läuft" or
 * "in N Min.". Nothing after the time when the status is null.
 */
export default function SlotHeading({
  time,
  status,
}: {
  /** "HH:MM" */
  time: string;
  status: SlotStatus;
}) {
  const finished = status?.kind === 'finished';
  return (
    <div className="flex items-center gap-2.5">
      <h2
        className={`font-display text-[26px] leading-tight font-bold ${finished ? 'text-muted' : ''}`}
      >
        {time}
      </h2>
      {status?.kind === 'running' && (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-live">
          <span className="size-2 rounded-full bg-live" aria-hidden="true" />
          läuft
        </span>
      )}
      {finished && <span className="text-[13px] text-muted">beendet</span>}
      {status?.kind === 'soon' && (
        <span className="text-[13px] text-muted">in {status.minutes} Min.</span>
      )}
    </div>
  );
}
