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
    <div className="flex border-b dark:border-gray-700">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`flex-1 py-3 px-1 sm:px-4 text-center font-medium transition-colors ${
            pathname === href
              ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-b-2 border-green-700 dark:border-green-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
