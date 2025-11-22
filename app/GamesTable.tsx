'use client';

import { useState, useMemo } from 'react';

type Game = {
  id: number;
  class: string;
  hometeam: string;
  awayteam: string;
  hall: string;
  homescore: number;
  awayscore: number;
};

export default function GamesTable({ games }: { games: Game[] }) {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedHall, setSelectedHall] = useState<string>('all');

  // Get unique teams from all games
  const teams = useMemo(() => {
    const teamSet = new Set<string>();
    games.forEach((game) => {
      teamSet.add(game.hometeam);
      teamSet.add(game.awayteam);
    });
    return Array.from(teamSet).sort();
  }, [games]);

  // Get unique halls from all games
  const halls = useMemo(() => {
    const hallSet = new Set<string>();
    games.forEach((game) => {
      hallSet.add(game.hall);
    });
    return Array.from(hallSet).sort();
  }, [games]);

  // Filter games based on selected team and hall
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const teamMatch =
        selectedTeam === 'all' ||
        game.hometeam === selectedTeam ||
        game.awayteam === selectedTeam;
      const hallMatch = selectedHall === 'all' || game.hall === selectedHall;
      return teamMatch && hallMatch;
    });
  }, [games, selectedTeam, selectedHall]);

  return (
    <>
      <div>
        <div>
          <label htmlFor="team-filter">Filter nach Team:</label>
          <select
            id="team-filter"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="all">Alle Teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="hall-filter">Filter nach Halle:</label>
          <select
            id="hall-filter"
            value={selectedHall}
            onChange={(e) => setSelectedHall(e.target.value)}
          >
            <option value="all">Alle Hallen</option>
            {halls.map((hall) => (
              <option key={hall} value={hall}>
                {hall}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Klasse</th>
            <th>Home</th>
            <th>Away</th>
            <th>Halle</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {filteredGames.map((game) => (
            <tr key={game.id}>
              <td>{game.id}</td>
              <td>{game.class}</td>
              <td>{game.hometeam}</td>
              <td>{game.awayteam}</td>
              <td>{game.hall}</td>
              <td>
                {game.homescore}:{game.awayscore}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
