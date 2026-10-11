'use client';

import { useCallback, useMemo } from 'react';
import Spinner from './Spinner';
import StatusCard from './StatusCard';
import ConnectionBanner from './ConnectionBanner';
import EventCard from './EventCard';
import GameCard from './GameCard';
import SegmentedControl from './SegmentedControl';
import MeinTeamCard from './MeinTeamCard';
import NowLine from './NowLine';
import ScorerCard from './ScorerCard';
import SlotHeading from './SlotHeading';
import { Game, Team } from './types';
import { usePersistedState } from '@/lib/usePersistedState';
import { useNow } from '@/lib/useNow';
import { toMinutes } from '@/lib/gameStatus';
import { classOptions, hallOptions } from '@/lib/filterOptions';
import { playingTeamNames, type GameSides } from '@/lib/schedule';
import { groupBySlot, slotStatus } from '@/lib/slots';
import {
  formatRecord,
  getTeamOutlook,
  teamRecord,
  teamSchedule,
} from '@/lib/teamOutlook';

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

  // Class and hall filters. Events (Siegerehrung) happen outside the game
  // halls; keep them visible.
  const matchesFilters = useCallback(
    (game: Game) =>
      (activeHall === 'all' ||
        !!game.eventname ||
        game.location === activeHall) &&
      (activeClass === 'all' || game.class === activeClass),
    [activeHall, activeClass],
  );
  const filteredGames = useMemo(
    () => games.filter(matchesFilters),
    [games, matchesFilters],
  );

  // Team view: the team's games, scorer duties and events, under the class
  // and hall filters. The "Mein Team" card ignores the filters.
  const teamEntries = useMemo(
    () =>
      activeTeam === 'all'
        ? []
        : teamSchedule(games, sides, activeTeam).filter((e) =>
            matchesFilters(e.game),
          ),
    [games, sides, activeTeam, matchesFilters],
  );
  const outlook = useMemo(
    () =>
      activeTeam !== 'all' && now
        ? getTeamOutlook(games, sides, activeTeam, now)
        : null,
    [games, sides, activeTeam, now],
  );
  const record = useMemo(
    () =>
      activeTeam === 'all'
        ? null
        : formatRecord(
            teamRecord(
              games,
              teams,
              activeTeam,
              activeClass === 'all'
                ? undefined
                : (activeClass as Game['class']),
            ),
          ),
    [games, teams, activeTeam, activeClass],
  );

  // Index of the first upcoming entry, if there are earlier ones before it.
  // The "now" line is drawn right above it.
  const nowIndex = useMemo(() => {
    if (!now) return -1;
    const i = teamEntries.findIndex(
      (e) => toMinutes(e.game.time) > toMinutes(now),
    );
    return i > 0 ? i : -1;
  }, [teamEntries, now]);

  // All-teams view: games grouped by start time, the "now" line above the
  // first slot that starts after now (same rule as nowIndex).
  const slots = useMemo(() => groupBySlot(filteredGames), [filteredGames]);
  const nowSlotIndex = useMemo(() => {
    if (!now) return -1;
    const i = slots.findIndex((slot) => toMinutes(slot.time) > toMinutes(now));
    return i > 0 ? i : -1;
  }, [slots, now]);

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
      {activeTeam === 'all' && <div className="divider"></div>}
      {activeTeam !== 'all' &&
        outlook &&
        now &&
        !loading &&
        games.length > 0 && (
          <div className="mt-5">
            <MeinTeamCard
              team={activeTeam}
              outlook={outlook}
              sides={sides}
              now={now}
            />
          </div>
        )}

      {/* No results message */}
      {loading && <Spinner />}
      {!loading &&
        !error &&
        (activeTeam === 'all' ? filteredGames : teamEntries).length === 0 && (
          <StatusCard>Keine Spiele gefunden. Passe die Filter an.</StatusCard>
        )}

      {activeTeam === 'all' ? (
        /* Games by time slot (design: SpielplanAlle) */
        <section
          aria-label="Spiele nach Uhrzeit"
          className="flex flex-col gap-[18px]"
        >
          {slots.map((slot, index) => (
            <div key={slot.time} className="flex flex-col gap-2">
              {index === nowSlotIndex && now && <NowLine now={now} />}
              <SlotHeading
                time={slot.time.slice(0, 5)}
                status={slotStatus(slot, now)}
              />
              {slot.games.map((game) =>
                game.eventname ? (
                  <EventCard key={game.id} game={game} showTime={false} />
                ) : (
                  <GameCard
                    key={game.id}
                    game={game}
                    sides={sides.get(game.id)}
                    now={now}
                    showTime={false}
                    showClass
                    showScorer
                  />
                ),
              )}
            </div>
          ))}
        </section>
      ) : (
        /* The team's games and scorer duties (design: Main) */
        <section
          aria-label={`Spiele von ${activeTeam}`}
          className="flex flex-col gap-2.5 pt-5"
        >
          {teamEntries.length > 0 && (
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="min-w-0 font-display text-[22px] font-bold tracking-[0.4px] uppercase">
                Alle Spiele · {activeTeam}
              </h2>
              <span className="shrink-0 text-sm text-muted">{record}</span>
            </div>
          )}
          {teamEntries.map(({ kind, game }, index) => (
            <div key={game.id}>
              {index === nowIndex && now && <NowLine now={now} />}
              {kind === 'event' ? (
                <EventCard game={game} />
              ) : kind === 'scorer' ? (
                <ScorerCard game={game} sides={sides.get(game.id)} />
              ) : (
                <GameCard
                  game={game}
                  sides={sides.get(game.id)}
                  now={now}
                  highlight={game === outlook?.next ? 'next' : undefined}
                />
              )}
            </div>
          ))}
        </section>
      )}
    </>
  );
}
