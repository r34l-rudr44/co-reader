import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Co-Reader',
  description: 'A private intellectual workspace where reading turns into structured thought.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
