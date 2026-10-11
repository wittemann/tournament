'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Spielplan' },
  { href: '/standings', label: 'Tabelle' },
  { href: '/sell', label: 'Verkauf' },
  { href: '/faq', label: 'Info' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-line">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`flex-1 py-3 px-1 sm:px-4 text-center font-medium transition-colors ${
            pathname === href
              ? 'bg-win-bg text-primary border-b-2 border-primary'
              : 'text-muted-2 hover:text-primary hover:bg-base-200'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
