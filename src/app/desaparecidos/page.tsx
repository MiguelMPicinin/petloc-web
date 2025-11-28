'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

interface Desaparecido {
  id: string;
  nome: string;
  descricao: string;
  contato: string;
  imagemBase64?: string;
  userId: string;
  encontrado: boolean;
  criadoEm: any;
}

export default function DesaparecidosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [desaparecidos, setDesaparecidos] = useState<Desaparecido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'desaparecidos' | 'encontrados'>('todos');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'desaparecidos'),
      (snapshot) => {
        const desaparecidosData: Desaparecido[] = [];
        snapshot.forEach((doc) => {
          desaparecidosData.push({ id: doc.id, ...doc.data() } as Desaparecido);
        });
        desaparecidosData.sort((a, b) => 
          new Date(b.criadoEm?.toDate()).getTime() - new Date(a.criadoEm?.toDate()).getTime()
        );
        setDesaparecidos(desaparecidosData);
        setLoading(false);
      },
      (error) => {
        setError('Erro ao carregar desaparecidos: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, router]);

  const marcarComoEncontrado = async (id: string) => {
    try {
      await updateDoc(doc(db, 'desaparecidos', id), {
        encontrado: true,
        atualizadoEm: new Date(),
      });
    } catch (error: any) {
      setError('Erro ao marcar como encontrado: ' + error.message);
    }
  };

  const filteredDesaparecidos = desaparecidos.filter(desaparecido => {
    if (filtro === 'desaparecidos') return !desaparecido.encontrado;
    if (filtro === 'encontrados') return desaparecido.encontrado;
    return true;
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-color pb-16">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button
              onClick={() => router.push('/home')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">Pets Desaparecidos</h1>
              <p className="text-xs text-blue-100">Ajude a encontrar pets perdidos</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/desaparecidos/criar')}
            className="bg-surface-color text-primary-color p-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="text-lg">+</span>
          </button>
        </div>
      </header>

      <div className="container">
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'desaparecidos', label: 'Desaparecidos' },
            { key: 'encontrados', label: 'Encontrados' },
          ].map((filtroItem) => (
            <button
              key={filtroItem.key}
              onClick={() => setFiltro(filtroItem.key as any)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                filtro === filtroItem.key
                  ? 'bg-primary-color text-on-primary'
                  : 'bg-surface-color text-on-surface border border-gray-300 hover:border-primary-color'
              }`}
            >
              {filtroItem.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-center py-12">
            <div className="loading-spinner-primary"></div>
          </div>
        ) : filteredDesaparecidos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">🐕</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {filtro === 'todos' && 'Nenhum pet desaparecido cadastrado'}
              {filtro === 'desaparecidos' && 'Nenhum pet desaparecido no momento'}
              {filtro === 'encontrados' && 'Nenhum pet encontrado recentemente'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filtro === 'desaparecidos' && 'Todos os pets foram encontrados! 🎉'}
              {filtro !== 'desaparecidos' && 'Toque no + para adicionar um registro'}
            </p>
            {filtro !== 'encontrados' && (
              <button
                onClick={() => router.push('/desaparecidos/criar')}
                className="btn btn-primary"
              >
                Reportar Desaparecimento
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDesaparecidos.map((desaparecido) => (
              <div 
                key={desaparecido.id} 
                className={`card overflow-hidden hover-lift ${
                  desaparecido.encontrado ? 'border-green-200' : 'border-red-200'
                }`}
              >
                <div className="relative imagem-container">
                  {desaparecido.imagemBase64 ? (
                    <img
                      src={`data:image/jpeg;base64,${desaparecido.imagemBase64}`}
                      alt={desaparecido.nome}
                      className="img-limitada w-full"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex-center">
                      <span className="text-4xl text-gray-400">🐾</span>
                    </div>
                  )}
                  
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold ${
                    desaparecido.encontrado 
                      ? 'bg-success-color text-on-primary' 
                      : 'bg-error-color text-on-primary'
                  }`}>
                    {desaparecido.encontrado ? '🎉 ENCONTRADO' : '⚠️ DESAPARECIDO'}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex-between mb-3">
                    <h3 className="text-xl font-semibold text-on-surface">
                      {desaparecido.nome}
                    </h3>
                    {user.uid === desaparecido.userId && !desaparecido.encontrado && (
                      <button
                        onClick={() => marcarComoEncontrado(desaparecido.id)}
                        className="btn btn-success btn-sm"
                      >
                        Marcar como Encontrado
                      </button>
                    )}
                  </div>
                  
                  <p className="text-on-surface mb-4 leading-relaxed">
                    {desaparecido.descricao}
                  </p>
                  
                  <div className="flex items-center text-on-surface">
                    <span className="mr-2">📞</span>
                    <span className="font-medium">{desaparecido.contato}</span>
                  </div>

                  {user.uid === desaparecido.userId && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Seu registro • Criado em {desaparecido.criadoEm?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => router.push('/desaparecidos/criar')}
        className="fixed bottom-20 right-6 bg-primary-color text-on-primary w-14 h-14 rounded-full shadow-lg flex-center text-2xl hover:bg-primary-dark transition-colors z-10"
      >
        +
      </button>

      <nav className="nav-bar">
        <button 
          onClick={() => router.push('/home')}
          className="nav-item"
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
          className="nav-item active"
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