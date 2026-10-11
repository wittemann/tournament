import { classColour } from '@/lib/classColours';

/** Class badge (Schüler, T-Ball, Jugend, ...) with its colour from lib/classColours.ts. */
export default function ClassTag({ cls }: { cls: string }) {
  return (
    <span className={`badge badge-outline badge-sm ${classColour(cls)}`}>
      {cls}
    </span>
  );
}
