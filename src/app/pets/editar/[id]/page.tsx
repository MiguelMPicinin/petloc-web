'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/config';

interface Pet {
  id: string;
  nome: string;
  descricao: string;
  contato: string;
  imagemBase64?: string;
  userId: string;
}

export default function EditarPetPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [contato, setContato] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadPet();
  }, [user, id, router]);

  const loadPet = async () => {
    try {
      const docRef = doc(db, 'pets', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const petData = docSnap.data() as Pet;
        if (petData.userId !== user?.uid) {
          setError('Você não tem permissão para editar este pet');
          setLoading(false);
          return;
        }
        setNome(petData.nome);
        setDescricao(petData.descricao);
        setContato(petData.contato);
        if (petData.imagemBase64) {
          setImagemPreview(`data:image/jpeg;base64,${petData.imagemBase64}`);
        }
      } else {
        setError('Pet não encontrado');
      }
    } catch (error: any) {
      setError('Erro ao carregar pet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
    setUpdating(true);
    setError('');

    if (!nome || !descricao || !contato) {
      setError('Preencha todos os campos obrigatórios');
      setUpdating(false);
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

      const updateData: any = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        contato: contato.trim(),
        atualizadoEm: new Date(),
      };

      if (imagemBase64) {
        updateData.imagemBase64 = imagemBase64;
      }

      await updateDoc(doc(db, 'pets', id), updateData);
      router.push('/pets');
    } catch (error: any) {
      setError('Erro ao atualizar pet: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const removeImagem = () => {
    setImagem(null);
    setImagemPreview('');
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

  return (
    <div className="min-h-screen bg-background-color">
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/pets')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <h1 className="text-xl font-bold">Editar Pet</h1>
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
                <div className="relative inline-block imagem-container">
                  <img
                    src={imagemPreview}
                    alt="Preview"
                    className="img-limitada rounded-lg mx-auto shadow-md"
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
                  {imagem ? 'Nova imagem selecionada' : 'Imagem atual'}
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
                  <p className="text-gray-600 font-medium">Clique para alterar a foto</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Ou arraste e solte uma imagem aqui
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Formulário */}
          <div className="card space-y-6">
            <div className="form-group">
              <label className="form-label">
                Nome do Pet *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="form-input"
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
                rows={4}
                className="form-input form-textarea"
                required
              />
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
                required
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/pets')}
                className="flex-1 btn btn-outlined"
                disabled={updating}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex-1 btn btn-primary"
              >
                {updating ? (
                  <span className="flex-center">
                    <div className="loading-spinner"></div>
                    Atualizando...
                  </span>
                ) : (
                  'Atualizar Pet'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}