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
      <body className="bg-gray-100 min-h-screen">
        <div className="max-w-[800px] mx-auto bg-white">
          <div className="bg-green-700 text-white p-6 text-center">
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
          <div className="flex border-b">
            <Link
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
                  : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
              }`}
              href="/"
            >
              Spielplan
            </Link>
            <Link
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                pathname === '/standings'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
                  : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
              }`}
              href="/standings"
            >
              Tabelle
            </Link>
            <Link
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                pathname === '/sell'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
                  : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
              }`}
              href="/sell"
            >
              Verkauf
            </Link>
            <Link
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                pathname === '/faq'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
                  : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
              }`}
              href="/faq"
            >
              Info
            </Link>
          </div>
          <div className="px-4 py-4 bg-white">{children}</div>
        </div>
      </body>
    </html>
  );
}
