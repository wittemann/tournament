/**
 * Checker and numbering for the schedule input file (docs/schedule-load.md).
 *
 * Pure: takes the parsed JSON, returns findings, never touches the database.
 * The input names placement-game feeders by label (`winner:Halbfinale 1`);
 * `numberGames` assigns game numbers the way the 2025 migration did (time,
 * hall sort, file order) and rewrites those refs to `winner:<number>`. The
 * ref grammar and the final / 3rd-place logic come from lib/standings.ts and
 * lib/cutOff.ts, so the checker agrees with what the app will draw.
 */
import { CLASS_ORDER } from '@/lib/classOrder';
import { findFinal } from '@/lib/cutOff';
import {
  parseRef,
  standingsContext,
  type GameLike,
  type TeamLike,
} from '@/lib/standings';

/** One line of the `games` array; see docs/schedule-load.md. */
export interface ScheduleEntry {
  /** Required for events too (the class filter hides other classes' events). */
  class?: string;
  /** HH:MM */
  time: string;
  hall: string;
  /** Set: an event row (Siegerehrung, Mittagspause). */
  event?: string;
  /** Set: a placement game; `home`/`away` are refs. Unset: a group game. */
  label?: string;
  home?: string;
  away?: string;
  scorer?: string;
  /** Defaults to the game's class. */
  scorerClass?: string;
}

export interface ScheduleInput {
  /** In display order. */
  halls: string[];
  /** class -> group letter -> team names */
  teams: Record<string, Record<string, string[]>>;
  games: ScheduleEntry[];
}

export interface Finding {
  severity: 'error' | 'warning';
  message: string;
}

/** A games row as the app expects it (without id, scores and live data). */
export interface NumberedGame {
  number: number | null;
  class: string;
  stage: 'group' | 'placement' | null;
  label: string | null;
  hometeam: string | null;
  awayteam: string | null;
  home_ref: string | null;
  away_ref: string | null;
  scorer: string | null;
  scorer_class: string | null;
  /** HH:MM:SS */
  time: string;
  location: string;
  eventname: string | null;
}

/** Longer placement labels wrap to three lines in the Platzierungsspiele list. */
export const MAX_LABEL_LENGTH = 16;
export const EVENT_ROOM = 'Foyer';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const CONTROL = /[\u0000-\u001f\u007f]/;
const EMOJI = /\p{Extended_Pictographic}/u;
const FEEDER = /^(winner|loser):(.+)$/;
const ENTRY_KEYS = [
  'class',
  'time',
  'hall',
  'event',
  'label',
  'home',
  'away',
  'scorer',
  'scorerClass',
];

export const hasErrors = (findings: Finding[]) =>
  findings.some((f) => f.severity === 'error');

// --- Normalised rows ------------------------------------------------------------

type Kind = 'event' | 'group' | 'placement';

interface Row {
  /** 1-based position in the file, for messages. */
  line: number;
  kind: Kind;
  entry: ScheduleEntry;
  cls: string;
}

const kindOf = (e: ScheduleEntry): Kind =>
  e.event !== undefined
    ? 'event'
    : e.label !== undefined
      ? 'placement'
      : 'group';

const teamKey = (cls: string, name: string) => `${cls}|${name}`;

function describe(r: Row): string {
  const e = r.entry;
  const where = `${r.cls} ${e.time} ${e.hall}`;
  if (r.kind === 'event')
    return `game ${r.line} (event "${e.event}", ${where})`;
  const sides = `${e.home ?? '?'} v ${e.away ?? '?'}`;
  if (r.kind === 'placement')
    return `game ${r.line} ("${e.label}", ${where}, ${sides})`;
  return `game ${r.line} (${where}, ${sides})`;
}

// --- Shape ----------------------------------------------------------------------

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Text that goes into the database: non-empty, trimmed, no control characters. */
function textProblem(s: unknown): string | null {
  if (typeof s !== 'string') return 'must be a string';
  if (s === '') return 'must not be empty';
  if (s !== s.trim()) return 'has leading or trailing spaces';
  if (CONTROL.test(s)) return 'contains a control character';
  return null;
}

/** Structural problems; the semantic checks only run when there are none. */
function checkShape(input: unknown): Finding[] {
  const out: Finding[] = [];
  const err = (message: string) => out.push({ severity: 'error', message });
  if (!isObj(input))
    return [
      { severity: 'error', message: 'The file must contain a JSON object.' },
    ];
  for (const key of Object.keys(input))
    if (!['halls', 'teams', 'games'].includes(key))
      err(`Unknown top-level field "${key}" (expected halls, teams, games).`);

  if (!Array.isArray(input.halls))
    err('"halls" must be an array of hall names.');
  else
    input.halls.forEach((h, i) => {
      const p = textProblem(h);
      if (p) err(`halls[${i}] ${p}.`);
    });

  if (!isObj(input.teams))
    err('"teams" must be an object: class -> group -> team names.');
  else
    for (const [cls, groups] of Object.entries(input.teams)) {
      if (!isObj(groups)) {
        err(`teams["${cls}"] must be an object: group letter -> team names.`);
        continue;
      }
      for (const [g, names] of Object.entries(groups)) {
        if (!Array.isArray(names)) {
          err(`teams["${cls}"]["${g}"] must be an array of team names.`);
          continue;
        }
        names.forEach((n, i) => {
          const p = textProblem(n);
          if (p) err(`teams["${cls}"]["${g}"][${i}] ${p}.`);
        });
      }
    }

  if (!Array.isArray(input.games)) err('"games" must be an array.');
  else
    input.games.forEach((e, i) => {
      const at = `Game ${i + 1}`;
      if (!isObj(e)) return err(`${at} must be an object.`);
      for (const key of Object.keys(e))
        if (!ENTRY_KEYS.includes(key))
          err(
            `${at} has an unknown field "${key}" (expected ${ENTRY_KEYS.join(', ')}).`,
          );
      for (const key of ENTRY_KEYS) {
        if (e[key] === undefined) continue;
        const p = textProblem(e[key]);
        if (p) err(`${at}: "${key}" ${p}.`);
      }
      if (e.time === undefined) err(`${at} needs a "time".`);
      else if (typeof e.time === 'string' && !TIME.test(e.time))
        err(`${at}: time "${e.time}" must look like HH:MM (24 h).`);
      if (e.hall === undefined) err(`${at} needs a "hall".`);
      if (e.event !== undefined) {
        if (e.class === undefined)
          err(
            `${at}: an event needs a "class" (the class filter hides it otherwise).`,
          );
        for (const key of ['label', 'home', 'away', 'scorer', 'scorerClass'])
          if (e[key] !== undefined) err(`${at}: an event can't have "${key}".`);
      } else {
        if (e.class === undefined) err(`${at} needs a "class".`);
        if (e.home === undefined || e.away === undefined)
          err(`${at} needs "home" and "away".`);
      }
      if (e.scorerClass !== undefined && e.scorer === undefined)
        err(`${at}: "scorerClass" without "scorer".`);
    });
  return out;
}

// --- Numbering and ref rewriting ---------------------------------------------------

function rowsOf(input: ScheduleInput): Row[] {
  return input.games.map((entry, i) => ({
    line: i + 1,
    kind: kindOf(entry),
    entry,
    cls: entry.class as string,
  }));
}

/**
 * Games sorted into schedule order and numbered 1..n by (time, hall sort,
 * file order) across all classes, as the 2025 migration did. Events get no
 * number. The result is in that order too, which is the insert order.
 * `winner:`/`loser:` labels become numbers; refs that don't resolve (the
 * checker reports those) stay as written.
 */
export function numberGames(input: ScheduleInput): NumberedGame[] {
  const hallSort = (h: string) => {
    const i = input.halls.indexOf(h);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const sorted = rowsOf(input).sort(
    (a, b) =>
      a.entry.time.localeCompare(b.entry.time) ||
      hallSort(a.entry.hall) - hallSort(b.entry.hall) ||
      a.line - b.line,
  );
  const numberOf = new Map<Row, number>();
  let n = 0;
  for (const r of sorted) if (r.kind !== 'event') numberOf.set(r, ++n);

  const rewrite = (ref: string | undefined, cls: string): string | null => {
    if (ref === undefined) return null;
    const m = FEEDER.exec(ref);
    if (!m) return ref;
    const targets = sorted.filter(
      (r) => r.kind === 'placement' && r.cls === cls && r.entry.label === m[2],
    );
    return targets.length === 1 ? `${m[1]}:${numberOf.get(targets[0])}` : ref;
  };

  return sorted.map((r): NumberedGame => {
    const e = r.entry;
    const base = {
      class: r.cls,
      time: `${e.time}:00`,
      location: e.hall,
    };
    if (r.kind === 'event')
      return {
        ...base,
        number: null,
        stage: null,
        label: null,
        hometeam: null,
        awayteam: null,
        home_ref: null,
        away_ref: null,
        scorer: null,
        scorer_class: null,
        eventname: e.event as string,
      };
    const placement = r.kind === 'placement';
    return {
      ...base,
      number: numberOf.get(r) as number,
      stage: r.kind,
      label: placement ? (e.label as string) : null,
      hometeam: placement ? null : (e.home as string),
      awayteam: placement ? null : (e.away as string),
      home_ref: placement ? rewrite(e.home, r.cls) : null,
      away_ref: placement ? rewrite(e.away, r.cls) : null,
      scorer: e.scorer ?? null,
      scorer_class: e.scorer ? (e.scorerClass ?? r.cls) : null,
      eventname: null,
    };
  });
}

// --- The checker -------------------------------------------------------------------

/**
 * All findings for a parsed input file, errors first. Errors would make the
 * database or the app misbehave (a scorer covering two games at once only
 * warns: it may be a club covering two halls); warnings are things the TODO rules ask to
 * avoid but that load fine.
 */
export function checkSchedule(raw: unknown): Finding[] {
  const shape = checkShape(raw);
  if (shape.length > 0) return shape;
  const input = raw as ScheduleInput;
  const errors: Finding[] = [];
  const warnings: Finding[] = [];
  const badClasses = new Set<string>();
  const error = (message: string, cls?: string) => {
    errors.push({ severity: 'error', message });
    if (cls) badClasses.add(cls);
  };
  const warn = (message: string) =>
    warnings.push({ severity: 'warning', message });

  // Halls.
  const halls = new Set<string>();
  for (const h of input.halls) {
    if (halls.has(h)) error(`Hall "${h}" is listed twice.`);
    halls.add(h);
  }

  // Classes and teams.
  const known = CLASS_ORDER as readonly string[];
  const classNote = `the database knows ${known.join(', ')}; a new class needs a migration (alter type public.class add value)`;
  const groupOf = new Map<string, string>(); // teamKey -> group
  const teamCount = new Map<string, number>();
  const groupSize = new Map<string, number>(); // `${cls}|${group}`
  for (const [cls, groups] of Object.entries(input.teams)) {
    if (!known.includes(cls))
      error(`Unknown class "${cls}" in teams (${classNote}).`, cls);
    for (const [g, names] of Object.entries(groups)) {
      if (!/^[A-Z]$/.test(g))
        error(`${cls}: group "${g}" must be a single capital letter.`, cls);
      groupSize.set(`${cls}|${g}`, names.length);
      for (const n of names) {
        if (groupOf.has(teamKey(cls, n)))
          error(
            `${cls}: team "${n}" is listed twice (groups ${groupOf.get(teamKey(cls, n))} and ${g}).`,
            cls,
          );
        groupOf.set(teamKey(cls, n), g);
        teamCount.set(cls, (teamCount.get(cls) ?? 0) + 1);
      }
    }
  }
  const teamExists = (cls: string, name: string) =>
    groupOf.has(teamKey(cls, name));
  const otherClasses = (name: string) =>
    Object.keys(input.teams).filter((c) => teamExists(c, name));

  const rows = rowsOf(input);
  const plays = new Set<string>(); // teamKeys in a group game

  // Per-row basics.
  for (const r of rows) {
    const e = r.entry;
    if (!halls.has(e.hall))
      error(
        `${describe(r)}: unknown hall "${e.hall}" (halls: ${input.halls.join(', ')}).`,
        r.cls,
      );
    if (!known.includes(r.cls))
      error(`${describe(r)}: unknown class "${r.cls}" (${classNote}).`, r.cls);
    else if (!input.teams[r.cls])
      error(`${describe(r)}: class "${r.cls}" has no teams.`, r.cls);

    if (r.kind === 'event') {
      if (e.hall !== EVENT_ROOM)
        warn(
          `${describe(r)}: events should happen in "${EVENT_ROOM}", not "${e.hall}" (longer names overflow the time column).`,
        );
      if (EMOJI.test(e.event as string))
        warn(`${describe(r)}: the event name contains an emoji.`);
      continue;
    }

    if (e.scorer !== undefined) {
      const sc = e.scorerClass ?? r.cls;
      if (!teamExists(sc, e.scorer))
        error(
          `${describe(r)}: scorer "${e.scorer}" is not a ${sc} team.`,
          r.cls,
        );
    }

    if (r.kind === 'group') {
      const home = e.home as string;
      const away = e.away as string;
      for (const [side, name] of [
        ['home', home],
        ['away', away],
      ]) {
        if (!teamExists(r.cls, name)) {
          const elsewhere = otherClasses(name);
          error(
            `${describe(r)}: ${side} team "${name}" is not a ${r.cls} team` +
              (elsewhere.length
                ? ` (it exists in ${elsewhere.join(', ')})`
                : '') +
              '.',
            r.cls,
          );
        } else plays.add(teamKey(r.cls, name));
      }
      if (home === away)
        error(`${describe(r)}: a team can't play itself.`, r.cls);
      else {
        const gh = groupOf.get(teamKey(r.cls, home));
        const ga = groupOf.get(teamKey(r.cls, away));
        if (gh && ga && gh !== ga)
          error(
            `${describe(r)}: group games need teams of one group, but ${home} is in group ${gh} and ${away} in group ${ga}.`,
            r.cls,
          );
      }
    }
  }

  // Placement games: labels and refs.
  const placement = rows.filter((r) => r.kind === 'placement');
  const byLabel = new Map<string, Row[]>(); // `${cls}|${label}`
  for (const r of placement) {
    const key = `${r.cls}|${r.entry.label}`;
    byLabel.set(key, [...(byLabel.get(key) ?? []), r]);
    if ((r.entry.label as string).length > MAX_LABEL_LENGTH)
      warn(
        `${describe(r)}: label is ${(r.entry.label as string).length} characters; keep it to ${MAX_LABEL_LENGTH} or less (long labels wrap to three lines).`,
      );
  }
  const referenced = new Set<string>(); // label keys that a winner:/loser: points at
  const leafStyles = new Map<string, Set<string>>(); // cls -> seed | group

  for (const r of placement) {
    const e = r.entry;
    const leaf = leafStyles.get(r.cls) ?? new Set<string>();
    leafStyles.set(r.cls, leaf);
    for (const [side, ref] of [
      ['home', e.home as string],
      ['away', e.away as string],
    ]) {
      const feeder = FEEDER.exec(ref);
      if (feeder) {
        const key = `${r.cls}|${feeder[2]}`;
        const targets = byLabel.get(key) ?? [];
        if (targets.length === 0) {
          error(
            `${describe(r)}: ${side} ref "${ref}" points at no ${r.cls} placement game labelled "${feeder[2]}".`,
            r.cls,
          );
          continue;
        }
        referenced.add(key);
        if (targets.length > 1) {
          error(
            `${describe(r)}: ${side} ref "${ref}" is ambiguous: ${targets.length} ${r.cls} games are labelled "${feeder[2]}" (${targets.map((t) => t.line).join(', ')}). Give each a unique label.`,
            r.cls,
          );
          continue;
        }
        const t = targets[0];
        if (t === r || t.entry.time >= e.time)
          error(
            `${describe(r)}: ${side} ref "${ref}" points at ${describe(t)}, which is not played earlier.`,
            r.cls,
          );
        continue;
      }
      const p = parseRef(ref);
      if (!p || p.kind === 'winner' || p.kind === 'loser') {
        error(
          `${describe(r)}: ${side} ref "${ref}" is not valid; use seed:<n>, group:<G>:<n>, winner:<label> or loser:<label>.`,
          r.cls,
        );
        continue;
      }
      leaf.add(p.kind);
      if (p.kind === 'seed') {
        const total = teamCount.get(r.cls) ?? 0;
        if (p.n > total)
          error(
            `${describe(r)}: ${side} ref "${ref}" is beyond the ${total} ${r.cls} teams.`,
            r.cls,
          );
      } else if (p.kind === 'group') {
        const size = groupSize.get(`${r.cls}|${p.group}`);
        if (size === undefined)
          error(
            `${describe(r)}: ${side} ref "${ref}" names group ${p.group}, which has no ${r.cls} teams.`,
            r.cls,
          );
        else if (p.n > size)
          error(
            `${describe(r)}: ${side} ref "${ref}" is beyond group ${p.group} (${size} teams).`,
            r.cls,
          );
      }
    }
    if (e.home === e.away)
      error(
        `${describe(r)}: home and away are the same ref "${e.home}".`,
        r.cls,
      );
  }

  for (const [cls, styles] of leafStyles)
    if (styles.size > 1)
      error(
        `${cls}: placement games mix seed: and group: refs; use one style per class (the app can pick the wrong game as the final otherwise).`,
        cls,
      );

  // Duplicate labels.
  for (const [key, group] of byLabel) {
    if (group.length < 2) continue;
    if (referenced.has(key)) continue; // reported as ambiguous above
    if (isRoundRobin(group)) continue;
    const [cls, label] = [group[0].cls, group[0].entry.label];
    warn(
      `${cls}: ${group.length} placement games share the label "${label}" (games ${group.map((g) => g.line).join(', ')}) and nothing references it. Unique labels read better ("${label} (1)", "${label} (2)"); a round robin sharing teams is fine.`,
    );
  }

  // Double booking by slot (identical start time).
  const slots = new Map<string, Row[]>();
  for (const r of rows)
    slots.set(r.entry.time, [...(slots.get(r.entry.time) ?? []), r]);
  for (const [time, slot] of slots) {
    const hallUse = new Map<string, Row>();
    const teamUse = new Map<string, { row: Row; role: string }[]>();
    for (const r of slot) {
      const prev = hallUse.get(r.entry.hall);
      if (prev && !(prev.kind === 'event' && r.kind === 'event'))
        error(
          `${r.entry.hall} is booked twice at ${time}: ${describe(prev)} and ${describe(r)}.`,
          r.cls,
        );
      else hallUse.set(r.entry.hall, prev ?? r);

      if (r.kind === 'event') continue;
      const keys: [string, string][] = [];
      if (r.kind === 'group') {
        keys.push([teamKey(r.cls, r.entry.home as string), 'plays']);
        keys.push([teamKey(r.cls, r.entry.away as string), 'plays']);
      }
      if (r.entry.scorer !== undefined)
        keys.push([
          teamKey(r.entry.scorerClass ?? r.cls, r.entry.scorer),
          'keeps score',
        ]);
      if (
        r.kind === 'group' &&
        r.entry.scorer !== undefined &&
        keys
          .slice(0, 2)
          .some(
            ([k]) =>
              k ===
              teamKey(r.entry.scorerClass ?? r.cls, r.entry.scorer as string),
          )
      )
        error(
          `${describe(r)}: scorer "${r.entry.scorer}" plays in this game and can't keep score for it.`,
          r.cls,
        );
      const seen = new Set<string>();
      for (const [k, role] of keys) {
        if (seen.has(k)) continue; // same team twice in one game: reported above
        seen.add(k);
        const [kc, kn] = k.split('|');
        for (const prev of teamUse.get(k) ?? []) {
          const msg = `Team "${kn}" (${kc}) is needed twice at ${time}: ${describe(prev.row)} (${prev.role}) and ${describe(r)} (${role}).`;
          if (prev.role === 'keeps score' && role === 'keeps score')
            warn(msg + ' Fine if the same club covers two halls.');
          else error(msg, r.cls);
        }
        teamUse.set(k, [...(teamUse.get(k) ?? []), { row: r, role }]);
      }
    }
  }

  // Teams that never play.
  for (const [key] of groupOf)
    if (!plays.has(key))
      warn(
        `${key.split('|')[0]}: team "${key.split('|')[1]}" has no group game.`,
      );

  // Final and 3rd place, per class that is otherwise sound.
  const numbered = numberGames(input);
  const teamRows: TeamLike[] = [...groupOf].map(([key, group]) => ({
    name: key.split('|')[1],
    class: key.split('|')[0] as TeamLike['class'],
    group_name: group,
  }));
  const gameLikes = numbered.map((g): GameLike => ({
    class: g.class as GameLike['class'],
    stage: g.stage,
    number: g.number,
    hometeam: g.hometeam,
    awayteam: g.awayteam,
    homescore: null,
    awayscore: null,
    home_ref: g.home_ref,
    away_ref: g.away_ref,
    label: g.label,
  }));
  for (const cls of new Set(placement.map((r) => r.cls))) {
    if (badClasses.has(cls) || !known.includes(cls)) continue;
    const ctx = standingsContext(gameLikes, teamRows, cls as GameLike['class']);
    const final = findFinal(ctx);
    if (!final) {
      warn(
        `${cls}: no final found among the placement games (a game that no winner: ref points at and that decides place 1).`,
      );
      continue;
    }
    const feeders = [final.home_ref, final.away_ref].map((ref) => {
      const p = ref ? parseRef(ref) : null;
      return p?.kind === 'winner' ? p.number : null;
    });
    if (feeders[0] === null || feeders[1] === null) continue; // no semifinals
    const third = ctx.games.find(
      (g) =>
        g.stage === 'placement' &&
        [g.home_ref, g.away_ref].sort().join() ===
          [`loser:${feeders[0]}`, `loser:${feeders[1]}`].sort().join(),
    );
    if (!third)
      error(
        `${cls}: the final is fed by two semifinals but there is no 3rd-place game between their losers (refs loser:<semifinal 1> and loser:<semifinal 2>).`,
        cls,
      );
  }

  return [...errors, ...warnings];
}

/** Games that share labels and are linked through shared refs (mini round robin). */
function isRoundRobin(group: Row[]): boolean {
  const refs = (r: Row) => [r.entry.home, r.entry.away] as string[];
  const seen = new Set<Row>([group[0]]);
  const queue = [group[0]];
  while (queue.length > 0) {
    const cur = queue.pop() as Row;
    for (const o of group)
      if (!seen.has(o) && refs(o).some((x) => refs(cur).includes(x))) {
        seen.add(o);
        queue.push(o);
      }
  }
  return seen.size === group.length && group.length >= 3;
}
