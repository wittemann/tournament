import { useId } from 'react';
import {
  formatDiff,
  groupStatusLabel,
  recordLabels,
  type GroupTable,
  type PlacementEntry,
  type TableRow,
} from '@/lib/standings';

// Own team: amber row with a left strip and a "Mein Team" tag (design: Tabelle).
const MINE_BG = 'bg-scorer-bg';
const MINE_STRIP = 'shadow-[inset_4px_0_0_var(--color-primary)]';

function MeinTeamTag() {
  return (
    <span className="rounded-md bg-scorer-tag px-1.5 py-0.5 text-[12px] font-bold text-scorer-ink">
      Mein Team
    </span>
  );
}

function GroupTableView({
  table,
  selectedTeam,
}: {
  table: GroupTable;
  selectedTeam: string;
}) {
  const { withTies, labels: records } = recordLabels(table.rows);
  const headingId = useId();
  const status = groupStatusLabel(table);
  return (
    <div className="rounded-card bg-base-100 overflow-hidden">
      <div className="flex items-baseline justify-between px-4 pt-3.5 pb-2">
        <h2
          id={headingId}
          className="font-display text-2xl font-bold uppercase"
        >
          Gruppe {table.group}
        </h2>
        {status && (
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            {table.complete && (
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
            )}
            {status}
          </span>
        )}
      </div>
      <table
        aria-labelledby={headingId}
        className="w-full border-collapse text-base"
      >
        <thead>
          <tr className="text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="w-7 py-1.5 pl-4 text-left font-bold">
              #
            </th>
            <th scope="col" className="px-2 py-1.5 text-left font-bold">
              Team
            </th>
            <th scope="col" className="px-2 py-1.5 text-right font-bold">
              {withTies ? (
                <abbr title="Siege – Niederlagen – Unentschieden">S–N–U</abbr>
              ) : (
                <abbr title="Siege – Niederlagen">S–N</abbr>
              )}
            </th>
            <th scope="col" className="py-1.5 pr-4 pl-2 text-right font-bold">
              <abbr title="Differenz">Diff</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row: TableRow, i) => {
            const mine = row.team === selectedTeam;
            return (
              <tr key={row.team} className="border-t border-line">
                <td
                  className={`py-3 pl-4 font-display text-lg font-bold ${mine ? `${MINE_BG} ${MINE_STRIP}` : ''}`}
                >
                  {row.place}
                </td>
                <td
                  className={`px-2 py-3 font-semibold ${mine ? MINE_BG : ''}`}
                >
                  {row.team}
                  {mine && ' '}
                  {mine && <MeinTeamTag />}
                </td>
                <td
                  className={`px-2 py-3 text-right tabular-nums ${mine ? MINE_BG : ''}`}
                >
                  {records[i]}
                </td>
                <td
                  className={`py-3 pr-4 pl-2 text-right font-semibold tabular-nums ${mine ? MINE_BG : ''} ${
                    row.diff > 0
                      ? 'text-primary'
                      : row.diff < 0
                        ? 'text-negative'
                        : ''
                  }`}
                >
                  {formatDiff(row.diff)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RankingView({
  entries,
  selectedTeam,
}: {
  entries: PlacementEntry[];
  selectedTeam: string;
}) {
  return (
    <div className="rounded-card bg-base-100 p-4">
      <h2 className="text-lg font-semibold mb-2">Endstand</h2>
      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm">
          <thead>
            <tr>
              <th scope="col">Platz</th>
              <th scope="col">Team</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const mine = entry.team === selectedTeam;
              return (
                <tr key={entry.place}>
                  <td className={mine ? `${MINE_BG} ${MINE_STRIP}` : ''}>
                    {entry.place}
                  </td>
                  <td className={`font-semibold ${mine ? MINE_BG : ''}`}>
                    {entry.team}
                    {mine && ' '}
                    {mine && <MeinTeamTag />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StandingsTable({
  tables,
  ranking,
  selectedTeam,
}: {
  tables: GroupTable[];
  ranking: PlacementEntry[];
  /** Persisted "Mein Team" name; "all" or a team not in the tables marks nothing. */
  selectedTeam: string;
}) {
  const decided = ranking.filter((e) => e.team !== null);

  return (
    <div>
      {tables.length > 0 && (
        <div className="mb-6 space-y-4">
          {tables.map((table) => (
            <GroupTableView
              key={table.group}
              table={table}
              selectedTeam={selectedTeam}
            />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <RankingView entries={decided} selectedTeam={selectedTeam} />
      )}
    </div>
  );
}
