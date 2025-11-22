import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bretten Kangaroos Xmas-Cup',
  description: 'Spielplan für den Bretten Kangaroos Xmas-Cup',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <h1>Bretten Kangaroos Xmas-Cup</h1>
        <div>tabs</div>
        {children}
      </body>
    </html>
  );
}
