'use client';

import { Fragment, useMemo } from 'react';
import { Game } from './types';
import { usePersistedState } from '@/lib/usePersistedState';
import { useNow } from '@/lib/useNow';

export default function GamesTable({ games }: { games: Game[] }) {
  const [selectedTeam, setSelectedTeam] = usePersistedState(
    'selectedTeam',
    'all',
  );
  const [selectedHall, setSelectedHall] = usePersistedState(
    'selectedHall',
    'all',
  );
  const [selectedClass, setSelectedClass] = usePersistedState(
    'selectedClass',
    'all',
  );
  const now = useNow();

  // Get unique teams from all games
  const teams = useMemo(() => {
    const teamSet = new Set<string>();
    games.forEach((game) => {
      if (game.hometeam) teamSet.add(game.hometeam);
      if (game.awayteam) teamSet.add(game.awayteam);
      if (game.scorer) teamSet.add(game.scorer);
    });
    return Array.from(teamSet).sort();
  }, [games]);

  // Get unique halls from all games
  const halls = useMemo(() => {
    const hallSet = new Set<string>();
    games.forEach((game) => {
      hallSet.add(game.location);
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
        game.awayteam === selectedTeam ||
        game.scorer === selectedTeam;
      const hallMatch =
        selectedHall === 'all' || game.location === selectedHall;
      const classMatch =
        selectedClass === 'all' || game.class === selectedClass;
      return teamMatch && hallMatch && classMatch;
    });
  }, [games, selectedTeam, selectedHall, selectedClass]);

  // Index of the first upcoming game, if there are earlier games before it.
  // The "now" line is drawn right above it.
  const nowIndex = useMemo(() => {
    if (!now) return -1;
    const i = filteredGames.findIndex((game) => game.time.slice(0, 5) >= now);
    return i > 0 ? i : -1;
  }, [filteredGames, now]);

  const nowLine = (
    <div className="flex items-center gap-2 my-4">
      <div className="flex-1 h-0.5 bg-red-600"></div>
      <span className="text-red-600 font-semibold text-sm whitespace-nowrap">
        {now} Uhr
      </span>
      <div className="flex-1 h-0.5 bg-red-600"></div>
    </div>
  );

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
          <legend className="fieldset-legend">Ort</legend>

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
          return (
            <div key={game.id}>
              {index === nowIndex && nowLine}
              <div className="card bg-base-200 shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <span className="badge badge-sm">#{game.id}</span>
                    <span
                      className={`badge badge-outline badge-sm ${
                        game.class === 'Schüler'
                          ? 'bg-green-100 dark:bg-green-900 dark:text-green-200'
                          : 'bg-amber-100 dark:bg-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {game.class}
                    </span>
                  </div>
                  <span className="text-base">
                    {game.time.slice(0, 5)} Uhr | {game.location}
                  </span>
                </div>
                {game.eventname ? (
                  <div className="text-center font-semibold text-lg py-2">
                    {game.eventname}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 items-center gap-2 mb-2">
                      <span className="font-semibold text-right">
                        {game.hometeam}
                      </span>
                      {game.homescore != null && (
                        <span className="text-lg font-bold text-center">
                          {game.homescore}:{game.awayscore}
                        </span>
                      )}
                      <span className="font-semibold text-left">
                        {game.awayteam}
                      </span>
                    </div>
                    {game.scorer && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Scorer: {game.scorer}
                      </div>
                    )}
                  </>
                )}
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
              <th># / Klasse</th>
              <th>Zeit / Ort</th>
              <th>Home</th>
              <th>Away</th>
              <th>Score</th>
              <th>Scorer</th>
            </tr>
          </thead>
          <tbody>
            {filteredGames.map((game, index) => (
              <Fragment key={game.id}>
                {index === nowIndex && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      {nowLine}
                    </td>
                  </tr>
                )}
                <tr>
                  <td>
                    <div className="flex gap-2 items-center">
                      <span>#{game.id}</span>
                      <span
                        className={`badge badge-outline badge-sm ${
                          game.class === 'Schüler'
                            ? 'bg-green-100 dark:bg-green-900 dark:text-green-200'
                            : 'bg-amber-100 dark:bg-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {game.class}
                      </span>
                    </div>
                  </td>
                  <td className="text-base">
                    {game.time.slice(0, 5)} Uhr | {game.location}
                  </td>
                  {game.eventname ? (
                    <td colSpan={4} className="font-semibold text-center">
                      {game.eventname}
                    </td>
                  ) : (
                    <>
                      <td>{game.hometeam}</td>
                      <td>{game.awayteam}</td>
                      <td>
                        {game.homescore != null
                          ? `${game.homescore}:${game.awayscore}`
                          : ''}
                      </td>
                      <td>{game.scorer}</td>
                    </>
                  )}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
