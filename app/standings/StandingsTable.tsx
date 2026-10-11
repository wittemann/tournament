import type { GroupTable, PlacementEntry, TableRow } from '@/lib/standings';

function GroupTableView({ table }: { table: GroupTable }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Gruppe {table.group}</h3>
      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm">
          <thead>
            <tr>
              <th scope="col" className="px-1 text-center">
                Pos
              </th>
              <th scope="col">Team</th>
              <th scope="col" className="px-1 text-center">
                <abbr title="Siege">S</abbr>
              </th>
              <th scope="col" className="px-1 text-center">
                <abbr title="Niederlagen">N</abbr>
              </th>
              <th scope="col" className="px-1 text-center">
                <abbr title="Unentschieden">U</abbr>
              </th>
              <th scope="col" className="px-1 text-center">
                <abbr title="Differenz">Diff</abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row: TableRow) => (
              <tr key={row.team}>
                <td className="px-1 text-center tabular-nums">{row.place}</td>
                <td className="font-semibold">{row.team}</td>
                <td className="px-1 text-center tabular-nums">{row.wins}</td>
                <td className="px-1 text-center tabular-nums">{row.losses}</td>
                <td className="px-1 text-center tabular-nums">{row.ties}</td>
                <td
                  className={`px-1 text-center tabular-nums ${
                    row.diff > 0
                      ? 'text-green-600 font-semibold'
                      : row.diff < 0
                        ? 'text-red-600 font-semibold'
                        : ''
                  }`}
                >
                  {row.diff > 0 ? '+' : ''}
                  {row.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankingView({ entries }: { entries: PlacementEntry[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Endstand</h3>
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
  title,
}: {
  tables: GroupTable[];
  ranking: PlacementEntry[];
  title: string;
}) {
  const decided = ranking.filter((e) => e.team !== null);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {tables.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {tables.map((table) => (
            <GroupTableView key={table.group} table={table} />
          ))}
        </div>
      )}

      {decided.length > 0 && <RankingView entries={decided} />}
    </div>
  );
}
