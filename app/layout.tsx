import type { Metadata } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import Header from './Header';
import Nav from './Nav';
import './globals.css';

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow',
});

const barlowCondensed = Barlow_Condensed({
  weight: ['600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow-condensed',
});

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
    <html
      lang="de"
      className={`${barlow.variable} ${barlowCondensed.variable}`}
    >
      <body className="bg-base-200 text-base-content min-h-screen">
        <div className="max-w-[1024px] mx-auto bg-base-100">
          <Header />
          <Nav />
          <div className="px-4 py-4 bg-base-100">{children}</div>
        </div>
      </body>
    </html>
  );
}
