import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { games2025 } from '@/lib/fixtures/games2025';
import { schedule2025 } from '@/lib/fixtures/schedule2025';
import {
  checkSchedule,
  numberGames,
  type ScheduleInput,
} from '@/lib/scheduleCheck';

const errorsOf = (input: unknown) =>
  checkSchedule(input)
    .filter((f) => f.severity === 'error')
    .map((f) => f.message);
const warningsOf = (input: unknown) =>
  checkSchedule(input)
    .filter((f) => f.severity === 'warning')
    .map((f) => f.message);

/** A deep copy the test may break. */
const clone = <T>(v: T): T => structuredClone(v);

/** Two groups of three T-Ball teams, semifinals (1v4, 2v3), final, 3rd place. */
function small(): ScheduleInput {
  return {
    halls: ['Halle 1', 'Halle 2', 'Foyer'],
    teams: {
      'T-Ball': { A: ['Ada', 'Bob', 'Cy'], B: ["D'Arc", 'Eve', 'Flo'] },
    },
    games: [
      {
        class: 'T-Ball',
        time: '09:00',
        hall: 'Halle 1',
        home: 'Ada',
        away: 'Bob',
      },
      {
        class: 'T-Ball',
        time: '09:00',
        hall: 'Halle 2',
        home: "D'Arc",
        away: 'Eve',
        scorer: 'Cy',
      },
      {
        class: 'T-Ball',
        time: '09:30',
        hall: 'Halle 1',
        home: 'Bob',
        away: 'Cy',
      },
      {
        class: 'T-Ball',
        time: '09:30',
        hall: 'Halle 2',
        home: 'Eve',
        away: 'Flo',
        scorer: 'Ada',
      },
      {
        class: 'T-Ball',
        time: '10:00',
        hall: 'Halle 1',
        home: 'Ada',
        away: 'Cy',
      },
      {
        class: 'T-Ball',
        time: '10:00',
        hall: 'Halle 2',
        home: "D'Arc",
        away: 'Flo',
      },
      {
        class: 'T-Ball',
        time: '10:30',
        hall: 'Halle 1',
        label: 'Halbfinale 1',
        home: 'seed:1',
        away: 'seed:4',
      },
      {
        class: 'T-Ball',
        time: '10:30',
        hall: 'Halle 2',
        label: 'Halbfinale 2',
        home: 'seed:2',
        away: 'seed:3',
      },
      {
        class: 'T-Ball',
        time: '11:00',
        hall: 'Halle 1',
        label: 'Finale',
        home: 'winner:Halbfinale 1',
        away: 'winner:Halbfinale 2',
      },
      {
        class: 'T-Ball',
        time: '11:00',
        hall: 'Halle 2',
        label: 'Platz 3',
        home: 'loser:Halbfinale 1',
        away: 'loser:Halbfinale 2',
      },
      { class: 'T-Ball', time: '11:30', hall: 'Foyer', event: 'Siegerehrung' },
    ],
  };
}

describe('the 2025 data', () => {
  it('passes with only the expected warnings', () => {
    const findings = checkSchedule(schedule2025());
    expect(findings.filter((f) => f.severity === 'error')).toEqual([]);
    const warnings = findings.map((f) => f.message);
    expect(warnings.filter((m) => !m.includes('needed twice'))).toHaveLength(
      14,
    );
    // Essensraum and emoji: one each for the four events.
    expect(warnings.filter((m) => m.includes('"Foyer"'))).toHaveLength(4);
    expect(warnings.filter((m) => m.includes('emoji'))).toHaveLength(4);
    // 3 + 3 round-robin games with long labels, and no duplicate-label noise.
    expect(warnings.filter((m) => m.includes('characters'))).toHaveLength(6);
    expect(warnings.some((m) => m.includes('share the label'))).toBe(false);
  });

  it('finds the double-booked 2025 scorers', () => {
    const errors = errorsOf(schedule2025(false));
    expect(errors).toHaveLength(7);
    // Kept score at 14:00 while playing in another hall.
    expect(
      errors.filter((m) => m.includes('Team "Bretten 2" (Schüler)')),
    ).toHaveLength(1);
    // Scored two or three games in one slot.
    expect(
      errors.filter((m) => m.includes('Team "Bretten" (T-Ball)')),
    ).toHaveLength(6);
  });

  it('numbers the games exactly as the migration did', () => {
    const rows = numberGames(schedule2025());
    const expected = games2025
      .map((g) => ({
        number: g.number,
        class: g.class,
        stage: g.stage,
        label: g.label,
        hometeam: g.hometeam,
        awayteam: g.awayteam,
        home_ref: g.home_ref,
        away_ref: g.away_ref,
        time: g.time,
        location: g.location,
        eventname: g.eventname,
      }))
      .sort(
        (a, b) =>
          (a.number ?? 1e9) - (b.number ?? 1e9) || a.time.localeCompare(b.time),
      );
    const got = rows
      .map((g) => {
        const { scorer, scorer_class, ...rest } = g;
        void [scorer, scorer_class];
        return rest;
      })
      .sort(
        (a, b) =>
          (a.number ?? 1e9) - (b.number ?? 1e9) || a.time.localeCompare(b.time),
      );
    expect(got).toEqual(expected);
  });
});

describe('a sound small schedule', () => {
  it('has no findings at all', () => {
    expect(checkSchedule(small())).toEqual([]);
  });

  it('numbers by time, hall order and file order, and rewrites feeder refs', () => {
    const input = small();
    input.games.reverse(); // file order must not matter except as tie-break
    const rows = numberGames(input);
    expect(rows.map((r) => r.number)).toEqual([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      null,
    ]);
    const final = rows.find((r) => r.label === 'Finale');
    expect([final?.number, final?.home_ref, final?.away_ref]).toEqual([
      9,
      'winner:7',
      'winner:8',
    ]);
    const third = rows.find((r) => r.label === 'Platz 3');
    expect([third?.hometeam, third?.home_ref, third?.away_ref]).toEqual([
      null,
      'loser:7',
      'loser:8',
    ]);
    expect(rows.find((r) => r.scorer === 'Cy')?.scorer_class).toBe('T-Ball');
  });
});

describe('errors', () => {
  const broken = (edit: (s: ScheduleInput) => void) => {
    const s = clone(small());
    edit(s);
    return errorsOf(s);
  };
  const expectError = (edit: (s: ScheduleInput) => void, text: string) =>
    expect(broken(edit).join('\n')).toContain(text);

  it('unknown hall', () =>
    expectError(
      (s) => (s.games[0].hall = 'Halle 9'),
      'unknown hall "Halle 9"',
    ));
  it('unknown class', () =>
    expectError(
      (s) => (s.games[0].class = 'Senioren'),
      'unknown class "Senioren"',
    ));
  it('unknown class in teams', () =>
    expectError(
      (s) => (s.teams['Senioren'] = { A: ['X'] }),
      'Unknown class "Senioren" in teams',
    ));
  it('unknown team', () =>
    expectError(
      (s) => (s.games[0].home = 'Zed'),
      'home team "Zed" is not a T-Ball team',
    ));
  it('team of another class', () =>
    expectError((s) => {
      s.teams['Schüler'] = { A: ['Zed', 'Yan'] };
      s.games[0].home = 'Zed';
    }, 'it exists in Schüler'));
  it('unknown scorer', () =>
    expectError(
      (s) => (s.games[1].scorer = 'Zed'),
      'scorer "Zed" is not a T-Ball team',
    ));
  it('group game across groups', () =>
    expectError(
      (s) => (s.games[0].away = 'Eve'),
      'but Ada is in group A and Eve in group B',
    ));
  it('team playing itself', () =>
    expectError((s) => (s.games[0].away = 'Ada'), "can't play itself"));
  it('team listed twice', () =>
    expectError(
      (s) => s.teams['T-Ball'].B.push('Ada'),
      'team "Ada" is listed twice',
    ));
  it('bad group letter', () =>
    expectError(
      (s) => (s.teams['T-Ball']['a'] = ['X']),
      'single capital letter',
    ));
  it('hall double-booked', () =>
    expectError(
      (s) => (s.games[1].hall = 'Halle 1'),
      'Halle 1 is booked twice at 09:00',
    ));
  it('team double-booked', () =>
    expectError((s) => {
      s.games[3].home = 'Bob'; // Bob also plays Cy at 09:30
      s.games[3].away = 'Ada';
    }, 'Team "Bob" (T-Ball) is needed twice at 09:30'));
  it('scorer team playing in the slot', () =>
    expectError(
      (s) => (s.games[1].scorer = 'Ada'),
      'Team "Ada" (T-Ball) is needed twice at 09:00',
    ));
  it('scorer covering two games in one slot', () =>
    expectError(
      (s) => (s.games[0].scorer = 'Cy'), // Cy already scores game 2 at 09:00
      'Team "Cy" (T-Ball) is needed twice at 09:00',
    ));
  it('scorer playing in the game they score', () =>
    expectError(
      (s) => (s.games[0].scorer = 'Ada'),
      'scorer "Ada" plays in this game and can\'t keep score',
    ));
  it('unparsable ref', () =>
    expectError(
      (s) => (s.games[6].home = 'Ada'),
      'home ref "Ada" is not valid',
    ));
  it('numeric feeder ref', () =>
    expectError((s) => (s.games[8].home = 'winner:7'), 'labelled "7"'));
  it('unresolved feeder label', () =>
    expectError(
      (s) => (s.games[8].home = 'winner:Halbfinale 9'),
      'labelled "Halbfinale 9"',
    ));
  it('feeder in the same slot', () =>
    expectError(
      (s) => (s.games[6].time = '11:00'),
      'which is not played earlier',
    ));
  it('feeder later than the game', () =>
    expectError(
      (s) => (s.games[8].time = '10:00'),
      'which is not played earlier',
    ));
  it('duplicate label that is referenced', () =>
    expectError(
      (s) => (s.games[7].label = 'Halbfinale 1'),
      'is ambiguous: 2 T-Ball games',
    ));
  it('mixed seed and group refs', () =>
    expectError(
      (s) => (s.games[7].home = 'group:A:1'),
      'mix seed: and group: refs',
    ));
  it('seed beyond the number of teams', () =>
    expectError(
      (s) => (s.games[7].home = 'seed:7'),
      'beyond the 6 T-Ball teams',
    ));
  it('group place beyond the group size', () =>
    expectError((s) => {
      s.games[6].home = 'group:A:1';
      s.games[6].away = 'group:B:4';
      s.games[7].home = 'group:A:2';
      s.games[7].away = 'group:B:2';
    }, 'beyond group B (3 teams)'));
  it('group without teams', () =>
    expectError((s) => {
      s.games[6].home = 'group:A:1';
      s.games[6].away = 'group:Z:1';
      s.games[7].home = 'group:A:2';
      s.games[7].away = 'group:B:2';
    }, 'group Z, which has no T-Ball teams'));
  it('a missing 3rd-place game', () =>
    expectError((s) => s.games.splice(9, 1), 'no 3rd-place game'));
  it('a 3rd-place game between the wrong teams', () =>
    expectError((s) => (s.games[9].away = 'seed:5'), 'no 3rd-place game'));
  it('structure problems stop everything else', () => {
    const s = clone(small());
    (s.games[0] as unknown as Record<string, unknown>).scoreer = 'x';
    s.games[1].time = '9:00';
    expect(errorsOf(s)).toEqual([
      expect.stringContaining('unknown field "scoreer"'),
      expect.stringContaining('must look like HH:MM'),
    ]);
  });
  it('event without a class', () => {
    const s = clone(small());
    delete s.games[10].class;
    expect(errorsOf(s).join()).toContain('an event needs a "class"');
  });
  it('rejects non-objects', () => {
    expect(errorsOf([])).toHaveLength(1);
    expect(errorsOf(null)).toHaveLength(1);
  });
});

describe('warnings', () => {
  const warned = (edit: (s: ScheduleInput) => void) => {
    const s = clone(small());
    edit(s);
    return warningsOf(s).join('\n');
  };

  it('event room other than Foyer', () =>
    expect(warned((s) => (s.games[10].hall = 'Halle 1'))).toContain(
      'should happen in "Foyer"',
    ));
  it('emoji in an event name', () =>
    expect(warned((s) => (s.games[10].event = '🏆 Siegerehrung'))).toContain(
      'emoji',
    ));
  it('long placement label', () =>
    expect(
      warned((s) => (s.games[9].label = 'Spiel um Platz 3 und so')),
    ).toContain('keep it to 16'));
  it('duplicate label nothing references', () => {
    const w = warned((s) => {
      s.games.splice(
        10,
        0,
        {
          class: 'T-Ball',
          time: '11:00',
          hall: 'Foyer',
          label: 'Platz 5',
          home: 'seed:5',
          away: 'seed:6',
        },
        {
          class: 'T-Ball',
          time: '11:30',
          hall: 'Halle 1',
          label: 'Platz 5',
          home: 'seed:5',
          away: 'seed:6',
        },
      );
    });
    expect(w).toContain('share the label "Platz 5"');
  });
  it('team that never plays', () =>
    expect(warned((s) => s.teams['T-Ball'].B.push('Gus'))).toContain(
      'team "Gus" has no group game',
    ));
});

describe('the CLI', () => {
  it('runs under plain node on the example file', () => {
    const out = join(mkdtempSync(join(tmpdir(), 'schedule-')), 'out.sql');
    const r = spawnSync(
      process.execPath,
      [
        '--disable-warning=ExperimentalWarning',
        '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
        '--import',
        './scripts/register-ts.mjs',
        'scripts/schedule-to-sql.ts',
        'docs/schedule-example-2025.json',
        out,
      ],
      { encoding: 'utf8' },
    );
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    expect(readFileSync(out, 'utf8')).toContain('begin;');
  });
});
