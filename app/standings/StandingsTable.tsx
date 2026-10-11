import { useId } from 'react';
import {
  formatDiff,
  groupStatusLabel,
  recordLabels,
  type GroupTable,
  type PlacementEntry,
  type TableRow,
} from '@/lib/standings';

function GroupTableView({ table }: { table: GroupTable }) {
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
          {table.rows.map((row: TableRow, i) => (
            <tr key={row.team} className="border-t border-line">
              <td className="py-3 pl-4 font-display text-lg font-bold">
                {row.place}
              </td>
              <td className="px-2 py-3 font-semibold">{row.team}</td>
              <td className="px-2 py-3 text-right tabular-nums">
                {records[i]}
              </td>
              <td
                className={`py-3 pr-4 pl-2 text-right font-semibold tabular-nums ${
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankingView({ entries }: { entries: PlacementEntry[] }) {
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
            {entries.map((entry) => (
              <tr key={entry.place}>
                <td>{entry.place}</td>
                <td className="font-semibold">{entry.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StandingsTable({
  tables,
  ranking,
}: {
  tables: GroupTable[];
  ranking: PlacementEntry[];
}) {
  const decided = ranking.filter((e) => e.team !== null);

  return (
    <div>
      {tables.length > 0 && (
        <div className="mb-6 space-y-4">
          {tables.map((table) => (
            <GroupTableView key={table.group} table={table} />
          ))}
        </div>
      )}

      {decided.length > 0 && <RankingView entries={decided} />}
    </div>
  );
}
