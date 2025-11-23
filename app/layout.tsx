'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="de">
      <head>
        <title>Bretten Kangaroos Xmas-Cup</title>
        <meta
          name="description"
          content="Spielplan für den Bretten Kangaroos Xmas-Cup"
        />
      </head>
      <body className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-[1024px] mx-auto bg-white dark:bg-gray-800">
          <div className="bg-green-700 dark:bg-green-800 text-white p-6 text-center">
            <div className="flex items-center gap-5 justify-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-12"
                fetchPriority="high"
              />
              <h1 className="text-2xl font-bold">Xmas-Cup</h1>
            </div>
          </div>
          <div className="flex border-b dark:border-gray-700">
            <Link
              className={`flex-1 py-3 px-1 sm:px-4 text-center font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-b-2 border-green-700 dark:border-green-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              href="/"
            >
              Spielplan
            </Link>
            <Link
              className={`flex-1 py-3 px-1 sm:px-4 text-center font-medium transition-colors ${
                pathname === '/standings'
                  ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-b-2 border-green-700 dark:border-green-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              href="/standings"
            >
              Tabelle
            </Link>
            <Link
              className={`flex-1 py-3 px-1 sm:px-4 text-center font-medium transition-colors ${
                pathname === '/sell'
                  ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-b-2 border-green-700 dark:border-green-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              href="/sell"
            >
              Verkauf
            </Link>
            <Link
              className={`flex-1 py-3 px-1 sm:px-4 text-center font-medium transition-colors ${
                pathname === '/faq'
                  ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-b-2 border-green-700 dark:border-green-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              href="/faq"
            >
              Info
            </Link>
          </div>
          <div className="px-4 py-4 bg-white dark:bg-gray-800">{children}</div>
        </div>
      </body>
    </html>
  );
}
