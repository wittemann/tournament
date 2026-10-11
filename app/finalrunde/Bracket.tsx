import type { ReactNode } from 'react';
import StatusCard from '../StatusCard';
import { MINE_BG, MINE_STRIP, MeinTeamTag } from '../MeinTeam';
import type { Game } from '../types';
import { seedTag, type Finalrunde } from '@/lib/bracket';
import { gameState, type GameState } from '@/lib/gameStatus';
import { shortLabel, type GameSides, type Side } from '@/lib/schedule';
import type { PlacementEntry } from '@/lib/standings';

// Finalrunde as in the design (docs/design/screens/Finalrunde.dc.html):
// semifinals in two columns joined to the dark final card, the 3rd-place
// game, the other placement games as a list and the Endstand. With
// quarterfinals (FinalrundeVF.dc.html) each column stacks its two
// quarterfinals above its semifinal, and the quarterfinal losers' games get
// their own "Platz 5–8" block.

type SidesOf = (game: Game) => GameSides | undefined;

interface Ctx {
  sidesOf: SidesOf;
  now: string | null;
  selectedTeam: string;
}

const isMine = (side: Side | undefined, selectedTeam: string) =>
  !!side?.team && side.team === selectedTeam;

/** Team name, or the placeholder ("Sieger HF 2") while the side is open. */
const nameOf = (side: Side | undefined) => side?.team ?? side?.ref ?? '–';

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[22px] font-bold text-muted uppercase">
      {children}
    </h2>
  );
}

function Score({
  value,
  className = '',
}: {
  value: number | null;
  className?: string;
}) {
  return value != null ? (
    <span className={`font-display text-xl leading-none ${className}`}>
      <span className="sr-only">Punkte: </span>
      {value}
    </span>
  ) : (
    <span className={`font-normal opacity-70 ${className}`}>
      <span aria-hidden="true">–</span>
      <span className="sr-only">kein Ergebnis</span>
    </span>
  );
}

/** Font weight / colour of one side, like GameCard: winner bold, played loser muted. */
function tone(state: GameState, won: boolean, side: Side | undefined) {
  if (won) return 'font-bold';
  if (state.phase === 'played') return 'font-medium text-muted';
  return side?.team ? 'font-semibold' : 'font-medium text-muted';
}

/** "HF 1 · 17:00 · Halle 1", with "läuft" instead of the time while running. */
function metaLine(game: Game, state: GameState, label: string | null) {
  return [
    label,
    state.phase === 'running' ? 'läuft' : game.time.slice(0, 5),
    game.location,
  ]
    .filter(Boolean)
    .join(' · ');
}

function SemiCard({
  game,
  ctx,
  compact = false,
}: {
  game: Game;
  ctx: Ctx;
  /** Quarterfinal card inside its column's grey group box. */
  compact?: boolean;
}) {
  const state = gameState(game, ctx.now);
  const seeded = !!(seedTag(game.home_ref) || seedTag(game.away_ref));
  const sides = ctx.sidesOf(game);
  const running = state.phase === 'running';
  const rows = [
    {
      side: sides?.home,
      ref: game.home_ref,
      score: game.homescore,
      won: state.winner === 'home',
    },
    {
      side: sides?.away,
      ref: game.away_ref,
      score: game.awayscore,
      won: state.winner === 'away',
    },
  ];
  return (
    <article
      className={`flex min-w-0 flex-col bg-base-100 ${compact ? 'gap-1 rounded-[11px] px-2 py-2' : 'gap-1.5 rounded-game px-3 py-2.5'} ${running ? 'ring-2 ring-inset ring-live' : ''}`}
    >
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold ${running ? 'font-bold text-live' : 'text-muted'}`}
      >
        {running && (
          <span
            className="size-[7px] shrink-0 rounded-full bg-live"
            aria-hidden="true"
          />
        )}
        {metaLine(game, state, game.label ? shortLabel(game.label) : null)}
      </div>
      {rows.map(({ side, ref, score, won }, i) => {
        const mine = isMine(side, ctx.selectedTeam);
        return (
          <div
            key={i}
            className={`-mx-1.5 flex items-center rounded-md px-1.5 text-[15px] ${compact ? 'gap-1' : 'gap-1.5'} ${tone(state, won, side)} ${mine ? `${MINE_BG} ${MINE_STRIP} pl-2.5` : ''}`}
          >
            {/* The placeholder ("Seed 1", "1. Gruppe A") says the same to screen readers. */}
            {seeded && (
              <span
                aria-hidden="true"
                className="w-[18px] shrink-0 text-xs font-normal text-muted"
              >
                {seedTag(ref)}
              </span>
            )}
            <span className="min-w-0 flex-1 break-words hyphens-auto">
              {won && <span className="sr-only">Sieger: </span>}
              {nameOf(side)}
              {side?.team && side.ref && (
                <span className="sr-only"> ({side.ref})</span>
              )}
              {mine && <span className="sr-only"> (Mein Team)</span>}
            </span>
            <Score value={score} />
          </div>
        );
      })}
    </article>
  );
}

/** One column of the quarterfinal layout: two quarterfinals above their semifinal. */
function QuarterColumn({ rounds, ctx }: { rounds: Game[][]; ctx: Ctx }) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-col gap-1.5 rounded-card bg-base-300 p-1.5">
        {rounds[0].map((game) => (
          <SemiCard key={game.id} game={game} ctx={ctx} compact />
        ))}
      </div>
      {/* Grows when the other column's quarterfinals are taller, so both semifinals line up. */}
      <div
        aria-hidden="true"
        className="min-h-4 w-0.5 flex-1 self-center bg-faint"
      />
      <SemiCard game={rounds[1][0]} ctx={ctx} />
    </div>
  );
}

/** Two semifinals joined to the final below by CSS borders (design). */
function Connector() {
  return (
    <div aria-hidden="true" className="grid h-[22px] grid-cols-2">
      <div className="ml-[50%] rounded-br-[10px] border-r-2 border-b-2 border-faint" />
      <div className="mr-[50%] rounded-bl-[10px] border-b-2 border-l-2 border-faint" />
    </div>
  );
}

function Trophy() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-gold"
    >
      <path d="M8 4h8v5a4 4 0 01-8 0V4z" />
      <path d="M8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4" />
      <path d="M12 13v4M9 20h6" />
    </svg>
  );
}

function FinalCard({ game, ctx }: { game: Game; ctx: Ctx }) {
  const state = gameState(game, ctx.now);
  const sides = ctx.sidesOf(game);
  const running = state.phase === 'running';
  const rows = [
    { side: sides?.home, score: game.homescore, won: state.winner === 'home' },
    { side: sides?.away, score: game.awayscore, won: state.winner === 'away' },
  ];
  return (
    <article
      className={`flex flex-col gap-2 rounded-card bg-neutral px-4 py-3.5 text-neutral-content ${running ? 'ring-2 ring-inset ring-live' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 text-[13px] font-semibold opacity-85">
        <span>{metaLine(game, state, null)}</span>
        <Trophy />
      </div>
      {rows.map(({ side, score, won }, i) => {
        const open = !side?.team;
        const weight = won
          ? 'font-bold'
          : state.phase === 'played' || open
            ? 'font-medium opacity-75'
            : 'font-bold';
        return (
          <div key={i} className={`flex items-center gap-2 text-lg ${weight}`}>
            <span className="min-w-0 flex-1 break-words">
              {won && <span className="sr-only">Sieger: </span>}
              {nameOf(side)}
              {isMine(side, ctx.selectedTeam) && (
                <>
                  {' '}
                  <MeinTeamTag />
                </>
              )}
            </span>
            <Score value={score} />
          </div>
        );
      })}
    </article>
  );
}

/** "Home – Away" with the winner bold and open sides as muted placeholders. */
function Pairing({ game, ctx }: { game: Game; ctx: Ctx }) {
  const state = gameState(game, ctx.now);
  const sides = ctx.sidesOf(game);
  const played = state.phase === 'played';
  const side = (s: Side | undefined, won: boolean) => (
    <span
      className={
        won
          ? 'font-bold'
          : played
            ? 'font-normal'
            : s?.team
              ? ''
              : 'font-normal text-muted'
      }
    >
      {won && <span className="sr-only">Sieger: </span>}
      {nameOf(s)}
    </span>
  );
  return (
    <>
      {side(sides?.home, state.winner === 'home')}
      <span className="font-normal text-muted"> – </span>
      {side(sides?.away, state.winner === 'away')}
    </>
  );
}

const hasMine = (game: Game, ctx: Ctx) => {
  const sides = ctx.sidesOf(game);
  return (
    isMine(sides?.home, ctx.selectedTeam) ||
    isMine(sides?.away, ctx.selectedTeam)
  );
};

/** Result "12:7", "läuft", or time and hall. */
function Outcome({ game, ctx }: { game: Game; ctx: Ctx }) {
  const state = gameState(game, ctx.now);
  if (state.phase === 'played')
    return (
      <span className="shrink-0 font-display text-lg font-bold">
        {game.homescore ?? '–'}:{game.awayscore ?? '–'}
      </span>
    );
  if (state.phase === 'running')
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-live">
        <span className="size-2 rounded-full bg-live" aria-hidden="true" />
        läuft
      </span>
    );
  return (
    <span className="shrink-0 text-right text-[13px] text-muted">
      {game.time.slice(0, 5)}
      <br />
      {game.location}
    </span>
  );
}

function ThirdPlaceCard({ game, ctx }: { game: Game; ctx: Ctx }) {
  const state = gameState(game, ctx.now);
  const mine = hasMine(game, ctx);
  return (
    <article
      className={`flex items-center gap-3 rounded-game px-3.5 py-2.5 ${mine ? `${MINE_BG} ${MINE_STRIP}` : 'bg-base-100'} ${state.phase === 'running' ? 'ring-2 ring-inset ring-live' : ''}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="text-xs font-bold tracking-[0.6px] text-muted uppercase">
          {[
            game.label ? shortLabel(game.label) : null,
            game.time.slice(0, 5),
            game.location,
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
        <div className="text-base font-semibold">
          <Pairing game={game} ctx={ctx} />
          {mine && (
            <>
              {' '}
              <MeinTeamTag />
            </>
          )}
        </div>
      </div>
      {state.phase !== 'upcoming' && <Outcome game={game} ctx={ctx} />}
    </article>
  );
}

function PlacementList({ games, ctx }: { games: Game[]; ctx: Ctx }) {
  return (
    <ul className="overflow-hidden rounded-card bg-base-100">
      {games.map((game, i) => {
        const mine = hasMine(game, ctx);
        return (
          <li
            key={game.id}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-line' : ''} ${mine ? `${MINE_BG} ${MINE_STRIP}` : ''}`}
          >
            <span className="w-[76px] shrink-0 font-display text-lg leading-tight font-bold hyphens-auto [overflow-wrap:anywhere]">
              {game.label ? shortLabel(game.label) : null}
            </span>
            <span className="min-w-0 flex-1 text-[15px]">
              <Pairing game={game} ctx={ctx} />
              {mine && (
                <>
                  {' '}
                  <MeinTeamTag />
                </>
              )}
            </span>
            <Outcome game={game} ctx={ctx} />
          </li>
        );
      })}
    </ul>
  );
}

function Endstand({
  ranking,
  hasFinal,
  selectedTeam,
}: {
  ranking: PlacementEntry[] | null;
  hasFinal: boolean;
  selectedTeam: string;
}) {
  if (!ranking)
    return (
      <div className="flex items-center gap-2.5 rounded-card bg-base-100 px-4 py-3.5 text-[15px] text-muted">
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        {hasFinal
          ? 'Wird nach dem Finale angezeigt.'
          : 'Wird angezeigt, sobald alle Plätze feststehen.'}
      </div>
    );
  return (
    <ol className="overflow-hidden rounded-card bg-base-100">
      {ranking.map((entry, i) => {
        const mine = entry.team !== null && entry.team === selectedTeam;
        return (
          <li
            key={entry.place}
            className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-line' : ''} ${mine ? `${MINE_BG} ${MINE_STRIP}` : ''}`}
          >
            <span className="w-7 shrink-0 font-display text-lg font-bold">
              {entry.place}
              <span className="sr-only">.</span>
            </span>
            <span
              className={`min-w-0 flex-1 ${entry.team ? 'font-semibold' : 'text-faint'}`}
            >
              {entry.team ?? (
                <>
                  <span aria-hidden="true">–</span>
                  <span className="sr-only">noch offen</span>
                </>
              )}
              {mine && (
                <>
                  {' '}
                  <MeinTeamTag />
                </>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Bracket({
  finalrunde: { bracket, placementGames, ranking, hasFinal },
  sidesOf,
  now,
  selectedTeam,
}: {
  finalrunde: Finalrunde<Game>;
  sidesOf: SidesOf;
  now: string | null;
  /** Persisted "Mein Team" name; "all" marks nothing. */
  selectedTeam: string;
}) {
  const ctx: Ctx = { sidesOf, now, selectedTeam };
  // Round names come from the game labels; neutral fallbacks without one.
  const quarters = bracket?.rounds.length === 2;
  const rounds = (bracket?.rounds ?? []).map(
    (name, i) =>
      name ??
      (quarters ? ['Erste Runde', 'Zweite Runde'][i] : 'Vor dem Finale'),
  );
  const finalName = bracket?.final.label ?? 'Finale';
  const losers = bracket?.losers;
  if (!bracket && placementGames.length === 0)
    return <StatusCard>Für diese Klasse gibt es keine Finalrunde.</StatusCard>;

  return (
    <div className="space-y-6">
      {bracket && (
        <section
          aria-label={`${rounds.join(', ')} und ${finalName}`}
          className="flex flex-col gap-2.5"
        >
          <SectionHeading>{rounds[0]}</SectionHeading>
          <div className="grid grid-cols-2 gap-2.5">
            {bracket.halves.map((half, i) =>
              quarters ? (
                <QuarterColumn key={i} rounds={half.rounds} ctx={ctx} />
              ) : (
                <SemiCard key={i} game={half.rounds[0][0]} ctx={ctx} />
              ),
            )}
          </div>
          <Connector />
          <SectionHeading>{finalName}</SectionHeading>
          <FinalCard game={bracket.final} ctx={ctx} />
          {bracket.thirdPlace && (
            <ThirdPlaceCard game={bracket.thirdPlace} ctx={ctx} />
          )}
        </section>
      )}
      {losers && (
        <section
          aria-label={`Platz ${losers.from} bis ${losers.to}`}
          className="flex flex-col gap-2.5"
        >
          <SectionHeading>
            Platz {losers.from}–{losers.to}
          </SectionHeading>
          <PlacementList games={losers.games} ctx={ctx} />
        </section>
      )}
      {placementGames.length > 0 && (
        <section
          aria-label="Platzierungsspiele"
          className="flex flex-col gap-2.5"
        >
          <SectionHeading>Platzierungsspiele</SectionHeading>
          <PlacementList games={placementGames} ctx={ctx} />
        </section>
      )}
      <section aria-label="Endstand" className="flex flex-col gap-2.5">
        <SectionHeading>Endstand</SectionHeading>
        <Endstand
          ranking={ranking}
          hasFinal={hasFinal}
          selectedTeam={selectedTeam}
        />
      </section>
    </div>
  );
}
