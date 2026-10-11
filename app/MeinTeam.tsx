// Own team highlight (design: Tabelle, Finalrunde): amber background with a
// green left strip and a "Mein Team" tag.
export const MINE_BG = 'bg-scorer-bg';
export const MINE_STRIP = 'shadow-[inset_4px_0_0_var(--color-primary)]';

export function MeinTeamTag() {
  return (
    <span className="rounded-md bg-scorer-tag px-1.5 py-0.5 text-[12px] font-bold whitespace-nowrap text-scorer-ink">
      Mein Team
    </span>
  );
}
