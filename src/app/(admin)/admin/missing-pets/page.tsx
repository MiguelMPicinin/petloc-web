'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/config';

interface Desaparecido {
  id: string;
  nome: string;
  descricao: string;
  contato: string;
  imagemBase64?: string;
  userId: string;
  encontrado: boolean;
  criadoEm: any;
  userEmail?: string;
}

export default function AdminMissingPetsPage() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();
  const [desaparecidos, setDesaparecidos] = useState<Desaparecido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'encontrados'>('todos');

  useEffect(() => {
    if (!user || userRole !== 'admin') {
      return;
    }
    loadDesaparecidos();
  }, [user, userRole]);

  const loadDesaparecidos = async () => {
    try {
      const desaparecidosSnapshot = await getDocs(collection(db, 'desaparecidos'));
      const desaparecidosData: Desaparecido[] = [];
      
      for (const desaparecidoDoc of desaparecidosSnapshot.docs) {
        const data = desaparecidoDoc.data() as Desaparecido;
        
        try {
          const userDocRef = doc(db, 'users', data.userId);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.data();
          
          desaparecidosData.push({
            ...data,
            id: desaparecidoDoc.id,
            userEmail: userData?.email || 'Email não encontrado'
          });
        } catch (userError) {
          desaparecidosData.push({
            ...data,
            id: desaparecidoDoc.id,
            userEmail: 'Erro ao carregar email'
          });
        }
      }
      
      setDesaparecidos(desaparecidosData);
    } catch (error: any) {
      setError('Erro ao carregar desaparecidos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEncontrado = async (id: string, encontrado: boolean) => {
    try {
      await updateDoc(doc(db, 'desaparecidos', id), {
        encontrado: !encontrado,
        atualizadoEm: new Date(),
      });
      await loadDesaparecidos();
    } catch (error: any) {
      setError('Erro ao atualizar registro: ' + error.message);
    }
  };

  const deletarDesaparecido = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        await deleteDoc(doc(db, 'desaparecidos', id));
        await loadDesaparecidos();
      } catch (error: any) {
        setError('Erro ao excluir registro: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut();
      router.push('/login');
    }
  };

  const filteredDesaparecidos = desaparecidos.filter(desaparecido => {
    if (filtro === 'ativos') return !desaparecido.encontrado;
    if (filtro === 'encontrados') return desaparecido.encontrado;
    return true;
  });

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-color p-4">
      {/* Header com Navegação */}
      <header className="card mb-6">
        <div className="flex-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-color">
              🐕 Administração de Pets Desaparecidos
            </h1>
            <p className="text-on-surface mt-1">
              Gerencie registros de pets desaparecidos
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/home')}
              className="btn btn-primary"
            >
              Voltar ao App
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-error"
            >
              🚪 Sair
            </button>
          </div>
        </div>

        {/* Navegação entre Telas Admin */}
        <nav className="flex space-x-2 border-t pt-4 mt-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color flex items-center"
          >
            👥 Usuários
          </button>
          <button
            onClick={() => router.push('/admin/missing-pets')}
            className="px-4 py-2 bg-primary-color text-on-primary rounded-full font-medium transition-colors flex items-center"
          >
            🐕 Pets Desaparecidos
          </button>
          <button
            onClick={() => router.push('/admin/blog-chat')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color flex items-center"
          >
            💬 Blog/Chat
          </button>
        </nav>
      </header>

      {/* Filtros */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'ativos', label: 'Desaparecidos' },
          { key: 'encontrados', label: 'Encontrados' },
        ].map((filtroItem) => (
          <button
            key={filtroItem.key}
            onClick={() => setFiltro(filtroItem.key as any)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
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
        <div className="alert alert-error mb-6">
          {error}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-color">{desaparecidos.length}</div>
          <div className="text-on-surface">Total de Registros</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-secondary-color">
            {desaparecidos.filter(d => !d.encontrado).length}
          </div>
          <div className="text-on-surface">Desaparecidos</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-success-color">
            {desaparecidos.filter(d => d.encontrado).length}
          </div>
          <div className="text-on-surface">Encontrados</div>
        </div>
      </div>

      {loading ? (
        <div className="flex-center py-12">
          <div className="loading-spinner-primary"></div>
        </div>
      ) : filteredDesaparecidos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 text-gray-300">🐕</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Nenhum registro encontrado
          </h3>
          <p className="text-gray-500">
            {filtro === 'todos' 
              ? 'Não há registros de pets desaparecidos'
              : `Não há registros ${filtro === 'ativos' ? 'desaparecidos' : 'encontrados'}`
            }
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-color divide-y divide-gray-200">
                {filteredDesaparecidos.map((desaparecido) => (
                  <tr key={desaparecido.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          {desaparecido.imagemBase64 ? (
                            <img
                              src={`data:image/jpeg;base64,${desaparecido.imagemBase64}`}
                              alt={desaparecido.nome}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex-center">
                              <span className="text-gray-400">🐾</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-on-surface">
                            {desaparecido.nome}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-on-surface max-w-xs truncate">
                        {desaparecido.descricao}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-on-surface">{desaparecido.contato}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-on-surface">{desaparecido.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          desaparecido.encontrado
                            ? 'badge-success'
                            : 'badge-error'
                        }`}
                      >
                        {desaparecido.encontrado ? 'Encontrado' : 'Desaparecido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleEncontrado(desaparecido.id, desaparecido.encontrado)}
                        className={`btn btn-sm ${
                          desaparecido.encontrado
                            ? 'btn-secondary'
                            : 'btn-success'
                        } mr-2`}
                      >
                        {desaparecido.encontrado ? 'Marcar como Desaparecido' : 'Marcar como Encontrado'}
                      </button>
                      <button
                        onClick={() => deletarDesaparecido(desaparecido.id)}
                        className="btn btn-sm btn-error"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}