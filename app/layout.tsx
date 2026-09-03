import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ variable: '--font-app', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Essencialy | Gestão Optométrica',
  description: 'Agenda, pacientes, consultas, receitas e CRM da Essencialy.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} antialiased`}>{children}</body>
    </html>
  );
}
