'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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
}

export default function ComprarProdutoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadProduto();
  }, [user, id, router]);

  const loadProduto = async () => {
    try {
      const docRef = doc(db, 'produtos_loja', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProduto({ id: docSnap.id, ...docSnap.data() } as Produto);
      } else {
        setError('Produto não encontrado');
      }
    } catch (error: any) {
      setError('Erro ao carregar produto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarCompra = () => {
    if (!produto) return;

    const mensagem = `Olá! Tenho interesse no produto: ${produto.nome}\nPreço: R$ ${parseFloat(produto.preco).toFixed(2)}\nQuantidade: ${quantidade}\n\nPoderia me dar mais informações?`;
    
    const whatsappUrl = `https://wa.me/${produto.contato.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-color">
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <button
                onClick={() => router.push('/loja')}
                className="p-2 hover:bg-primary-dark rounded transition-colors"
              >
                <span className="text-lg">←</span>
              </button>
              <h1 className="text-xl font-bold text-on-primary">Detalhes do Produto</h1>
            </div>
          </div>
        </header>
        
        <div className="container">
          <div className="flex-center py-12">
            <div className="loading-spinner loading-spinner-primary w-8 h-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-background-color">
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <button
                onClick={() => router.push('/loja')}
                className="p-2 hover:bg-primary-dark rounded transition-colors"
              >
                <span className="text-lg">←</span>
              </button>
              <h1 className="text-xl font-bold text-on-primary">Produto Não Encontrado</h1>
            </div>
          </div>
        </header>
        
        <div className="container">
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">❌</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Produto não encontrado</h3>
            <button
              onClick={() => router.push('/loja')}
              className="btn btn-primary"
            >
              Voltar para Loja
            </button>
          </div>
        </div>
      </div>
    );
  }

  const precoUnitario = parseFloat(produto.preco);
  const precoTotal = precoUnitario * quantidade;
  const semEstoque = produto.estoque !== undefined && produto.estoque <= 0;
  const estoqueDisponivel = produto.estoque || 0;

  return (
    <div className="min-h-screen bg-background-color">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button
              onClick={() => router.push('/loja')}
              className="p-2 hover:bg-primary-dark rounded transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="text-xl font-bold text-on-primary">Detalhes do Produto</h1>
          </div>
          
          <div className="header-right">
            <div className="header-actions">
              <button className="header-action-btn">
                <span className="text-lg">❤️</span>
              </button>
              <button className="header-action-btn">
                <span className="text-lg">↗️</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-24">
        <div className="container">
          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="relative bg-gray-50 imagem-container">
              {produto.imagemBase64 ? (
                <img
                  src={`data:image/jpeg;base64,${produto.imagemBase64}`}
                  alt={produto.nome}
                  className="img-limitada-contain w-full"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex-center">
                  <span className="text-4xl text-gray-400">🛍️</span>
                </div>
              )}
              {semEstoque && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex-center">
                  <span className="text-on-primary text-xl font-bold">PRODUTO ESGOTADO</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h1 className="text-lg font-bold text-on-surface mb-2">{produto.nome}</h1>
              <p className="text-xl font-bold text-primary mb-3">
                R$ {precoUnitario.toFixed(2)}
              </p>

              {!semEstoque && estoqueDisponivel > 0 && (
                <div className="flex items-center mb-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1 flex items-center">
                    <span className="text-green-600 font-semibold text-sm">
                      {estoqueDisponivel} disponíveis
                    </span>
                    <span className="ml-2 text-green-500 text-sm">✓ Em estoque</span>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-base font-semibold text-on-surface mb-2">Descrição</h2>
                <p className="text-on-surface leading-relaxed text-sm">{produto.descricao}</p>
              </div>

              {!semEstoque && (
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-on-surface mb-2">Quantidade</h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                      disabled={quantidade <= 1}
                      className="w-8 h-8 bg-gray-200 rounded-full flex-center disabled:opacity-50 hover:bg-gray-300 transition-colors text-base font-semibold"
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-8 text-center">{quantidade}</span>
                    <button
                      onClick={() => setQuantidade(quantidade + 1)}
                      disabled={quantidade >= estoqueDisponivel}
                      className="w-8 h-8 bg-gray-200 rounded-full flex-center disabled:opacity-50 hover:bg-gray-300 transition-colors text-base font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h3 className="font-semibold text-on-surface mb-2 text-sm">Informações do Vendedor</h3>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary rounded-full flex-center text-on-primary font-semibold text-xs">
                    🏪
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-sm">PetLoc Shop</p>
                    <p className="text-on-surface text-xs">{produto.contato}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-base font-semibold text-on-surface mb-2">Entrega e Pagamento</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-on-surface text-sm">
                    <span className="mr-2">🚚</span>
                    <span>Frete grátis</span>
                  </div>
                  <div className="flex items-center text-on-surface text-sm">
                    <span className="mr-2">💳</span>
                    <span>Pagamento combinado com vendedor</span>
                  </div>
                  <div className="flex items-center text-on-surface text-sm">
                    <span className="mr-2">📅</span>
                    <span>Entrega em até 7 dias úteis</span>
                  </div>
                  <div className="flex items-center text-on-surface text-sm">
                    <span className="mr-2">📍</span>
                    <span>Todo Brasil</span>
                  </div>
                </div>
              </div>

              {!semEstoque && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-on-surface text-sm">Total:</span>
                    <span className="text-lg font-bold text-primary">
                      R$ {precoTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 p-4">
        <div className="container">
          <button
            onClick={handleFinalizarCompra}
            disabled={semEstoque}
            className={`w-full py-3 rounded-lg font-bold text-base transition-all duration-200 ${
              semEstoque 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-primary text-on-primary hover:bg-primary-dark shadow-md'
            }`}
          >
            {semEstoque ? 'Produto Esgotado' : `Comprar Agora - R$ ${precoTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}