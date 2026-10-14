/**
 * The 2025 Xmas-Ball as a schedule input file (lib/scheduleCheck.ts), built
 * from the 2025 fixtures: feeder refs by label, scores dropped. The loader
 * tests and docs/schedule-example-2025.json come from here.
 */
import type { ScheduleEntry, ScheduleInput } from '@/lib/scheduleCheck';
import { games2025, teams2025 } from './games2025';

const labelOf = (cls: string, n: string) =>
  games2025.find((g) => g.class === cls && g.number === Number(n))?.label;

/**
 * `dropDoubleBookedScorers` (default) removes the scorer duties the 2025 data
 * double-booked, which the checker rejects: Schüler "Bretten 2" kept score at
 * 14:00 while playing in another hall, and T-Ball "Bretten" scored two games
 * in the same slot several times (the first duty of each slot stays).
 */
export function schedule2025(dropDoubleBookedScorers = true): ScheduleInput {
  const teams: ScheduleInput['teams'] = {};
  for (const t of teams2025) {
    const groups = (teams[t.class] ??= {});
    (groups[t.group_name as string] ??= []).push(t.name);
  }
  const unref = (cls: string, ref: string | null) =>
    ref?.replace(
      /^(winner|loser):(\d+)$/,
      (_, kind, n) => `${kind}:${labelOf(cls, n)}`,
    );

  const games = games2025.map((g): ScheduleEntry => {
    const base = { class: g.class, time: g.time.slice(0, 5), hall: g.location };
    if (g.eventname) return { ...base, event: g.eventname };
    const scorer = g.scorer
      ? {
          scorer: g.scorer,
          ...(g.scorer_class !== g.class && {
            scorerClass: g.scorer_class as string,
          }),
        }
      : {};
    return g.stage === 'placement'
      ? {
          ...base,
          label: g.label as string,
          home: unref(g.class, g.home_ref) as string,
          away: unref(g.class, g.away_ref) as string,
          ...scorer,
        }
      : {
          ...base,
          home: g.hometeam as string,
          away: g.awayteam as string,
          ...scorer,
        };
  });
  if (dropDoubleBookedScorers) dropDoubleBookedScorersIn(games);
  return {
    halls: ['Halle 1', 'Halle 2', 'Halle 3', 'Essensraum'],
    teams,
    games,
  };
}

function dropDoubleBookedScorersIn(games: ScheduleEntry[]) {
  const busy = new Set<string>();
  for (const g of games)
    if (g.event === undefined && g.label === undefined)
      busy
        .add(`${g.time}|${g.class}|${g.home}`)
        .add(`${g.time}|${g.class}|${g.away}`);
  for (const g of games) {
    if (!g.scorer) continue;
    const key = `${g.time}|${g.scorerClass ?? g.class}|${g.scorer}`;
    if (busy.has(key)) {
      delete g.scorer;
      delete g.scorerClass;
    } else busy.add(key);
  }
}
