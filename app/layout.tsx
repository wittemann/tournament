import type { Metadata } from 'next';
import Nav from './Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bretten Kangaroos Xmas-Ball',
  description: 'Spielplan für den Bretten Kangaroos Xmas-Ball',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-[1024px] mx-auto bg-white dark:bg-gray-800">
          <div className="bg-green-700 dark:bg-green-800 text-white p-6 text-center">
            <div className="flex items-center gap-3 justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Logo"
                className="h-12"
                fetchPriority="high"
              />
              <h1 className="text-2xl font-bold">Xmas-Ball</h1>
            </div>
          </div>
          <Nav />
          <div className="px-4 py-4 bg-white dark:bg-gray-800">{children}</div>
        </div>
      </body>
    </html>
  );
}
