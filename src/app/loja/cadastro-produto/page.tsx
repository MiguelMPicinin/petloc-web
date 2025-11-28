'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const categorias = [
  'Ração',
  'Brinquedos',
  'Coleiras',
  'Medicamentos',
  'Higiene',
  'Acessórios',
  'Outros'
];

const icones = ['💬', '🐕', '🐈', '🐦', '🐹', '🐍', '🐠', '🐢', '🌟', '❤️'];

export default function CadastroProdutoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [contato, setContato] = useState('');
  const [estoque, setEstoque] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]);
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagem(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagemPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!nome || !descricao || !preco || !contato) {
      setError('Preencha todos os campos obrigatórios');
      setLoading(false);
      return;
    }

    const precoNum = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      setError('Preço inválido');
      setLoading(false);
      return;
    }

    try {
      let imagemBase64: string | undefined;

      if (imagem) {
        const base64String = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imagem);
        });
        imagemBase64 = base64String.split(',')[1];
      }

      await addDoc(collection(db, 'produtos_loja'), {
        nome: nome.trim(),
        descricao: descricao.trim(),
        preco: precoNum.toFixed(2),
        contato: contato.trim(),
        estoque: estoque ? parseInt(estoque) : null,
        categoria: categoria,
        imagemBase64: imagemBase64 || '',
        userId: user.uid,
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      });

      router.push('/loja/meus-produtos');
    } catch (error: any) {
      setError('Erro ao cadastrar produto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeImagem = () => {
    setImagem(null);
    setImagemPreview('');
  };

  return (
    <div className="min-h-screen bg-background-color flex flex-col">
      <header className="w-full bg-primary fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/loja/meus-produtos')}
              className="p-2 hover:bg-primary-dark rounded transition-colors"
            >
              <span className="text-lg text-on-primary">←</span>
            </button>
            <h1 className="text-xl font-bold text-on-primary">Cadastrar Produto</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 pt-16 flex justify-center">
        <div className="w-full max-w-2xl px-4">
          <form onSubmit={handleSubmit} className="w-full">
            {error && (
              <div className="alert alert-error mb-4">
                {error}
              </div>
            )}

            <div className="card mb-4">
              <label className="form-label">
                Imagem do Produto
              </label>
              
              {imagemPreview ? (
                <div className="text-center">
                  <div className="relative inline-block imagem-container">
                    <img
                      src={imagemPreview}
                      alt="Preview"
                      className="img-limitada-medium rounded-lg mx-auto shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeImagem}
                      className="absolute -top-2 -right-2 bg-error text-on-error w-6 h-6 rounded-full flex-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Imagem selecionada: {imagem?.name}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="imagem-upload"
                  />
                  <label htmlFor="imagem-upload" className="cursor-pointer">
                    <div className="text-3xl text-gray-400 mb-2">📷</div>
                    <p className="text-gray-600 font-medium text-sm">Clique para adicionar imagem</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Ou arraste e solte uma imagem aqui
                    </p>
                  </label>
                </div>
              )}
            </div>

            <div className="card space-y-4">
              <div className="form-group">
                <label className="form-label">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Ração Premium para Cães"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Descrição *
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  className="form-input form-textarea"
                  placeholder="Descreva o produto, suas características, benefícios..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">
                    Preço *
                  </label>
                  <input
                    type="text"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Estoque
                  </label>
                  <input
                    type="number"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    className="form-input"
                    placeholder="Opcional"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Categoria *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="form-input"
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Contato *
                </label>
                <input
                  type="text"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  className="form-input"
                  placeholder="WhatsApp, email, telefone..."
                  required
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/loja/meus-produtos')}
                  className="flex-1 btn btn-outlined"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn btn-primary"
                >
                  {loading ? (
                    <span className="flex-center">
                      <div className="loading-spinner"></div>
                      Cadastrando...
                    </span>
                  ) : (
                    'Cadastrar Produto'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

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
          onClick={() => router.push('/desaparecidos')}
          className="nav-item"
        >
          <span className="nav-icon">⚠️</span>
          <span className="nav-label">Desaparecidos</span>
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