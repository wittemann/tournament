/**
 * The "Jetzt" marker between played/running and upcoming games, as in the
 * design (docs/design/screens/Main.dc.html): red dot, line, "Jetzt · HH:MM".
 */
export default function NowLine({ now }: { /** "HH:MM" */ now: string }) {
  return (
    <div
      role="separator"
      aria-label={`Jetzt, ${now} Uhr`}
      className="flex items-center gap-2 my-1.5"
    >
      <div className="size-2.5 rounded-full bg-live"></div>
      <div className="flex-1 h-0.5 bg-live"></div>
      <span className="text-[13px] font-bold text-live">Jetzt · {now}</span>
    </div>
  );
}
