'use client';

import { useNow } from '@/lib/useNow';

export default function Header() {
  const now = useNow();

  return (
    <header className="bg-primary text-primary-content mx-3 mt-3 flex items-center gap-2.5 rounded-header py-2.5 pr-3.5 pl-3">
      {/* Decorative: the title next to it already names the club. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kangaroo.png"
        alt=""
        width={71}
        height={40}
        className="h-10 w-auto"
        fetchPriority="high"
      />
      <div className="flex flex-col">
        <h1 className="font-display text-[26px] leading-none font-bold tracking-[0.5px] uppercase">
          Xmas-Ball
        </h1>
        <p className="text-xs font-semibold opacity-80">Bretten Kangaroos</p>
      </div>
      {/* Placeholder keeps the pill's size until the client time is known. */}
      <time
        className={`font-display bg-primary-content/16 ml-auto rounded-full px-3 py-1 text-xl leading-normal font-bold tabular-nums ${now === null ? 'invisible' : ''}`}
      >
        {now ?? '00:00'}
      </time>
    </header>
  );
}
