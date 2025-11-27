// src/components/Layout/AppLayout.tsx
'use client';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showHeader?: boolean;
  showNavigation?: boolean;
}

export default function AppLayout({ 
  children, 
  title, 
  showBackButton = false, 
  showHeader = true,
  showNavigation = true
}: AppLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    { label: 'Home', icon: '🏠', route: '/home' },
    { label: 'Pets', icon: '🐾', route: '/pets' },
    { label: 'Desaparecidos', icon: '⚠️', route: '/desaparecidos' },
    { label: 'Loja', icon: '🛍️', route: '/loja' },
    { label: 'Comunidade', icon: '👥', route: '/community' },
  ];

  const currentNavIndex = navigationItems.findIndex(item => item.route === pathname);

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <div className="app-layout">
      {/* Header - SEMPRE NO TOPO */}
      {showHeader && (
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <div className="flex items-center space-x-3">
                {showBackButton && (
                  <button 
                    onClick={() => router.back()}
                    className="header-back-button"
                  >
                    ←
                  </button>
                )}
                <div className="header-brand">
                  <span>🐾</span>
                  <span>PetLoc</span>
                </div>
                {title && <h1 className="header-title">{title}</h1>}
              </div>
            </div>
            
            {user && (
              <div className="header-right">
                <div className="user-info">
                  <span>Olá, {user.displayName || 'Usuário'}</span>
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Conteúdo Principal */}
      <main className="app-main">
        {children}
      </main>

      {/* Navegação Inferior */}
      {showNavigation && (
        <nav className="app-navigation">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.route)}
              className={`nav-item ${currentNavIndex === index ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}