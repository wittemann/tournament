'use client';

import { useState, useMemo, useEffect } from 'react';

type Game = {
  id: number;
  time: string;
  class: string;
  hometeam: string;
  awayteam: string;
  hall: string;
  homescore: number;
  awayscore: number;
};

export default function GamesTable({ games }: { games: Game[] }) {
  const [selectedTeam, setSelectedTeam] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedTeam') || 'all';
    }
    return 'all';
  });
  const [selectedHall, setSelectedHall] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedHall') || 'all';
    }
    return 'all';
  });
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedClass') || 'all';
    }
    return 'all';
  });

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedTeam', selectedTeam);
  }, [selectedTeam]);

  useEffect(() => {
    localStorage.setItem('selectedHall', selectedHall);
  }, [selectedHall]);

  useEffect(() => {
    localStorage.setItem('selectedClass', selectedClass);
  }, [selectedClass]);

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

  // Get unique classes from all games
  const classes = useMemo(() => {
    const classSet = new Set<string>();
    games.forEach((game) => {
      classSet.add(game.class);
    });
    return Array.from(classSet).sort();
  }, [games]);

  // Filter games based on selected team, hall, and class
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const teamMatch =
        selectedTeam === 'all' ||
        game.hometeam === selectedTeam ||
        game.awayteam === selectedTeam;
      const hallMatch = selectedHall === 'all' || game.hall === selectedHall;
      const classMatch =
        selectedClass === 'all' || game.class === selectedClass;
      return teamMatch && hallMatch && classMatch;
    });
  }, [games, selectedTeam, selectedHall, selectedClass]);

  return (
    <>
      <div>
        <div>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend">Klasse</legend>

            <select
              id="class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="select w-full"
            >
              <option value="all">Alle</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </fieldset>
        </div>
      </div>

      <div>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">Team</legend>

          <select
            id="team-filter"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="select w-full"
          >
            <option value="all">Alle</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </fieldset>
      </div>

      <div>
        <fieldset className="fieldset w-full">
          <legend className="fieldset-legend">Halle</legend>

          <select
            id="hall-filter"
            value={selectedHall}
            onChange={(e) => setSelectedHall(e.target.value)}
            className="select w-full"
          >
            <option value="all">Alle</option>
            {halls.map((hall) => (
              <option key={hall} value={hall}>
                {hall}
              </option>
            ))}
          </select>
        </fieldset>
      </div>
      <div className="divider"></div>

      {/* No results message */}
      {filteredGames.length === 0 && (
        <div className="alert alert-info alert-soft">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            Keine Spiele gefunden.
            <br />
            Bitte passen Sie die Filter an.
          </span>
        </div>
      )}

      {/* Mobile card layout */}
      <div className="block lg:hidden space-y-3">
        {filteredGames.map((game, index) => {
          const currentTime = new Date();
          const currentTimeStr = `${String(currentTime.getHours()).padStart(
            2,
            '0'
          )}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

          // Check if we need to show the current time divider
          const showTimeDivider = (() => {
            if (index === 0) return false;

            const prevGame = filteredGames[index - 1];
            const prevGameTime = prevGame.time;
            const currentGameTime = game.time;

            // Compare times as strings (HH:MM format works for string comparison)
            return (
              prevGameTime < currentTimeStr && currentGameTime >= currentTimeStr
            );
          })();

          return (
            <div key={game.id}>
              {showTimeDivider && (
                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 h-0.5 bg-red-600"></div>
                  <span className="text-red-600 font-semibold text-sm whitespace-nowrap">
                    {currentTimeStr} Uhr
                  </span>
                  <div className="flex-1 h-0.5 bg-red-600"></div>
                </div>
              )}
              <div className="card bg-base-200 shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="badge badge-sm">#{game.id}</span>
                  <span className="text-sm opacity-70">{game.time} Uhr</span>
                </div>
                <div
                  className={`badge badge-outline mb-3 ${
                    game.class === 'Schüler' ? 'bg-green-100' : 'bg-amber-100'
                  }`}
                >
                  {game.class}
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{game.hometeam}</span>
                  {game.homescore !== undefined && (
                    <span className="text-lg font-bold">
                      {game.homescore}:{game.awayscore}
                    </span>
                  )}
                  <span className="font-semibold">{game.awayteam}</span>
                </div>
                <div className="text-sm opacity-70 text-center">
                  Halle: {game.hall}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>#</th>
              <th>Zeit</th>
              <th>Halle</th>
              <th>Klasse</th>
              <th>Home</th>
              <th>Away</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredGames.map((game) => (
              <tr key={game.id}>
                <td>{game.id}</td>
                <td>{game.time} Uhr</td>
                <td>{game.hall}</td>
                <td>
                  <span
                    className={`badge badge-outline ${
                      game.class === 'Schüler' ? 'bg-green-100' : 'bg-amber-100'
                    }`}
                  >
                    {game.class}
                  </span>
                </td>
                <td>{game.hometeam}</td>
                <td>{game.awayteam}</td>
                <td>
                  {game.homescore != undefined
                    ? `${game.homescore}:${game.awayscore}`
                    : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
