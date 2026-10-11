'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Spielplan' },
  { href: '/standings', label: 'Tabelle' },
  { href: '/finalrunde', label: 'Finalrunde' },
  { href: '/sell', label: 'Verkauf' },
  { href: '/faq', label: 'Info' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Hauptnavigation" className="flex gap-0.5 px-3 pt-2.5">
      {links.map(({ href, label }) => {
        const current = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? 'page' : undefined}
            className={`flex h-10 min-w-10 flex-auto items-center justify-center rounded-full px-2 text-sm whitespace-nowrap transition-colors max-[359px]:px-1 max-[359px]:text-[13px] ${
              current
                ? 'bg-neutral font-bold text-neutral-content'
                : 'font-semibold text-muted-2 hover:bg-base-200'
            }`}
          >
            {/* Ellipsis instead of sideways scrolling if text is scaled up */}
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
