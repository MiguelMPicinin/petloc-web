'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/config';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
  contato: string;
  imagemBase64?: string;
  estoque?: number;
  categoria: string;
  userId: string;
  ativo: boolean;
  criadoEm: any;
  userEmail?: string;
}

export default function AdminLojaPage() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'inativos'>('todos');

  useEffect(() => {
    if (!user || userRole !== 'admin') {
      router.push('/login');
      return;
    }
    loadProdutos();
  }, [user, userRole, router]);

  const loadProdutos = async () => {
    try {
      const produtosSnapshot = await getDocs(collection(db, 'produtos_loja'));
      const produtosData: Produto[] = [];
      
      for (const produtoDoc of produtosSnapshot.docs) {
        const data = produtoDoc.data() as Produto;
        produtosData.push({
          ...data,
          id: produtoDoc.id,
        });
      }
      
      setProdutos(produtosData);
    } catch (error: any) {
      setError('Erro ao carregar produtos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleProdutoAtivo = async (produtoId: string, ativo: boolean) => {
    try {
      await updateDoc(doc(db, 'produtos_loja', produtoId), {
        ativo: !ativo,
        atualizadoEm: new Date(),
      });
      await loadProdutos();
    } catch (error: any) {
      setError('Erro ao atualizar produto: ' + error.message);
    }
  };

  const deletarProduto = async (produtoId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'produtos_loja', produtoId));
        await loadProdutos();
      } catch (error: any) {
        setError('Erro ao excluir produto: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut();
      router.push('/login');
    }
  };

  const filteredProdutos = produtos.filter(produto => {
    if (filtro === 'ativos') return produto.ativo;
    if (filtro === 'inativos') return !produto.ativo;
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
              🛍️ Administração da Loja
            </h1>
            <p className="text-on-surface mt-1">
              Gerencie produtos da loja
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/loja')}
              className="btn btn-primary"
            >
              Voltar à Loja
            </button>
            <button
              onClick={() => router.push('/home')}
              className="btn btn-secondary"
            >
              Início
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
        <nav className="flex space-x-2 border-t pt-4 mt-4 flex-wrap gap-2">
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color"
          >
            👥 Usuários
          </button>
          <button
            onClick={() => router.push('/admin/missing-pets')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color"
          >
            🐕 Pets Desaparecidos
          </button>
          <button
            onClick={() => router.push('/admin/blog-chat')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color"
          >
            💬 Blog/Chat
          </button>
          <button
            onClick={() => router.push('/admin/loja')}
            className="px-4 py-2 bg-primary-color text-on-primary rounded-full font-medium transition-colors"
          >
            🛍️ Loja
          </button>
        </nav>
      </header>

      {/* Filtros */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'ativos', label: 'Ativos' },
          { key: 'inativos', label: 'Inativos' },
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-color">{produtos.length}</div>
          <div className="text-on-surface text-sm">Total de Produtos</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-success-color">
            {produtos.filter(p => p.ativo).length}
          </div>
          <div className="text-on-surface text-sm">Produtos Ativos</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-secondary-color">
            {produtos.filter(p => !p.ativo).length}
          </div>
          <div className="text-on-surface text-sm">Produtos Inativos</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-accent-color">
            {produtos.filter(p => p.estoque !== undefined && p.estoque <= 0).length}
          </div>
          <div className="text-on-surface text-sm">Produtos Esgotados</div>
        </div>
      </div>

      {loading ? (
        <div className="flex-center py-12">
          <div className="loading-spinner-primary"></div>
        </div>
      ) : filteredProdutos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 text-gray-300">🛍️</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-500">
            {filtro === 'todos' 
              ? 'Não há produtos cadastrados'
              : `Não há produtos ${filtro === 'ativos' ? 'ativos' : 'inativos'}`
            }
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-color divide-y divide-gray-200">
                {filteredProdutos.map((produto) => (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10">
                          {produto.imagemBase64 ? (
                            <img
                              src={`data:image/jpeg;base64,${produto.imagemBase64}`}
                              alt={produto.nome}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex-center">
                              <span className="text-gray-400">🛍️</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-on-surface max-w-xs truncate">
                            {produto.nome}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {produto.descricao}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-on-surface">
                        R$ {parseFloat(produto.preco).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-on-surface">{produto.categoria}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-on-surface">
                        {produto.estoque !== undefined ? produto.estoque : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          produto.ativo
                            ? 'badge-success'
                            : 'badge-error'
                        }`}
                      >
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => toggleProdutoAtivo(produto.id, produto.ativo)}
                        className={`btn btn-sm ${
                          produto.ativo
                            ? 'btn-secondary'
                            : 'btn-success'
                        } mr-2`}
                      >
                        {produto.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => deletarProduto(produto.id)}
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