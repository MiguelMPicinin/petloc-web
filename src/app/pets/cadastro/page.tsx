'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

export default function CadastroPetPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [contato, setContato] = useState('');
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

    if (!nome || !descricao || !contato) {
      setError('Preencha todos os campos obrigatórios');
      setLoading(false);
      return;
    }

    try {
      let imagemBase64: string | undefined;

      if (imagem) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          imagemBase64 = base64String.split(',')[1];
        };
        reader.readAsDataURL(imagem);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await addDoc(collection(db, 'pets'), {
        nome: nome.trim(),
        descricao: descricao.trim(),
        contato: contato.trim(),
        imagemBase64: imagemBase64 || '',
        userId: user.uid,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      });

      router.push('/pets');
    } catch (error: any) {
      setError('Erro ao cadastrar pet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeImagem = () => {
    setImagem(null);
    setImagemPreview('');
  };

  return (
    <div className="min-h-screen bg-background-color">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/pets')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="text-xl font-bold">Cadastrar Pet</h1>
          </div>
        </div>
      </header>

      <div className="container">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          {error && (
            <div className="alert alert-error mb-6">
              {error}
            </div>
          )}

          {/* Upload de Imagem */}
          <div className="card mb-6">
            <label className="form-label">
              Foto do Pet
            </label>
            
            {imagemPreview ? (
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={imagemPreview}
                    alt="Preview"
                    className="w-48 h-48 rounded-lg object-cover mx-auto shadow-md"
                  />
                  <button
                    type="button"
                    onClick={removeImagem}
                    className="absolute -top-2 -right-2 bg-error-color text-on-error w-8 h-8 rounded-full flex-center text-sm hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Imagem selecionada: {imagem?.name}
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-color transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="imagem-upload"
                />
                <label htmlFor="imagem-upload" className="cursor-pointer">
                  <div className="text-4xl text-gray-400 mb-2">📷</div>
                  <p className="text-gray-600 font-medium">Clique para adicionar foto</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Ou arraste e solte uma imagem aqui
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Formulário */}
          <div className="card space-y-6">
            {/* Nome */}
            <div className="form-group">
              <label className="form-label">
                Nome do Pet *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="form-input"
                placeholder="Ex: Rex, Luna, Bob..."
                required
              />
            </div>

            {/* Descrição */}
            <div className="form-group">
              <label className="form-label">
                Descrição *
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="form-input form-textarea"
                placeholder="Descreva seu pet: raça, idade, características, personalidade..."
                required
              />
            </div>

            {/* Contato */}
            <div className="form-group">
              <label className="form-label">
                Contato *
              </label>
              <input
                type="text"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className="form-input"
                placeholder="Telefone, WhatsApp, email..."
                required
              />
            </div>

            {/* Botões */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/pets')}
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
                  'Cadastrar Pet'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}