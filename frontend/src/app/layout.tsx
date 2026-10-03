import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gestão acadêmica',
  description: 'Operação acadêmica da instituição.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
