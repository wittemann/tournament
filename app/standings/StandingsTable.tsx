type Standing = {
  id: number;
  position: string;
  team: string;
  wins: number;
  losses: number;
  diff: number;
  class: string;
};

function SingleTable({
  standings,
  subtitle,
}: {
  standings: Standing[];
  subtitle?: string;
}) {
  return (
    <div>
      {subtitle && <h3 className="text-lg font-semibold mb-2">{subtitle}</h3>}
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
            {standings.map((standing) => {
              // Extract numeric position (remove letter prefix if present)
              const displayPosition = standing.position.replace(
                /^[A-Za-z]/,
                ''
              );
              return (
                <tr key={standing.id}>
                  <td>{displayPosition}</td>
                  <td className="font-semibold">{standing.team}</td>
                  <td>{standing.wins}</td>
                  <td>{standing.losses}</td>
                  <td
                    className={
                      standing.diff > 0
                        ? 'text-green-600 dark:text-green-400 font-semibold'
                        : standing.diff < 0
                        ? 'text-red-600 dark:text-red-400 font-semibold'
                        : ''
                    }
                  >
                    {standing.diff > 0 ? '+' : ''}
                    {standing.diff}
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
  standings,
  title,
}: {
  standings: Standing[];
  title: string;
}) {
  // Separate standings into groups and overall
  const overallStandings = standings.filter(
    (s) => /^\d/.test(s.position) // Position starts with a digit
  );

  const groupedStandings = standings.filter(
    (s) => /^[A-Za-z]/.test(s.position) // Position starts with a letter
  );

  // Group by the letter prefix
  const groups: Record<string, Standing[]> = {};
  groupedStandings.forEach((standing) => {
    const match = standing.position.match(/^([A-Za-z])/);
    if (match) {
      const group = match[1].toUpperCase();
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(standing);
    }
  });

  // Sort groups alphabetically
  const sortedGroupKeys = Object.keys(groups).sort();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {/* Group tables */}
      {sortedGroupKeys.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {sortedGroupKeys.map((groupKey) => (
            <SingleTable
              key={groupKey}
              standings={groups[groupKey]}
              subtitle={`Gruppe ${groupKey}`}
            />
          ))}
        </div>
      )}

      {/* Overall table */}
      {overallStandings.length > 0 && (
        <SingleTable
          standings={overallStandings}
          subtitle={sortedGroupKeys.length > 0 ? 'Overall' : undefined}
        />
      )}
    </div>
  );
}
