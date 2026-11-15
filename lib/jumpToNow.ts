/** Where the "Jetzt" line is relative to the viewport, or null while it is in view. */
export type JumpDirection = 'up' | 'down' | null;

/** The parts of an IntersectionObserverEntry this needs. */
export type LineEntry = {
  isIntersecting: boolean;
  /** Top edge of the line, relative to the viewport. */
  top: number;
};

/** Arrow direction for the jump button: up if the line is above the viewport, else down. */
export function jumpDirection(entry: LineEntry): JumpDirection {
  if (entry.isIntersecting) return null;
  return entry.top < 0 ? 'up' : 'down';
}
