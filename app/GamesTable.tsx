'use client';

import { useMemo } from 'react';
import Spinner from './Spinner';
import ConnectionBanner from './ConnectionBanner';
import ClassTag from './ClassTag';
import GameCard from './GameCard';
import { Game, Team } from './types';
import { usePersistedState } from '@/lib/usePersistedState';
import { useNow } from '@/lib/useNow';
import { playingTeamNames, type GameSides } from '@/lib/schedule';

export default function GamesTable({
  games,
  teams,
  sides,
  loading,
  error,
}: {
  games: Game[];
  teams: Team[];
  /** Resolved sides per game id (see lib/schedule.ts gameSides). */
  sides: Map<number, GameSides>;
  /** True until the first games fetch finished; hides the empty message. */
  loading: boolean;
  /** True when data could not be loaded or the connection is down. */
  error: boolean;
}) {
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

  // Teams from the teams table that appear in some game
  const teamNames = useMemo(
    () => playingTeamNames(teams, games),
    [teams, games],
  );
  // A remembered team that is gone (new year, renamed) counts as "all".
  const activeTeam =
    teamNames.length === 0 || teamNames.includes(selectedTeam)
      ? selectedTeam
      : 'all';

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
      const side = sides.get(game.id);
      const teamMatch =
        activeTeam === 'all' ||
        game.hometeam === activeTeam ||
        game.awayteam === activeTeam ||
        side?.home.team === activeTeam ||
        side?.away.team === activeTeam ||
        game.scorer === activeTeam;
      const hallMatch =
        selectedHall === 'all' || game.location === selectedHall;
      const classMatch =
        selectedClass === 'all' || game.class === selectedClass;
      return teamMatch && hallMatch && classMatch;
    });
  }, [games, sides, activeTeam, selectedHall, selectedClass]);

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
      <ConnectionBanner show={error} />
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
            value={activeTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="select w-full"
          >
            <option value="all">Alle</option>
            {teamNames.map((team) => (
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
      {loading && <Spinner />}
      {!loading && !error && filteredGames.length === 0 && (
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

      {/* Game cards */}
      <div className="space-y-3">
        {filteredGames.map((game, index) => {
          return (
            <div key={game.id}>
              {index === nowIndex && nowLine}
              {game.eventname ? (
                <div className="rounded-game bg-base-100 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <ClassTag cls={game.class} />
                    <span className="text-base">
                      {game.time.slice(0, 5)} Uhr | {game.location}
                    </span>
                  </div>
                  <div className="text-center font-semibold text-lg py-2">
                    {game.eventname}
                  </div>
                </div>
              ) : (
                <GameCard
                  game={game}
                  sides={sides.get(game.id)}
                  now={now}
                  showClass
                  showScorer
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
