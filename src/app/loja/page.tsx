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

export default function LojaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todos');
  const [error, setError] = useState('');

  const categorias = [
    'todos',
    'ração',
    'brinquedos',
    'coleiras',
    'medicamentos',
    'higiene',
    'acessórios',
    'outros'
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const q = query(
      collection(db, 'produtos_loja'),
      where('ativo', '==', true)
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

  const produtosFiltrados = categoriaSelecionada === 'todos' 
    ? produtos 
    : produtos.filter(produto => {
        const categoriaProduto = produto.categoria ? produto.categoria.toLowerCase() : 'outros';
        return categoriaProduto === categoriaSelecionada.toLowerCase();
      });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-color pb-20">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/home')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">PetLoc Shop</h1>
              <p className="text-xs text-blue-100">Tudo para seu pet</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/loja/meus-produtos')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
              title="Meus Produtos"
            >
              <span className="text-lg">📦</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Categorias */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              onClick={() => setCategoriaSelecionada(categoria)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                categoriaSelecionada === categoria
                  ? 'bg-primary-color text-on-primary'
                  : 'bg-surface-color text-on-surface border border-gray-300 hover:border-primary-color'
              }`}
            >
              {categoria === 'todos' ? 'Todos' : 
               categoria.charAt(0).toUpperCase() + categoria.slice(1)}
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
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">🛍️</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {categoriaSelecionada === 'todos' 
                ? 'Nenhum produto disponível'
                : `Nenhum produto na categoria ${categoriaSelecionada}`
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {categoriaSelecionada === 'todos' 
                ? 'Seja o primeiro a cadastrar um produto!'
                : 'Tente outra categoria ou cadastre um produto'
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
          <>
            <div className="mb-4 text-sm text-gray-600">
              {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {produtosFiltrados.map((produto) => (
                <div 
                  key={produto.id} 
                  className="card cursor-pointer hover-lift"
                  onClick={() => router.push(`/loja/comprar/${produto.id}`)}
                >
                  {/* Imagem do Produto */}
                  <div className="relative">
                    {produto.imagemBase64 ? (
                      <img
                        src={`data:image/jpeg;base64,${produto.imagemBase64}`}
                        alt={produto.nome}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex-center">
                        <span className="text-3xl text-gray-400">🛍️</span>
                      </div>
                    )}
                    
                    {/* Indicador de Estoque */}
                    {produto.estoque !== undefined && produto.estoque <= 0 && (
                      <div className="absolute top-2 right-2 bg-error-color text-on-error px-2 py-1 rounded text-xs font-semibold">
                        ESGOTADO
                      </div>
                    )}
                  </div>

                  {/* Informações do Produto */}
                  <div className="p-3">
                    <h3 className="font-semibold text-on-surface text-sm mb-1 line-clamp-2">
                      {produto.nome}
                    </h3>
                    
                    <p className="text-primary-color font-bold text-lg mb-2">
                      R$ {parseFloat(produto.preco).toFixed(2)}
                    </p>
                    
                    <div className="flex-between text-xs text-gray-500">
                      <span>{produto.categoria || 'Outros'}</span>
                      {produto.estoque !== undefined && produto.estoque > 0 && (
                        <span>{produto.estoque} em estoque</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Botões Flutuantes */}
      <button
        onClick={() => router.push('/loja/cadastro-produto')}
        className="fixed bottom-20 right-6 bg-primary-color text-on-primary w-14 h-14 rounded-full shadow-lg flex-center text-2xl hover:bg-primary-dark transition-colors z-10"
      >
        +
      </button>
      
      <button
        onClick={() => router.push('/loja/meus-produtos')}
        className="fixed bottom-32 right-6 bg-success-color text-on-primary w-14 h-14 rounded-full shadow-lg flex-center text-2xl hover:bg-green-700 transition-colors z-10"
      >
        📦
      </button>
    </div>
  );
}