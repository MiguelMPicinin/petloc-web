'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

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

const categorias = [
  'Todos',
  'Ração',
  'Brinquedos',
  'Coleiras',
  'Medicamentos',
  'Higiene',
  'Acessórios',
  'Outros'
];

export default function LojaPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    let q;
    if (categoriaSelecionada === 'Todos') {
      q = query(
        collection(db, 'produtos_loja'),
        where('ativo', '==', true)
      );
    } else {
      q = query(
        collection(db, 'produtos_loja'),
        where('ativo', '==', true),
        where('categoria', '==', categoriaSelecionada)
      );
    }
    
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
  }, [user, router, categoriaSelecionada]);

  const produtosFiltrados = searchQuery
    ? produtos.filter(produto =>
        produto.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        produto.descricao.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : produtos;

  const truncateName = (name: string, maxLength: number = 22) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/home')}
              className="p-2 hover:bg-primary-dark rounded transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="text-xl font-bold text-on-primary">PetLoc Shop</h1>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <button
                onClick={() => router.push('/loja/meus-produtos')}
                className="header-action-btn"
                title="Meus Produtos"
              >
                <span className="text-lg">📦</span>
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => router.push('/admin/loja')}
                  className="header-action-btn"
                  title="Admin Loja"
                >
                  <span className="text-lg">⚙️</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="container">
        {/* Barra de Pesquisa */}
        <div className="mb-4 mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-12 w-full rounded-lg py-3 border-gray-300"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div className="flex overflow-x-auto py-2 mb-4 space-x-2 scrollbar-hide">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              onClick={() => setCategoriaSelecionada(categoria)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoria === categoriaSelecionada
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface text-on-surface border border-gray-300 hover:border-primary'
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        {/* Header com contador e ações */}
        <div className="flex-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface">
            {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={() => router.push('/loja/cadastro-produto')}
            className="btn btn-primary btn-sm"
          >
            + Cadastrar
          </button>
        </div>

        {loading ? (
          <div className="flex-center py-12">
            <div className="loading-spinner loading-spinner-primary w-8 h-8"></div>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">🛍️</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery || categoriaSelecionada !== 'Todos' 
                ? 'Nenhum produto encontrado'
                : 'Nenhum produto disponível'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || categoriaSelecionada !== 'Todos' 
                ? 'Tente buscar com outros termos ou mudar a categoria'
                : 'Seja o primeiro a cadastrar um produto!'
              }
            </p>
            <button
              onClick={() => router.push('/loja/cadastro-produto')}
              className="btn btn-primary"
            >
              Cadastrar Produto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {produtosFiltrados.map((produto) => (
              <ProductCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
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

// Componente para Card de Produto
function ProductCard({ produto }: { produto: Produto }) {
  const router = useRouter();
  const semEstoque = produto.estoque !== undefined && produto.estoque <= 0;

  return (
    <div 
      className="card hover-lift cursor-pointer transition-all duration-200 hover:shadow-md"
      onClick={() => router.push(`/loja/comprar/${produto.id}`)}
    >
      <div className="relative">
        {produto.imagemBase64 ? (
          <img
            src={`data:image/jpeg;base64,${produto.imagemBase64}`}
            alt={produto.nome}
            className="w-full h-40 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex-center rounded-t-lg">
            <span className="text-3xl text-gray-400">🛍️</span>
          </div>
        )}
        
        {semEstoque && (
          <div className="absolute top-2 left-2 bg-error text-on-error px-2 py-1 rounded text-xs font-semibold">
            ESGOTADO
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-on-surface mb-2 line-clamp-2">
          {produto.nome}
        </h3>
        
        <p className="text-primary font-bold text-lg mb-2">
          R$ {parseFloat(produto.preco).toFixed(2)}
        </p>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span className="flex items-center">
            <span className="mr-1">🚚</span>
            Frete grátis
          </span>
        </div>
        
        <div className="flex-between text-sm text-gray-500">
          <span className="capitalize">{produto.categoria || 'Outros'}</span>
          {produto.estoque !== undefined && produto.estoque > 0 && (
            <span>{produto.estoque} em estoque</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/loja/comprar/${produto.id}`);
          }}
          disabled={semEstoque}
          className={`w-full mt-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
            semEstoque
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-primary text-on-primary hover:bg-primary-dark'
          }`}
        >
          {semEstoque ? 'Indisponível' : 'Comprar'}
        </button>
      </div>
    </div>
  );
}