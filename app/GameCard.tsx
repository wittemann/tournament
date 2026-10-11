import ClassTag from './ClassTag';
import { Game } from './types';
import { gameState } from '@/lib/gameStatus';
import type { GameSides, Side } from '@/lib/schedule';

/** Red dot + "läuft", the design's marker for a running game. */
function LiveMarker() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-live">
      <span className="size-2 rounded-full bg-live" aria-hidden="true" />
      läuft
    </span>
  );
}

/**
 * One side of the game: team name (or the placeholder of an unresolved
 * placement side) and its score, "–" until a result is entered.
 */
function SideRow({
  side,
  score,
  played,
  winner,
}: {
  side: Side | undefined;
  score: number | null;
  played: boolean;
  winner: boolean;
}) {
  const unresolved = !side?.team;
  const tone = winner
    ? 'font-bold'
    : played
      ? 'text-muted'
      : unresolved
        ? 'font-medium text-muted'
        : 'font-semibold';
  return (
    <div className={`flex items-baseline justify-between gap-2 ${tone}`}>
      <span className="min-w-0">
        {winner && <span className="sr-only">Sieger: </span>}
        {side?.team ?? side?.ref}
        {side?.team && side.ref && (
          <>
            {' '}
            <span className="ml-1 text-xs font-normal text-muted">
              {side.ref}
            </span>
          </>
        )}
      </span>
      {score != null ? (
        <span className="font-display text-xl leading-none">
          <span className="sr-only">Punkte: </span>
          {score}
        </span>
      ) : (
        <span className="text-faint font-normal">
          <span aria-hidden="true">–</span>
          <span className="sr-only">kein Ergebnis</span>
        </span>
      )}
    </div>
  );
}

/**
 * A game in the schedule (docs/design/README.md "Game card"). Event rows
 * (eventname) are not games and need their own card.
 *
 * - showTime (default): time and hall in a fixed left column, for lists of
 *   single games (team view). Off for lists grouped by time slot, where the
 *   hall moves into the top row next to the class tag and "läuft" moves
 *   to the slot heading (the card keeps its red outline).
 * - showClass / showScorer: class tag and "Scorer: …" in the top row
 *   (all-teams view).
 * - highlight 'next': green outline for the selected team's next game. A
 *   running game keeps its red outline instead.
 */
export default function GameCard({
  game,
  sides,
  now,
  highlight,
  showTime = true,
  showClass = false,
  showScorer = false,
}: {
  game: Game;
  sides: GameSides | undefined;
  /** "HH:MM" from useNow, null before mount. */
  now: string | null;
  highlight?: 'next';
  showTime?: boolean;
  showClass?: boolean;
  showScorer?: boolean;
}) {
  const { phase, winner } = gameState(game, now);
  const running = phase === 'running';
  const played = phase === 'played';
  const scorer = showScorer ? game.scorer : null;
  const showMeta = !showTime || showClass || scorer;

  const outline = running
    ? 'ring-2 ring-inset ring-live'
    : highlight === 'next'
      ? 'ring-2 ring-primary'
      : '';

  return (
    <article
      className={`flex items-center gap-3.5 rounded-game bg-base-100 px-3.5 py-3 ${outline}`}
    >
      {showTime && (
        <div className="flex w-[58px] shrink-0 flex-col gap-0.5">
          <div
            className={`font-display text-[22px] leading-none font-bold ${played ? 'text-muted' : ''}`}
          >
            {game.time.slice(0, 5)}
          </div>
          <div
            className={`text-[13px] ${highlight === 'next' && !running ? 'font-semibold' : 'text-muted'}`}
          >
            {game.location}
          </div>
          {running && <LiveMarker />}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-base">
        {showMeta && (
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            {!showTime && (
              <span className="font-semibold">{game.location}</span>
            )}
            {showClass && <ClassTag cls={game.class} />}
            {/* The slot heading shows "läuft"; the card only has its red outline. */}
            {!showTime && running && <span className="sr-only">läuft</span>}
            {scorer && <span className="ml-auto">Scorer: {scorer}</span>}
          </div>
        )}
        {game.label && (
          <div className="text-xs font-bold tracking-[0.6px] text-muted uppercase">
            {game.label}
          </div>
        )}
        <SideRow
          side={sides?.home}
          score={game.homescore}
          played={played}
          winner={winner === 'home'}
        />
        <SideRow
          side={sides?.away}
          score={game.awayscore}
          played={played}
          winner={winner === 'away'}
        />
      </div>
    </article>
  );
}
