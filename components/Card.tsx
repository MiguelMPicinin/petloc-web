// src/components/UI/Card.tsx
'use client';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export default function Card({ 
  children, 
  className = '', 
  onClick,
  variant = 'default'
}: CardProps) {
  const baseClasses = 'card';
  const variantClasses = {
    default: '',
    outlined: 'border-2 border-primary',
    elevated: 'shadow-lg'
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </div>
  );
}