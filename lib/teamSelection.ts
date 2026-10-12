import { Constants } from '@/lib/database.types';
import type { GameClass } from '@/lib/standings';

/**
 * The "Mein Team" choice. A team name can repeat across classes ("Stuttgart 1"
 * in T-Ball and Schüler), so a team is identified by name and class.
 * `cls: null` is a legacy choice (name only) and matches every class.
 */
export interface TeamSelection {
  name: string;
  cls: GameClass | null;
}

/** Stored value for "no team". */
export const NO_TEAM = 'all';

const CLASSES: readonly string[] = Constants.public.Enums.class;
const SEPARATOR = '|';

/**
 * Storage format of `selectedTeam`: "<class>|<name>", e.g. "T-Ball|Stuttgart 1"
 * (class first, so a "|" in a name stays harmless). "all" means no team.
 * Older versions stored the plain name; parseTeam still reads that.
 */
export function serializeTeam(team: TeamSelection | null): string {
  if (!team) return NO_TEAM;
  return team.cls ? `${team.cls}${SEPARATOR}${team.name}` : team.name;
}

/**
 * Reads a stored value. "all" and empty values give null (no team). Without a
 * known class prefix the whole value is a legacy plain name (any class), so
 * garbage never throws, it just matches nothing.
 */
export function parseTeam(
  value: string | null | undefined,
): TeamSelection | null {
  if (!value || value === NO_TEAM) return null;
  const at = value.indexOf(SEPARATOR);
  if (at > 0) {
    const cls = value.slice(0, at);
    const name = value.slice(at + 1);
    if (name && CLASSES.includes(cls)) return { name, cls: cls as GameClass };
  }
  return { name: value, cls: null };
}

/** True when a team (name in class) is the selected one. */
export function matchesTeam(
  selection: TeamSelection | null,
  name: string | null,
  cls: GameClass,
): boolean {
  return (
    !!selection &&
    name !== null &&
    selection.name === name &&
    (selection.cls === null || selection.cls === cls)
  );
}

/**
 * The stored selection checked against the teams on offer. While `choices` is
 * empty (still loading) the selection is kept as is. A selection no team
 * matches (gone, renamed) gives null. A legacy name that exists in exactly one
 * class becomes that class's team, so the select shows the real option; in
 * two or more classes it stays legacy (matches all of them). Storage is not
 * touched.
 */
export function resolveTeam(
  stored: TeamSelection | null,
  choices: readonly { name: string; cls: GameClass }[],
): TeamSelection | null {
  if (!stored || choices.length === 0) return stored;
  const found = choices.filter((c) => matchesTeam(stored, c.name, c.cls));
  if (found.length === 0) return null;
  return stored.cls === null && found.length === 1 ? found[0] : stored;
}

/**
 * The selected team's name when it plays in `cls`, else "all" (marks nothing).
 * For views of a single class (Tabelle, Finalrunde).
 */
export function teamNameInClass(value: string, cls: GameClass | undefined) {
  const selection = parseTeam(value);
  return cls && selection && matchesTeam(selection, selection.name, cls)
    ? selection.name
    : NO_TEAM;
}

export interface TeamOption {
  value: string;
  label: string;
}

/**
 * Select options for teams (name + class). A name used in several classes is
 * labelled with its class ("Stuttgart 1 (T-Ball)"); unique names are not.
 * Sorted by name, then class order of the schema.
 */
export function teamOptions(teams: readonly TeamSelection[]): TeamOption[] {
  const classCount = new Map<string, number>();
  for (const t of teams)
    classCount.set(t.name, (classCount.get(t.name) ?? 0) + 1);
  const rank = (cls: GameClass | null) => (cls ? CLASSES.indexOf(cls) : -1);
  return [...teams]
    .sort(
      (a, b) => a.name.localeCompare(b.name, 'de') || rank(a.cls) - rank(b.cls),
    )
    .map((t) => ({
      value: serializeTeam(t),
      label:
        (classCount.get(t.name) ?? 0) > 1 ? `${t.name} (${t.cls})` : t.name,
    }));
}
