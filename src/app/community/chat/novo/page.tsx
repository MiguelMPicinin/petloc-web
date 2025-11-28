'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const categorias = [
  'Geral',
  'Cachorros',
  'Gatos',
  'Pássaros',
  'Roedores',
  'Répteis',
  'Peixes',
  'Outros Pets'
];

const icones = ['💬', '🐕', '🐈', '🐦', '🐹', '🐍', '🐠', '🐢', '🌟', '❤️'];

export default function NovoChatGroupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(categorias[0]);
  const [icone, setIcone] = useState('💬');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!nome.trim() || !descricao.trim()) {
      setError('Preencha todos os campos obrigatórios');
      setLoading(false);
      return;
    }

    try {
      const grupoData = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        categoria: categoria,
        icone: icone,
        criadorId: user.uid,
        criadorNome: user.displayName || 'Usuário',
        membros: [user.uid],
        membrosCount: 1,
        ultimaMensagem: '',
        ultimaMensagemData: serverTimestamp(),
        ativo: true,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      };

      await addDoc(collection(db, 'chat_grupos'), grupoData);

      router.push('/community');
    } catch (error: any) {
      setError('Erro ao criar grupo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-color">
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/community')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="text-xl font-bold">Criar Grupo de Chat</h1>
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

          <div className="card space-y-6">
            {/* Nome do Grupo */}
            <div className="form-group">
              <label className="form-label">
                Nome do Grupo *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="form-input"
                placeholder="Ex: Grupo de Cachorros"
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
                placeholder="Descreva o propósito do grupo..."
                required
              />
            </div>

            {/* Categoria */}
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

            {/* Ícone */}
            <div>
              <label className="form-label">
                Ícone do Grupo
              </label>
              <div className="grid grid-cols-5 gap-3">
                {icones.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setIcone(icon)}
                    className={`text-2xl p-4 rounded-lg transition-all duration-200 ${
                      icone === icon
                        ? 'bg-primary-color text-on-primary transform scale-110 shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Ícone selecionado: {icone}
              </p>
            </div>

            {/* Preview do Grupo */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-on-surface mb-3">Preview do Grupo:</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex-center text-xl">
                  {icone}
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface">{nome || 'Nome do Grupo'}</h4>
                  <p className="text-on-surface text-sm">{descricao || 'Descrição do grupo'}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="badge badge-primary">
                      {categoria}
                    </span>
                    <span className="text-xs text-gray-500">1 membro</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/community')}
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
                    Criando...
                  </span>
                ) : (
                  'Criar Grupo'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}