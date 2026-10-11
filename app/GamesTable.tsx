'use client';

import { useMemo } from 'react';
import Spinner from './Spinner';
import StatusCard from './StatusCard';
import ConnectionBanner from './ConnectionBanner';
import EventCard from './EventCard';
import GameCard from './GameCard';
import SegmentedControl from './SegmentedControl';
import NowLine from './NowLine';
import { Game, Team } from './types';
import { usePersistedState } from '@/lib/usePersistedState';
import { useNow } from '@/lib/useNow';
import { toMinutes } from '@/lib/gameStatus';
import { classOptions, hallOptions } from '@/lib/filterOptions';
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

  const classChoices = useMemo(() => classOptions(games), [games]);
  const hallChoices = useMemo(() => hallOptions(games), [games]);
  // A remembered class or hall that is no longer offered counts as "all"
  // (storage is left untouched, like for the team).
  const activeClass = classChoices.some((o) => o.value === selectedClass)
    ? selectedClass
    : 'all';
  const activeHall = hallChoices.some((o) => o.value === selectedHall)
    ? selectedHall
    : 'all';

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
      // Events (Siegerehrung) happen outside the game halls; keep them visible.
      const hallMatch =
        activeHall === 'all' ||
        !!game.eventname ||
        game.location === activeHall;
      const classMatch = activeClass === 'all' || game.class === activeClass;
      return teamMatch && hallMatch && classMatch;
    });
  }, [games, sides, activeTeam, activeHall, activeClass]);

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
      {/* Main control: "Mein Team" (design: Main / SpielplanAlle) */}
      <label htmlFor="team-filter" className="mb-4 flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Mein Team
        </span>
        <span className="relative block">
          <select
            id="team-filter"
            value={activeTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className={`h-12 w-full appearance-none rounded-control border-[1.5px] bg-base-100 pr-9 pl-3.5 text-[17px] font-semibold text-base-content ${
              activeTeam === 'all' ? 'border-primary' : 'border-faint'
            }`}
          >
            <option value="all">
              {activeTeam === 'all'
                ? 'Team wählen – nächstes Spiel sehen'
                : 'Alle Teams'}
            </option>
            {teamNames.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </label>

      <div className="flex flex-col gap-3">
        <SegmentedControl
          label="Klasse"
          options={[{ value: 'all', label: 'Alle' }, ...classChoices]}
          value={activeClass}
          onChange={setSelectedClass}
        />
        <SegmentedControl
          label="Halle"
          options={[
            { value: 'all', label: 'Alle', ariaLabel: 'Alle Hallen' },
            ...hallChoices,
          ]}
          value={activeHall}
          onChange={setSelectedHall}
        />
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
