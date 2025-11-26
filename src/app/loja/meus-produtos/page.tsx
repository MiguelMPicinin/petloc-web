'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-color pb-16">
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/loja')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="text-xl font-bold">Meus Produtos</h1>
          </div>
          <button
            onClick={() => router.push('/loja/cadastro-produto')}
            className="bg-surface-color text-primary-color p-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="text-lg">+</span>
          </button>
        </div>
      </header>

      <div className="container">
        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-center py-12">
            <div className="loading-spinner-primary"></div>
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">📦</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhum produto cadastrado
            </h3>
            <p className="text-gray-500 mb-6">
              Toque no + para cadastrar seu primeiro produto
            </p>
            <button
              onClick={() => router.push('/loja/cadastro-produto')}
              className="btn btn-primary"
            >
              Cadastrar Primeiro Produto
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {produtos.map((produto) => (
              <div key={produto.id} className="card">
                <div className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Imagem do Produto */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-center">
                        {produto.imagemBase64 ? (
                          <img
                            src={`data:image/jpeg;base64,${produto.imagemBase64}`}
                            alt={produto.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-gray-400">🛍️</span>
                        )}
                      </div>
                    </div>

                    {/* Informações do Produto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-on-surface">
                            {produto.nome}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`badge ${
                              produto.ativo 
                                ? 'badge-success' 
                                : 'badge-error'
                            }`}>
                              {produto.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                            {produto.estoque !== undefined && produto.estoque <= 0 && (
                              <span className="badge badge-error">
                                ESGOTADO
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => toggleProdutoAtivo(produto.id, produto.ativo)}
                            className={`btn btn-sm ${
                              produto.ativo
                                ? 'btn-secondary'
                                : 'btn-success'
                            }`}
                          >
                            {produto.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-on-surface text-sm mb-2 line-clamp-2">
                        {produto.descricao}
                      </p>
                      
                      <div className="flex-between text-sm">
                        <span className="text-primary-color font-bold">
                          R$ {parseFloat(produto.preco).toFixed(2)}
                        </span>
                        <div className="flex items-center space-x-4 text-gray-500">
                          <span>{produto.categoria}</span>
                          {produto.estoque !== undefined && (
                            <span>Estoque: {produto.estoque}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão Flutuante */}
      <button
        onClick={() => router.push('/loja/cadastro-produto')}
        className="fixed bottom-20 right-6 bg-primary-color text-on-primary w-14 h-14 rounded-full shadow-lg flex-center text-2xl hover:bg-primary-dark transition-colors z-10"
      >
        +
      </button>
    </div>
  );
}