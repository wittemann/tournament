'use client';

import { useMemo } from 'react';
import Spinner from './Spinner';
import StatusCard from './StatusCard';
import ConnectionBanner from './ConnectionBanner';
import EventCard from './EventCard';
import GameCard from './GameCard';
import NowLine from './NowLine';
import { Game, Team } from './types';
import { usePersistedState } from '@/lib/usePersistedState';
import { useNow } from '@/lib/useNow';
import { toMinutes } from '@/lib/gameStatus';
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
    const i = filteredGames.findIndex(
      (game) => toMinutes(game.time) > toMinutes(now),
    );
    return i > 0 ? i : -1;
  }, [filteredGames, now]);

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
        <StatusCard>Keine Spiele gefunden. Passe die Filter an.</StatusCard>
      )}

      {/* Game cards */}
      <div className="space-y-3">
        {filteredGames.map((game, index) => {
          return (
            <div key={game.id}>
              {index === nowIndex && now && <NowLine now={now} />}
              {game.eventname ? (
                <EventCard game={game} />
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
