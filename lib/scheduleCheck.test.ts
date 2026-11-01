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
        scorer_ref: null,
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

describe('scorer roles', () => {
  /** small() with the final after the 3rd-place game, so its loser can score it. */
  function roles(edit: (s: ScheduleInput) => void = () => {}): ScheduleInput {
    const s = clone(small());
    s.halls.splice(2, 0, 'Halle 3');
    s.games[6].scorerRef = 'seed:5';
    s.games[7].scorerRef = 'seed:6';
    s.games[8].time = '11:30';
    s.games[8].scorerRef = 'loser:Platz 3';
    s.games[9].scorerRef = 'winner:Halbfinale 1';
    s.games[9].away = 'loser:Halbfinale 2';
    s.games[10].time = '12:00';
    edit(s);
    return s;
  }
  const entry = (
    time: string,
    hall: string,
    label: string,
    home: string,
    away: string,
  ) => ({
    class: 'T-Ball',
    time,
    hall,
    label,
    home,
    away,
  });
  const expectError = (edit: (s: ScheduleInput) => void, text: string) =>
    expect(errorsOf(roles(edit)).join('\n')).toContain(text);

  it('accepts a valid setup without findings', () => {
    expect(checkSchedule(roles())).toEqual([]);
  });

  it('accepts winner and loser of one game in one slot: never the same team', () => {
    const s = roles((x) => {
      x.games[8].scorerRef = 'loser:Halbfinale 1';
      x.games[9].scorerRef = 'seed:5';
    });
    expect(errorsOf(s)).toEqual([]);
  });

  it('rejects scorerRef together with scorer or scorerClass', () => {
    expectError(
      (s) => (s.games[6].scorer = 'Ada'),
      '"scorerRef" can\'t be combined',
    );
    expectError(
      (s) => (s.games[6].scorerClass = 'T-Ball'),
      '"scorerRef" can\'t be combined',
    );
  });
  it('rejects scorerRef on an event', () =>
    expectError(
      (s) => (s.games[10].scorerRef = 'seed:1'),
      'an event can\'t have "scorerRef"',
    ));
  it('rejects scorerRef on a group game', () =>
    expectError(
      (s) => (s.games[0].scorerRef = 'seed:1'),
      '"scorerRef" is only for placement games',
    ));
  it('rejects a ref that does not parse', () =>
    expectError(
      (s) => (s.games[6].scorerRef = 'seed:x'),
      'scorer ref "seed:x" is not valid',
    ));
  it('rejects a numeric feeder ref', () =>
    expectError(
      (s) => (s.games[8].scorerRef = 'loser:9'),
      'scorer ref "loser:9" points at no T-Ball placement game',
    ));
  it('rejects a feeder label that does not resolve', () =>
    expectError(
      (s) => (s.games[8].scorerRef = 'loser:Nope'),
      'scorer ref "loser:Nope" points at no T-Ball placement game',
    ));
  it('rejects a feeder in the same slot', () =>
    expectError(
      (s) => (s.games[9].scorerRef = 'winner:Platz 3'),
      'which is not played earlier',
    ));
  it('rejects a later feeder', () =>
    expectError(
      (s) => (s.games[9].scorerRef = 'winner:Finale'),
      'which is not played earlier',
    ));
  it('rejects a seed beyond the number of teams', () =>
    expectError(
      (s) => (s.games[6].scorerRef = 'seed:7'),
      'scorer ref "seed:7" is beyond the 6 T-Ball teams',
    ));
  it('rejects a group place beyond the group size', () =>
    expectError((s) => {
      for (const g of s.games.slice(6, 8)) {
        g.home = 'group:A:1';
        g.away = 'group:B:2';
      }
      s.games[7].home = 'group:B:1';
      s.games[7].away = 'group:A:2';
      s.games[6].scorerRef = 'group:A:4';
      s.games[7].scorerRef = 'group:B:3';
    }, 'scorer ref "group:A:4" is beyond group A (3 teams)'));
  it('rejects a group: role in a class using seed: refs', () =>
    expectError(
      (s) => (s.games[6].scorerRef = 'group:A:3'),
      'mix seed: and group: refs',
    ));
  it('rejects a seed: role in a class using group: refs', () =>
    expectError((s) => {
      s.games[6].home = 'group:A:1';
      s.games[6].away = 'group:B:2';
      s.games[7].home = 'group:B:1';
      s.games[7].away = 'group:A:2';
    }, 'mix seed: and group: refs'));
  it('rejects a referenced label used by several games', () =>
    expectError((s) => (s.games[7].label = 'Halbfinale 1'), 'is ambiguous'));

  it('rejects a role that is a side of its own game', () =>
    expectError(
      (s) => (s.games[6].scorerRef = 'seed:1'),
      'scorer role "seed:1" can be the team that also ("seed:1") plays in',
    ));
  it('rejects a role playing in another game of the slot', () =>
    expectError(
      (s) => (s.games[6].scorerRef = 'seed:2'),
      'scorer role "seed:2" can be the team that also ("seed:2") plays in',
    ));
  it('rejects two roles that are the same team', () =>
    expectError(
      (s) => (s.games[7].scorerRef = 'seed:5'),
      'can be the team that also ("seed:5") keeps score for',
    ));
  it('rejects a role and a fixed scorer of the class: any seed can be that team', () =>
    expectError((s) => {
      delete s.games[6].scorerRef;
      s.games[6].scorer = 'Ada';
    }, 'can be "Ada", which also keeps score for'));
  it('catches a fixed scorer of the class on a game of another class', () =>
    expectError((s) => {
      s.teams['Schüler'] = { A: ['Zed', 'Yan'] };
      s.games.push({
        class: 'Schüler',
        time: '10:30',
        hall: 'Halle 3',
        home: 'Zed',
        away: 'Yan',
        scorer: 'Ada',
        scorerClass: 'T-Ball',
      });
    }, 'can be "Ada", which also keeps score for'));
  it('accepts a fixed scorer of a group the group: role can not come from', () => {
    const s = roles((x) => {
      x.games[6].home = 'group:A:1';
      x.games[6].away = 'group:B:2';
      x.games[7].home = 'group:B:1';
      x.games[7].away = 'group:A:2';
      x.games[6].scorerRef = 'group:A:3';
      delete x.games[7].scorerRef;
      x.games[7].scorer = 'Flo'; // group B
    });
    expect(errorsOf(s)).toEqual([]);
  });
  it('rejects a role in a slot with a group game of its class', () =>
    expectError(
      (s) => (s.games[5].time = '10:30'),
      'in one slot with the group game',
    ));
  it('allows a slot with a group game of another class', () => {
    const s = roles((x) => {
      x.teams['Schüler'] = { A: ['Zed', 'Yan'] };
      x.games.push({
        class: 'Schüler',
        time: '10:30',
        hall: 'Halle 3',
        home: 'Zed',
        away: 'Yan',
      });
    });
    expect(errorsOf(s)).toEqual([]);
  });

  describe('a clash in only one result combination', () => {
    // seed:4 is in Halbfinale 1 and in X. Both refs at 11:30 are seed:4 only
    // if it wins both games.
    const crossed = (scorerRef: string) =>
      roles((s) => {
        s.games.push(
          entry('10:00', 'Halle 3', 'X', 'seed:4', 'seed:5'),
          entry('12:30', 'Halle 1', 'Y', 'winner:X', 'seed:6'),
          { ...entry('12:30', 'Halle 2', 'Z', 'seed:5', 'seed:6'), scorerRef },
        );
      });

    it('is found, and the message names the results', () => {
      const all = errorsOf(crossed('winner:Halbfinale 1')).join('\n');
      expect(all).toContain(
        'scorer role "winner:Halbfinale 1" can be the team that also ("winner:X") plays in',
      );
      expect(all).toContain('away wins "Halbfinale 1"');
      expect(all).toContain('home wins "X"');
    });

    it('is not reported when the two refs never share a team', () => {
      const all = errorsOf(crossed('winner:Halbfinale 2')).join('\n');
      expect(all).not.toContain('can be the team');
    });
  });

  it('stays exact when two refs need one game to end both ways', () => {
    // winner:M and loser:M share every place, but never in one combination.
    const s = roles((x) => {
      x.games.push(entry('12:30', 'Halle 1', 'M', 'seed:5', 'seed:6'), {
        ...entry('13:00', 'Halle 1', 'N', 'winner:M', 'seed:1'),
        scorerRef: 'loser:M',
      });
    });
    expect(errorsOf(s)).toEqual([]);
  });

  it('checks a large bracket quickly', () => {
    // 64 teams, single elimination: the semifinal refs have 16 paths each.
    const names = Array.from({ length: 64 }, (_, i) => `T${i + 1}`);
    const s: ScheduleInput = {
      halls: ['H'],
      teams: { 'T-Ball': { A: names } },
      games: [],
    };
    let round = names.map((_, i) => `seed:${i + 1}`);
    let hour = 0;
    while (round.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < round.length; i += 2) {
        const label = `R${round.length}-${i}`;
        s.games.push({
          class: 'T-Ball',
          time: `0${Math.floor(hour / 6)}:${hour % 6}0`,
          hall: `H${i}`,
          label,
          home: round[i],
          away: round[i + 1],
        });
        next.push(`winner:${label}`);
      }
      s.halls = [...new Set([...s.halls, ...s.games.map((g) => g.hall)])];
      round = next;
      hour++;
    }
    const start = Date.now();
    const all = errorsOf({
      ...s,
      games: s.games.map((g) =>
        g.label === 'R2-0' ? { ...g, scorerRef: 'winner:R4-0' } : g,
      ),
    }).join('\n');
    expect(Date.now() - start).toBeLessThan(1000);
    expect(all).toContain(
      'scorer role "winner:R4-0" can be the team that also ("winner:R4-0") plays in',
    );
  });

  it('reports a ref with too many outcomes instead of hanging', () => {
    // Each game is fed by the winner and the loser of the one before it.
    const s = roles();
    let prev = 'Platz 3';
    for (let i = 0; i < 12; i++) {
      const label = `C${i}`;
      s.games.push({
        ...entry(
          `13:${String(i * 2).padStart(2, '0')}`,
          'Halle 1',
          label,
          `winner:${prev}`,
          `loser:${prev}`,
        ),
      });
      prev = label;
    }
    s.games.at(-1)!.scorerRef = 'winner:C10';
    expect(errorsOf(s).join('\n')).toContain('too many possible outcomes');
  });

  it('rewrites scorerRef labels to numbers and leaves other refs alone', () => {
    const rows = numberGames(roles());
    const third = rows.find((r) => r.label === 'Platz 3')!;
    const final = rows.find((r) => r.label === 'Finale')!;
    const semi = rows.find((r) => r.label === 'Halbfinale 1')!;
    expect(final.scorer_ref).toBe(`loser:${third.number}`);
    expect(third.scorer_ref).toBe(`winner:${semi.number}`);
    expect(semi.scorer_ref).toBe('seed:5');
    expect(final.scorer).toBeNull();
    expect(final.scorer_class).toBeNull();
    expect(rows.find((r) => r.eventname)?.scorer_ref).toBeNull();
    expect(rows.find((r) => r.stage === 'group')?.scorer_ref).toBeNull();
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
