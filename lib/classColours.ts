/**
 * Tag classes per class, from the theme tokens in app/globals.css.
 * Full class strings stay literal so Tailwind picks them up.
 */
export const classColours: Record<string, string> = {
  Schüler: 'bg-class-schueler-bg text-class-schueler-ink',
  'T-Ball': 'bg-class-tball-bg text-class-tball-ink',
  Jugend: 'bg-class-jugend-bg text-class-jugend-ink',
};

/** Unknown classes get a neutral tag. */
export const neutralClassColour = 'bg-base-300 text-muted-2';

export function classColour(cls: string): string {
  return classColours[cls] ?? neutralClassColour;
}
