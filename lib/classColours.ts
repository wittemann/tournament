/** Background colour per class badge. Unknown classes get no colour class. */
export const classColours: Record<string, string> = {
  Schüler: 'bg-green-100',
  'T-Ball': 'bg-amber-100',
  Jugend: 'bg-blue-100',
};

export function classColour(cls: string): string {
  return classColours[cls] ?? '';
}
