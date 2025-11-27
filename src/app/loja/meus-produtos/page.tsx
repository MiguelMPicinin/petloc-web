'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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
}

export default function MeusProdutosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const q = query(
      collection(db, 'produtos_loja'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const produtosData: Produto[] = [];
        snapshot.forEach((doc) => {
          produtosData.push({ id: doc.id, ...doc.data() } as Produto);
        });
        setProdutos(produtosData);
        setLoading(false);
      },
      (error) => {
        setError('Erro ao carregar produtos: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, router]);

  const toggleProdutoAtivo = async (produtoId: string, ativo: boolean) => {
    try {
      await updateDoc(doc(db, 'produtos_loja', produtoId), {
        ativo: !ativo,
        atualizadoEm: new Date(),
      });
    } catch (error: any) {
      setError('Erro ao atualizar produto: ' + error.message);
    }
  };

  const deletarProduto = async (produtoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      await updateDoc(doc(db, 'produtos_loja', produtoId), {
        ativo: false,
        atualizadoEm: new Date(),
      });
    } catch (error: any) {
      setError('Erro ao excluir produto: ' + error.message);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/loja')}
              className="p-2 hover:bg-primary-dark rounded transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="text-xl font-bold text-on-primary">Meus Produtos</h1>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <button
                onClick={() => router.push('/loja/cadastro-produto')}
                className="header-action-btn"
                title="Adicionar Produto"
              >
                <span className="text-lg">+</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 pb-20">
        <div className="container">
          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          {/* Header com contador */}
          <div className="flex-between mb-4 mt-4">
            <h2 className="text-lg font-semibold text-on-surface">
              {produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}
            </h2>
            <button
              onClick={() => router.push('/loja/cadastro-produto')}
              className="btn btn-primary btn-sm"
            >
              + Novo Produto
            </button>
          </div>

          {loading ? (
            <div className="flex-center py-12">
              <div className="loading-spinner loading-spinner-primary w-8 h-8"></div>
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 text-gray-300">📦</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhum produto cadastrado
              </h3>
              <p className="text-gray-500 mb-6">
                Toque no botão abaixo para cadastrar seu primeiro produto
              </p>
              <button
                onClick={() => router.push('/loja/cadastro-produto')}
                className="btn btn-primary"
              >
                Cadastrar Primeiro Produto
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {produtos.map((produto) => (
                <MyProductCard 
                  key={produto.id} 
                  produto={produto} 
                  onToggleActive={toggleProdutoAtivo}
                  onDelete={deletarProduto}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Navigation - Fixa no final */}
      <nav className="nav-bar fixed bottom-0 left-0 right-0">
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
          onClick={() => router.push('/loja')}
          className="nav-item active"
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

// Componente para Card de Produto do Usuário
function MyProductCard({ 
  produto, 
  onToggleActive, 
  onDelete 
}: { 
  produto: Produto;
  onToggleActive: (id: string, ativo: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const semEstoque = produto.estoque !== undefined && produto.estoque <= 0;

  return (
    <div className="card hover-lift transition-all duration-200 hover:shadow-md">
      <div className="flex items-start space-x-3">
        {/* Imagem do Produto */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-center">
            {produto.imagemBase64 ? (
              <img
                src={`data:image/jpeg;base64,${produto.imagemBase64}`}
                alt={produto.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg text-gray-400">🛍️</span>
            )}
          </div>
        </div>

        {/* Informações do Produto */}
        <div className="flex-1 min-w-0">
          <div className="flex-between mb-2">
            <div>
              <h3 className="text-base font-semibold text-on-surface line-clamp-1">
                {produto.nome}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`badge text-xs ${
                  produto.ativo 
                    ? 'badge-success' 
                    : 'badge-error'
                }`}>
                  {produto.ativo ? 'Ativo' : 'Inativo'}
                </span>
                {semEstoque && (
                  <span className="badge badge-error text-xs">
                    ESGOTADO
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-on-surface text-xs mb-2 line-clamp-2">
            {produto.descricao}
          </p>
          
          <div className="flex-between text-xs">
            <span className="text-primary font-bold">
              R$ {parseFloat(produto.preco).toFixed(2)}
            </span>
            <div className="flex items-center space-x-3 text-gray-500">
              <span className="capitalize">{produto.categoria}</span>
              {produto.estoque !== undefined && (
                <span>Estoque: {produto.estoque}</span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => onToggleActive(produto.id, produto.ativo)}
              className={`btn btn-sm flex-1 text-xs ${
                produto.ativo
                  ? 'btn-secondary'
                  : 'btn-success'
              }`}
            >
              {produto.ativo ? 'Desativar' : 'Ativar'}
            </button>
            <button
              onClick={() => onDelete(produto.id)}
              className="btn btn-sm btn-error flex-1 text-xs"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}