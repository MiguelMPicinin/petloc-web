'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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
}

export default function ComprarProdutoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(true);
  const [comprando, setComprando] = useState(false);
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

  const handleCompra = async () => {
    if (!produto) return;

    setComprando(true);
    // Simular processo de compra
    setTimeout(() => {
      setComprando(false);
      alert(`Compra realizada com sucesso!\n\nProduto: ${produto.nome}\nQuantidade: ${quantidade}\nTotal: R$ ${(parseFloat(produto.preco) * quantidade).toFixed(2)}\n\nEntre em contato com o vendedor: ${produto.contato}`);
      router.push('/loja');
    }, 2000);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-color flex-center">
        <div className="loading-spinner-primary"></div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-background-color flex-center">
        <div className="text-center">
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
    );
  }

  const precoUnitario = parseFloat(produto.preco);
  const precoTotal = precoUnitario * quantidade;
  const semEstoque = produto.estoque !== undefined && produto.estoque <= 0;

  return (
    <div className="min-h-screen bg-background-color pb-20">
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/loja')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="text-xl font-bold">Detalhes do Produto</h1>
          </div>
        </div>
      </header>

      <div className="container">
        {error && (
          <div className="alert alert-error mb-6">
            {error}
          </div>
        )}

        <div className="card overflow-hidden">
          {/* Imagem do Produto */}
          <div className="relative">
            {produto.imagemBase64 ? (
              <img
                src={`data:image/jpeg;base64,${produto.imagemBase64}`}
                alt={produto.nome}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 flex-center">
                <span className="text-4xl text-gray-400">🛍️</span>
              </div>
            )}
            {semEstoque && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex-center">
                <span className="text-on-primary text-2xl font-bold">PRODUTO ESGOTADO</span>
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-on-surface mb-2">{produto.nome}</h1>
            <p className="text-3xl font-bold text-primary-color mb-4">
              R$ {precoUnitario.toFixed(2)}
            </p>

            {!semEstoque && produto.estoque !== undefined && (
              <div className="flex items-center mb-4">
                <span className="badge badge-success">
                  {produto.estoque} disponíveis
                </span>
                <span className="ml-2 text-success-color text-sm">✓ Em estoque</span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-on-surface mb-2">Descrição</h2>
              <p className="text-on-surface leading-relaxed">{produto.descricao}</p>
            </div>

            {/* Quantidade */}
            {!semEstoque && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-on-surface mb-2">Quantidade</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    disabled={quantidade <= 1}
                    className="w-10 h-10 bg-gray-200 rounded-lg flex-center disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold">{quantidade}</span>
                  <button
                    onClick={() => setQuantidade(quantidade + 1)}
                    disabled={produto.estoque !== undefined && quantidade >= produto.estoque}
                    className="w-10 h-10 bg-gray-200 rounded-lg flex-center disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Informações do Vendedor */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-on-surface mb-2">Informações do Vendedor</h3>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-color rounded-full flex-center text-on-primary font-semibold">
                  🏪
                </div>
                <div className="ml-3">
                  <p className="font-medium">PetLoc Shop</p>
                  <p className="text-on-surface text-sm">{produto.contato}</p>
                </div>
              </div>
            </div>

            {/* Total */}
            {!semEstoque && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary-color">
                    R$ {precoTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão de Compra Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-color border-t border-gray-200 p-4">
        <button
          onClick={handleCompra}
          disabled={semEstoque || comprando}
          className={`btn btn-lg w-full ${
            semEstoque
              ? 'btn-disabled'
              : 'btn-primary'
          }`}
        >
          {comprando ? (
            <span className="flex-center">
              <div className="loading-spinner"></div>
              Processando...
            </span>
          ) : semEstoque ? (
            'Produto Esgotado'
          ) : (
            `Comprar Agora - R$ ${precoTotal.toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}