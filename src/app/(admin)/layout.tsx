'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🛡️ AdminLayout - Verificando permissões:', {
      user: user?.email,
      userRole,
      userData,
      loading
    });

    if (!loading) {
      if (!user) {
        console.log('❌ AdminLayout: Usuário não autenticado, redirecionando para login');
        router.push('/login');
        return;
      }
      
      // VERIFICAÇÃO POR EMAIL - Compara email do Auth com email do Firestore
      const isAdmin = userRole === 'admin';
      console.log('🔍 Verificação admin:', {
        emailAuth: user.email,
        emailFirestore: userData?.email,
        roleFirestore: userData?.role,
        isAdmin
      });

      if (!isAdmin) {
        console.log('❌ AdminLayout: Usuário não é admin, role:', userRole, 'Redirecionando para home');
        router.push('/home');
        return;
      }

      console.log('✅ AdminLayout: Acesso permitido - Usuário é admin');
    }
  }, [user, userRole, userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-color flex-center">
        <div className="text-center">
          <div className="loading-spinner-primary mb-4"></div>
          <p className="text-on-surface">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-color">
      {children}
    </div>
  );
}