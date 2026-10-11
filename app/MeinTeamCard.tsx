import { Game } from './types';
import { SOON_WINDOW_MINUTES, isRunning, toMinutes } from '@/lib/gameStatus';
import type { GameSides } from '@/lib/schedule';
import type { TeamOutlook } from '@/lib/teamOutlook';

/** Clipboard icon of the scorer strip (design: Main.dc.html). */
function ScorerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

/** The other side of the team's game: resolved team or placeholder. */
function opponent(game: Game, sides: GameSides | undefined, team: string) {
  const home = sides?.home ?? { team: game.hometeam, ref: null };
  const away = sides?.away ?? { team: game.awayteam, ref: null };
  const other = home.team === team ? away : home;
  return other.team ?? other.ref ?? '–';
}

/**
 * The "Mein Team" card above the team's game list
 * (docs/specs/next-game-card.md, design: Main.dc.html). Ignores the class and
 * hall filters.
 *
 * Built in the design's style for the basic state: next game with big time
 * and hall, "in N Min." within SOON_WINDOW_MINUTES, amber scorer strip below.
 * The other states (MeinTeamZustaende.dc.html: running game, scorer duty
 * first, before the first game, all played) only get a minimal version here.
 */
export default function MeinTeamCard({
  team,
  outlook,
  sides,
  now,
}: {
  team: string;
  outlook: TeamOutlook<Game>;
  sides: Map<number, GameSides>;
  /** "HH:MM" from useNow. */
  now: string;
}) {
  const { current, next, scorerDuty, done } = outlook;

  if (done) {
    return (
      <section
        aria-label={`Mein Team: ${team}`}
        className="rounded-card bg-base-100 px-[18px] py-4 text-base font-semibold"
      >
        Alle Spiele gespielt.
      </section>
    );
  }

  // Running game first (minimal), else the next game.
  const game = current ?? next;
  const minutes = game ? toMinutes(game.time) - toMinutes(now) : 0;
  const dutyRunning = scorerDuty !== null && isRunning(scorerDuty, now);
  const dutyAfter =
    scorerDuty && game && toMinutes(scorerDuty.time) >= toMinutes(game.time);

  return (
    <section
      aria-label={`Mein Team: ${team}`}
      className="overflow-hidden rounded-card bg-primary text-primary-content"
    >
      {game && (
        <div className="flex flex-col gap-2.5 px-[18px] pt-4 pb-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[13px] font-bold tracking-[0.8px] uppercase opacity-85">
              {current ? 'Aktuelles Spiel' : 'Nächstes Spiel'}
            </div>
            {current ? (
              <div className="rounded-full bg-base-100 px-2.5 py-1 text-[13px] font-bold text-live">
                läuft
              </div>
            ) : (
              minutes <= SOON_WINDOW_MINUTES && (
                <div className="rounded-full bg-base-100 px-2.5 py-1 text-[13px] font-bold text-primary">
                  in {minutes} Min.
                </div>
              )
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <div className="font-display text-[52px] leading-none font-bold">
              {game.time.slice(0, 5)}
            </div>
            <div className="font-display text-[28px] leading-none font-semibold">
              {game.location}
            </div>
          </div>
          <div className="text-lg font-medium">
            {team} <span className="opacity-75">gegen</span>{' '}
            <strong className="font-bold">
              {opponent(game, sides.get(game.id), team)}
            </strong>
          </div>
        </div>
      )}
      {scorerDuty && (
        <div className="flex items-center gap-2.5 bg-scorer-bg px-[18px] py-3 text-[15px] text-scorer-ink">
          <ScorerIcon />
          <span>
            <strong className="font-bold">Scorer-Dienst</strong>
            {dutyRunning ? ' läuft' : dutyAfter ? ' danach' : ''}:{' '}
            <span className="whitespace-nowrap">
              {scorerDuty.time.slice(0, 5)} Uhr · {scorerDuty.location}
            </span>
          </span>
        </div>
      )}
    </section>
  );
}
