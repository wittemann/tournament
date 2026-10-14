import { describe, expect, it } from 'vitest';
import type { ScheduleInput } from '@/lib/scheduleCheck';
import { scheduleToSql, sqlString } from '@/lib/scheduleSql';

const input: ScheduleInput = {
  halls: ['Halle 1', 'Foyer'],
  teams: {
    'T-Ball': { A: ["D'Arc", 'Eve', 'Flo'] },
    Schüler: { A: ['Zed', 'Yan'] },
  },
  games: [
    {
      class: 'T-Ball',
      time: '10:00',
      hall: 'Halle 1',
      label: 'Finale',
      home: 'winner:Halbfinale',
      away: 'seed:2',
    },
    {
      class: 'T-Ball',
      time: '09:00',
      hall: 'Halle 1',
      label: 'Halbfinale',
      home: 'seed:1',
      away: 'seed:3',
    },
    {
      class: 'T-Ball',
      time: '08:00',
      hall: 'Halle 1',
      home: "D'Arc",
      away: 'Eve',
      scorer: 'Zed',
      scorerClass: 'Schüler',
    },
    { class: 'Schüler', time: '10:30', hall: 'Foyer', event: 'Siegerehrung' },
  ],
};

describe('sqlString', () => {
  it('doubles single quotes and leaves backslashes alone', () => {
    expect(sqlString("D'Arc")).toBe("'D''Arc'");
    expect(sqlString("a\\b'")).toBe("'a\\b'''");
  });
});

describe('scheduleToSql', () => {
  const sql = scheduleToSql(input);

  it('replaces games, teams, halls in one transaction, FK-safe', () => {
    const order = [
      'begin;',
      'delete from public.games;',
      'delete from public.teams;',
      'delete from public.halls;',
      'insert into public.halls',
      'insert into public.teams',
      'insert into public.games',
      'commit;',
    ].map((s) => sql.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(sql).not.toMatch(/public\.(items|faq)/);
  });

  it('writes halls in order and quoted team literals in class order', () => {
    expect(sql).toContain("('Halle 1', 1),\n  ('Foyer', 2);");
    expect(sql).toContain("('D''Arc', 'T-Ball', 'A')");
    expect(sql.indexOf("'T-Ball', 'A'")).toBeLessThan(
      sql.indexOf("'Schüler', 'A'"),
    );
  });

  it('numbers games in schedule order, rewrites refs and keeps events unnumbered', () => {
    const rows = sql.slice(sql.indexOf('values\n  (1,'), sql.indexOf('do $$'));
    expect(rows).toBe(
      [
        'values',
        "  (1, 'group', null, 'D''Arc', 'Eve', null, null, 'Zed', 'Schüler', 'T-Ball', '08:00:00', 'Halle 1', null),",
        "  (2, 'placement', 'Halbfinale', null, null, 'seed:1', 'seed:3', null, null, 'T-Ball', '09:00:00', 'Halle 1', null),",
        "  (3, 'placement', 'Finale', null, null, 'winner:2', 'seed:2', null, null, 'T-Ball', '10:00:00', 'Halle 1', null),",
        "  (null, null, null, null, null, null, null, null, null, 'Schüler', '10:30:00', 'Foyer', 'Siegerehrung');",
        '',
        '',
      ].join('\n'),
    );
  });

  it('ends with a row-count guard for 2 halls, 5 teams, 4 games', () => {
    expect(sql).toContain('count(*) from public.halls) <> 2');
    expect(sql).toContain('count(*) from public.teams) <> 5');
    expect(sql).toContain('count(*) from public.games) <> 4');
  });
});
