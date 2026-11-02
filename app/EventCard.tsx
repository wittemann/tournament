import ClassTag from './ClassTag';
import type { Game } from './types';

/**
 * An event row (eventname, e.g. Siegerehrung, Mittagspause) in the schedule
 * (docs/design/README.md "Event card"): dark card, title in condensed
 * uppercase. Events have no teams or scores.
 *
 * - showTime (default): time and hall in a fixed left column, like GameCard.
 *   Off for lists grouped by time slot: the slot heading shows the time, the
 *   hall and class tag move into a top row above the title (each class has
 *   its own Technische Konferenz and Siegerehrung).
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
        {!showTime && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            {game.location && (
              <span className="font-semibold opacity-80">{game.location}</span>
            )}
            <ClassTag cls={game.class} />
          </div>
        )}
        <div className="font-display text-[22px] leading-tight font-bold tracking-[0.4px] uppercase">
          {game.eventname}
        </div>
      </div>
    </article>
  );
}
