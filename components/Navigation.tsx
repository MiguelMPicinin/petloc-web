// components/Navigation.tsx
'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const navigationItems = [
  { label: 'Home', icon: '🏠', route: '/home' },
  { label: 'Pets', icon: '🐾', route: '/pets' },
  { label: 'Desaparecidos', icon: '⚠️', route: '/desaparecidos' },
  { label: 'Loja', icon: '🛍️', route: '/loja' },
  { label: 'Comunidade', icon: '👥', route: '/community' },
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedIndex, setSelectedIndex] = useState(
    navigationItems.findIndex(item => item.route === pathname)
  );

  const handleNavigation = (index: number, route: string) => {
    setSelectedIndex(index);
    router.push(route);
  };

  return (
    <nav className="nav-bar">
      {navigationItems.map((item, index) => (
        <button
          key={index}
          onClick={() => handleNavigation(index, item.route)}
          className={`nav-item ${selectedIndex === index ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}