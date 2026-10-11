import { classColour } from '@/lib/classColours';

/** Class tag (Schüler, T-Ball, Jugend, ...) with its colour from lib/classColours.ts. */
export default function ClassTag({ cls }: { cls: string }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[13px] font-bold ${classColour(cls)}`}
    >
      {cls}
    </span>
  );
}
