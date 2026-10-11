import type { Game } from './types';

/**
 * An event row (eventname, e.g. Siegerehrung, Mittagspause) in the schedule
 * (docs/design/README.md "Event card"): dark card, title in condensed
 * uppercase. Events have no teams, scores or class.
 *
 * - showTime (default): time and hall in a fixed left column, like GameCard.
 *   Off for lists grouped by time slot: the slot heading shows the time, the
 *   hall moves into a top row above the title.
 */
export default function EventCard({
  game,
  showTime = true,
}: {
  game: Game;
  showTime?: boolean;
}) {
  const time = game.time.slice(0, 5);

  return (
    <article className="flex items-center gap-3.5 rounded-game bg-neutral px-3.5 py-3.5 text-neutral-content">
      {showTime ? (
        <div className="flex w-[58px] shrink-0 flex-col gap-0.5">
          <div className="font-display text-[22px] leading-none font-bold">
            {time}
          </div>
          <div className="text-[13px] opacity-80">{game.location}</div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {!showTime && game.location && (
          <div className="text-[13px] font-semibold opacity-80">
            {game.location}
          </div>
        )}
        <div className="font-display text-[22px] leading-tight font-bold tracking-[0.4px] uppercase">
          {game.eventname}
        </div>
      </div>
    </article>
  );
}
