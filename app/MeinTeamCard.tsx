import Link from 'next/link';
import { Game } from './types';
import { SOON_WINDOW_MINUTES, isRunning, toMinutes } from '@/lib/gameStatus';
import type { GameSides } from '@/lib/schedule';
import {
  formatBilanz,
  formatDiff,
  type TeamOutlook,
  type TeamSummary,
} from '@/lib/teamOutlook';

/** Clipboard icon of the scorer blocks (design: Main.dc.html). */
function ScorerIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
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

function sideLabel(side: { team: string | null; ref: string | null }) {
  return side.team ?? side.ref ?? '–';
}

function sidesOf(game: Game, sides: GameSides | undefined) {
  return {
    home: sides?.home ?? { team: game.hometeam, ref: null },
    away: sides?.away ?? { team: game.awayteam, ref: null },
  };
}

/** The other side of the team's game: resolved team or placeholder. */
function opponent(game: Game, sides: GameSides | undefined, team: string) {
  const { home, away } = sidesOf(game, sides);
  return sideLabel(home.team === team ? away : home);
}

const SMALL_LABEL = 'text-[13px] font-bold tracking-[0.8px] uppercase';

/**
 * The "Mein Team" card above the team's game list
 * (docs/specs/next-game-card.md, design: Main.dc.html and
 * MeinTeamZustaende.dc.html). Ignores the class and hall filters.
 *
 * States: next game (basic), game running (red outline, next game below),
 * scorer duty first (amber block on top), before the first game ("Erstes
 * Spiel", no countdown), all played (white card with Bilanz, Diff, Platz).
 */
export default function MeinTeamCard({
  team,
  outlook,
  sides,
  summaries,
  waiting,
  now,
}: {
  team: string;
  outlook: TeamOutlook<Game>;
  sides: Map<number, GameSides>;
  /** Per class of the team, for the "all played" state. */
  summaries: TeamSummary[];
  /** Nothing left for now, but placement games are still to be drawn. */
  waiting: boolean;
  /** "HH:MM" from useNow. */
  now: string;
}) {
  const { current, next, scorerDuty, done, beforeFirst } = outlook;

  if (done && waiting) {
    return (
      <section
        aria-label={`Mein Team: ${team}`}
        className="flex flex-col gap-1 rounded-card bg-base-100 px-[18px] py-4 shadow-[inset_0_0_0_2px_var(--color-primary)]"
      >
        <div className="font-display text-2xl leading-[1.1] font-bold uppercase">
          Gruppenphase beendet
        </div>
        <div className="text-sm text-muted">
          Finalrunde folgt – Gegner stehen noch nicht fest.
        </div>
      </section>
    );
  }

  if (done) {
    const several = summaries.length > 1;
    return (
      <section
        aria-label={`Mein Team: ${team}`}
        className="overflow-hidden rounded-card bg-base-100 shadow-[inset_0_0_0_2px_var(--color-primary)]"
      >
        <div className="flex flex-col gap-3 px-[18px] py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-control bg-win-bg text-win-ink">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-[22px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="font-display text-2xl leading-[1.1] font-bold uppercase">
                Alle Spiele gespielt
              </div>
              <div className="text-sm text-muted">
                Danke fürs Mitspielen, {team}!
              </div>
            </div>
          </div>
          {summaries.map((s) => (
            <div key={s.cls} className="flex flex-col gap-2">
              {several && (
                <div className="text-xs font-bold tracking-[0.6px] text-muted uppercase">
                  {s.cls}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <Tile label="Bilanz" value={formatBilanz(s.record)} />
                <Tile
                  label="Diff"
                  value={formatDiff(s.diff)}
                  negative={s.diff < 0}
                />
                <Tile
                  label={s.place?.kind === 'group' ? 'Gr.-Platz' : 'Platz'}
                  value={s.place ? String(s.place.value) : '–'}
                />
              </div>
            </div>
          ))}
          <Link
            href="/standings"
            className="flex h-11 items-center justify-center rounded-control bg-primary text-[15px] font-bold text-primary-content"
          >
            Zur Tabelle
          </Link>
        </div>
      </section>
    );
  }

  const game = current ?? next;
  const minutes = game ? toMinutes(game.time) - toMinutes(now) : 0;
  const dutyRunning = scorerDuty !== null && isRunning(scorerDuty, now);
  const dutyMinutes = scorerDuty
    ? toMinutes(scorerDuty.time) - toMinutes(now)
    : 0;
  const dutyAfter =
    scorerDuty && game && toMinutes(scorerDuty.time) > toMinutes(game.time);
  // The duty is the team's next appointment: its block goes on top.
  const scorerFirst =
    scorerDuty !== null && !current && (dutyRunning || !game || !dutyAfter);

  const gameLabel = current
    ? 'Aktuelles Spiel'
    : beforeFirst
      ? 'Erstes Spiel'
      : 'Nächstes Spiel';

  if (scorerFirst && scorerDuty) {
    const duty = sidesOf(scorerDuty, sides.get(scorerDuty.id));
    return (
      <section
        aria-label={`Mein Team: ${team}`}
        className="overflow-hidden rounded-card bg-primary text-primary-content"
      >
        <div className="flex flex-col gap-1.5 bg-scorer-bg px-[18px] py-3.5 text-scorer-ink">
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center gap-2 ${SMALL_LABEL}`}>
              <ScorerIcon className="size-[18px] shrink-0" />
              {game ? 'Zuerst: Scorer-Dienst' : 'Scorer-Dienst'}
            </div>
            {(dutyRunning || dutyMinutes <= SOON_WINDOW_MINUTES) && (
              <div className="rounded-full bg-scorer-ink px-2.5 py-1 text-[13px] font-bold text-scorer-bg">
                {dutyRunning ? 'läuft' : `in ${dutyMinutes} Min.`}
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2.5">
            <div className="font-display text-4xl leading-none font-bold">
              {scorerDuty.time.slice(0, 5)}
            </div>
            <div className="font-display text-[22px] leading-none font-semibold">
              {scorerDuty.location}
            </div>
          </div>
          <div className="text-[15px]">
            {sideLabel(duty.home)} – {sideLabel(duty.away)}
          </div>
        </div>
        {game && (
          <div className="flex flex-col gap-1.5 px-[18px] py-3.5">
            <div className={`${SMALL_LABEL} opacity-85`}>{gameLabel}</div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <div className="font-display text-3xl leading-none font-bold">
                {game.time.slice(0, 5)}
              </div>
              <div className="font-display text-xl leading-none font-semibold">
                {game.location}
              </div>
              <div className="ml-1 text-base">
                <span className="opacity-75">gegen</span>{' '}
                <strong className="font-bold">
                  {opponent(game, sides.get(game.id), team)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      aria-label={`Mein Team: ${team}`}
      className={`overflow-hidden rounded-card bg-primary text-primary-content ${
        current ? 'shadow-[inset_0_0_0_3px_var(--color-live)]' : ''
      }`}
    >
      {game && (
        <div className="flex flex-col gap-2.5 px-[18px] pt-4 pb-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className={`${SMALL_LABEL} opacity-85`}>{gameLabel}</div>
            {current ? (
              <div className="flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 text-[13px] font-bold text-white">
                <span className="size-[7px] rounded-full bg-white" />
                läuft
              </div>
            ) : (
              !beforeFirst &&
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
      {current && next && (
        <div className="flex flex-wrap gap-x-1.5 bg-white/12 px-[18px] py-3 text-[15px]">
          <span className="opacity-90">Danach:</span>
          <span className="font-semibold">
            {next.time.slice(0, 5)} · {next.location} gegen{' '}
            {opponent(next, sides.get(next.id), team)}
          </span>
        </div>
      )}
      {scorerDuty && (
        <div className="flex items-center gap-2.5 bg-scorer-bg px-[18px] py-3 text-[15px] text-scorer-ink">
          <ScorerIcon className="size-5 shrink-0" />
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

function Tile({
  label,
  value,
  negative,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-control bg-base-200 p-2.5">
      <div className="text-xs font-bold tracking-[0.6px] text-muted uppercase">
        {label}
      </div>
      <div
        className={`font-display text-[26px] leading-none font-bold ${
          negative ? 'text-negative' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
