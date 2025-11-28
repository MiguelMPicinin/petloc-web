'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

interface Pet {
  id: string;
  nome: string;
  descricao: string;
  contato: string;
  imagemBase64?: string;
  userId: string;
}

export default function HomePage() {
  const { user, userRole, userData, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!authLoading && userRole === 'admin') {
      console.log('🔄 Usuário é admin, redirecionando para painel administrativo...');
      setRedirecting(true);
      setTimeout(() => {
        router.push('/admin/users');
      }, 500);
    }
  }, [userRole, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && userRole !== 'admin') {
      const q = query(
        collection(db, 'pets'),
        where('userId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const petsData: Pet[] = [];
        snapshot.forEach((doc) => {
          petsData.push({ id: doc.id, ...doc.data() } as Pet);
        });
        setPets(petsData);
        setPetsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, authLoading, router, userRole]);

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut();
      router.push('/login');
    }
  };

  const featureCards = [
    { 
      title: 'Comunidade', 
      description: 'Conecte-se com outros tutores', 
      icon: '👥', 
      route: '/community' 
    },
    { 
      title: 'Loja', 
      description: 'Produtos para seu pet', 
      icon: '🛍️', 
      route: '/loja' 
    },
    { 
      title: 'Pets', 
      description: 'Gerencie seus pets', 
      icon: '🐾', 
      route: '/pets' 
    },
    { 
      title: 'Desaparecidos', 
      description: 'Ajude a encontrar pets', 
      icon: '⚠️', 
      route: '/desaparecidos' 
    },
  ];

  const adminFeatures = [
    { title: 'Usuários', icon: '👥', section: 'users' },
    { title: 'Blog/Chat', icon: '💬', section: 'blog-chat' },
    { title: 'Pets Desaparecidos', icon: '🐕', section: 'missing-pets' },
  ];

  if (redirecting) {
    return (
      <div className="min-h-screen bg-background-color flex-center">
        <div className="text-center">
          <div className="loading-spinner-primary mb-4"></div>
          <p className="text-on-surface">Redirecionando para o painel administrativo...</p>
          <p className="text-sm text-gray-500 mt-2">Usuário admin detectado</p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-color flex-center">
        <div className="text-center">
          <div className="loading-spinner-primary"></div>
          <p className="text-on-surface mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  if (userRole === 'admin') {
    return (
      <div className="min-h-screen bg-background-color flex-center">
        <div className="text-center">
          <div className="loading-spinner-primary mb-4"></div>
          <p className="text-on-surface">Redirecionando para o painel administrativo...</p>
          <button 
            onClick={() => router.push('/admin/users')}
            className="btn btn-primary mt-4"
          >
            Clique aqui se não redirecionar automaticamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-color pb-16">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <span>🐾</span>
            <span>PetLoc</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-blue-100">
                {user?.email}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                userRole === 'admin' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-blue-200 text-blue-800'
              }`}>
                {userRole === 'admin' ? 'ADMIN' : 'USUÁRIO'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost text-on-primary"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <section className="mb-6">
          <div className="card text-center">
            <h2 className="text-2xl font-bold mb-2">
              Bem-vindo ao PetLoc, {user?.displayName || 'Amigo'}!
            </h2>
            <p className="text-on-surface">Cuidando dos seus pets com amor e tecnologia</p>
          </div>
        </section>

        <section className="mb-6">
          <div className="flex-between mb-4">
            <h3 className="text-lg font-semibold">Meus Pets</h3>
            <button 
              onClick={() => router.push('/pets/cadastro')}
              className="btn btn-primary btn-sm"
            >
              + Adicionar Pet
            </button>
          </div>

          {petsLoading ? (
            <div className="flex-center py-8">
              <div className="loading-spinner-primary"></div>
            </div>
          ) : pets.length === 0 ? (
            <div className="card text-center py-8">
              <div className="text-4xl mb-4">🐾</div>
              <p className="text-on-surface mb-4">Nenhum pet cadastrado</p>
              <button 
                onClick={() => router.push('/pets/cadastro')}
                className="btn btn-primary"
              >
                Cadastrar Primeiro Pet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {pets.slice(0, 4).map((pet) => (
                <div 
                  key={pet.id}
                  onClick={() => router.push(`/pets/editar/${pet.id}`)}
                  className="card text-center cursor-pointer hover-lift pet-card-small"
                >
                  <div className="pet-avatar-small">
                    {pet.imagemBase64 ? (
                      <img 
                        src={`data:image/jpeg;base64,${pet.imagemBase64}`}
                        alt={pet.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🐾</span>
                    )}
                  </div>
                  <h4 className="font-semibold truncate">{pet.nome}</h4>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Funcionalidades</h3>
          <div className="grid grid-cols-2 gap-4">
            {featureCards.map((item, index) => (
              <div
                key={index}
                onClick={() => router.push(item.route)}
                className="card text-center cursor-pointer hover-lift"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-full flex-center mx-auto mb-2">
                  <span className="text-xl">{item.icon}</span>
                </div>
                <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-on-surface">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {userRole === 'admin' && (
          <section className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">👑</span>
                <div>
                  <p className="font-semibold text-yellow-800">Modo Administrador Ativo</p>
                  <p className="text-yellow-600 text-sm">Você tem acesso ao painel administrativo</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Painel Administrativo</h3>
            <div className="grid grid-cols-2 gap-4">
              {adminFeatures.map((item, index) => (
                <div
                  key={index}
                  onClick={() => router.push(`/admin/${item.section}`)}
                  className="card text-center cursor-pointer bg-yellow-50 border-yellow-200 hover-lift"
                >
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex-center mx-auto mb-2">
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <nav className="nav-bar">
        <button 
          onClick={() => router.push('/home')}
          className="nav-item active"
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Início</span>
        </button>
        <button 
          onClick={() => router.push('/pets')}
          className="nav-item"
        >
          <span className="nav-icon">🐾</span>
          <span className="nav-label">Pets</span>
        </button>
        <button 
          onClick={() => router.push('/desaparecidos')}
          className="nav-item"
        >
          <span className="nav-icon">⚠️</span>
          <span className="nav-label">Desaparecidos</span>
        </button>
        <button 
          onClick={() => router.push('/loja')}
          className="nav-item"
        >
          <span className="nav-icon">🛍️</span>
          <span className="nav-label">Loja</span>
        </button>
        <button 
          onClick={() => router.push('/community')}
          className="nav-item"
        >
          <span className="nav-icon">👥</span>
          <span className="nav-label">Comunidade</span>
        </button>
      </nav>
    </div>
  );
}