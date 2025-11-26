// src/app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';
import '../styles/globals.css';

export const metadata = {
  title: 'PetLoc - Cuidando dos seus pets',
  description: 'Plataforma completa para gerenciamento de pets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}