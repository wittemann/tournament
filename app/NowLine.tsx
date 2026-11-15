import type { Ref } from 'react';

/**
 * The "Jetzt" marker between played/running and upcoming games, as in the
 * design (docs/design/screens/Main.dc.html): red dot, line, "Jetzt · HH:MM".
 */
export default function NowLine({
  now,
  ref,
}: {
  /** "HH:MM" */ now: string;
  /** Lets the jump button observe and scroll to the line. */
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="separator"
      aria-label={`Jetzt, ${now} Uhr`}
      className="flex items-center gap-2 my-1.5 focus:outline-none"
    >
      <div className="size-2.5 rounded-full bg-live"></div>
      <div className="flex-1 h-0.5 bg-live"></div>
      <span className="text-[13px] font-bold text-live">Jetzt · {now}</span>
    </div>
  );
}
