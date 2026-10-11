import { Game } from './types';
import type { GameSides } from '@/lib/schedule';

/**
 * A scorer duty in the team's game list (docs/design/README.md "Scorer
 * duty"): dashed amber card with the time column, "Scorer-Dienst" and the
 * game the team scores. Past duties (game has a result) get a muted time.
 */
export default function ScorerCard({
  game,
  sides,
}: {
  game: Game;
  sides: GameSides | undefined;
}) {
  const done = game.homescore != null || game.awayscore != null;
  const home = sides?.home.team ?? sides?.home.ref ?? game.hometeam;
  const away = sides?.away.team ?? sides?.away.ref ?? game.awayteam;

  return (
    <article className="flex items-center gap-3.5 rounded-game border-[1.5px] border-dashed border-scorer-line bg-scorer-bg px-3.5 py-2.5 text-scorer-ink">
      <div className="flex w-[58px] shrink-0 flex-col gap-0.5">
        <div
          className={`font-display text-[22px] leading-none font-bold ${done ? 'text-muted' : 'text-base-content'}`}
        >
          {game.time.slice(0, 5)}
        </div>
        <div className="text-[13px] text-muted">{game.location}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="text-[13px] font-bold tracking-[0.6px] uppercase">
          Scorer-Dienst
        </div>
        <div
          className={`text-[15px] ${done ? 'text-muted' : 'text-base-content'}`}
        >
          {home} – {away}
        </div>
      </div>
    </article>
  );
}
