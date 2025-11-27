// src/components/UI/Header.tsx
'use client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
}

export default function Header({ title, showBackButton = false, rightAction }: HeaderProps) {
  const router = useRouter();

  return (
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
        
        {rightAction && (
          <div className="header-right">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}