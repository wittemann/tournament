type Standing = {
  id: number;
  position: number;
  team: string;
  wins: number;
  losses: number;
  diff: number;
  class: string;
};

export default function StandingsTable({
  standings,
  title,
}: {
  standings: Standing[];
  title: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr key={standing.id}>
                <td>{standing.position}</td>
                <td className="font-semibold">{standing.team}</td>
                <td>{standing.wins}</td>
                <td>{standing.losses}</td>
                <td
                  className={
                    standing.diff > 0
                      ? 'text-green-600 font-semibold'
                      : standing.diff < 0
                      ? 'text-red-600 font-semibold'
                      : ''
                  }
                >
                  {standing.diff > 0 ? '+' : ''}
                  {standing.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
