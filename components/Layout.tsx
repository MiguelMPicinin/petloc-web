// components/Layout.tsx
'use client';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showHeader?: boolean;
}

export default function Layout({ 
  children, 
  title, 
  showBackButton = false, 
  showHeader = true 
}: LayoutProps) {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen">
      {showHeader && (
        <header className="header">
          <div className="header-content">
            <div className="flex items-center space-x-3">
              {showBackButton && (
                <button 
                  onClick={() => router.back()}
                  className="btn btn-outlined"
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  ←
                </button>
              )}
              {title && <h1 className="text-xl font-bold">{title}</h1>}
            </div>
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">Olá, {user.displayName || 'Usuário'}</span>
              </div>
            )}
          </div>
        </header>
      )}
      <main className="container" style={{ paddingBottom: '80px' }}>
        {children}
      </main>
    </div>
  );
}