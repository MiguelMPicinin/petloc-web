'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

interface Pet {
  id: string;
  nome: string;
  descricao: string;
  contato: string;
  imagemBase64?: string;
  userId: string;
  criadoEm: any;
}

export default function PetsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const q = query(
        collection(db, 'pets'),
        where('userId', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const petsData: Pet[] = [];
          snapshot.forEach((doc) => {
            petsData.push({ id: doc.id, ...doc.data() } as Pet);
          });
          setPets(petsData);
          setLoading(false);
          setError('');
        },
        (error) => {
          console.error('Erro Firestore:', error);
          if (error.code === 'permission-denied') {
            setError('Permissão negada. Verifique as regras de segurança do Firestore.');
          } else {
            setError('Erro ao carregar pets: ' + error.message);
          }
          setLoading(false);
        }
      );

      return () => {
        try {
          unsubscribe();
        } catch (unsubError) {
          console.error('Erro ao cancelar subscription:', unsubError);
        }
      };
    } catch (error: any) {
      console.error('Erro na configuração da query:', error);
      setError('Erro na configuração: ' + error.message);
      setLoading(false);
    }
  }, [user, router]);

  const handleDeletePet = async (petId: string, petName: string) => {
    if (confirm(`Tem certeza que deseja excluir ${petName}?`)) {
      try {
        await deleteDoc(doc(db, 'pets', petId));
      } catch (error: any) {
        setError('Erro ao excluir pet: ' + error.message);
      }
    }
  };

  const filteredPets = pets.filter(pet =>
    pet.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.descricao.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-color pb-16">
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
              <h1 className="text-xl font-bold">Meus Pets</h1>
              <p className="text-xs text-blue-100">{pets.length} pets cadastrados</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/pets/cadastro')}
            className="bg-surface-color text-primary-color p-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="text-lg">+</span>
          </button>
        </div>
      </header>

      <div className="container">
        {/* Barra de Pesquisa */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar pets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-12"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>
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
        ) : filteredPets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">🐾</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchQuery ? 'Nenhum pet encontrado' : 'Nenhum Pet Cadastrado'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Tente buscar com outros termos'
                : 'Toque no + para adicionar seu primeiro pet!'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/pets/cadastro')}
                className="btn btn-primary"
              >
                Cadastrar Primeiro Pet
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPets.map((pet) => (
              <div key={pet.id} className="card cursor-pointer">
                <div className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Imagem do Pet */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-center">
                        {pet.imagemBase64 ? (
                          <img
                            src={`data:image/jpeg;base64,${pet.imagemBase64}`}
                            alt={pet.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-gray-400">🐾</span>
                        )}
                      </div>
                    </div>

                    {/* Informações do Pet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex-between mb-2">
                        <h3 className="text-lg font-semibold text-on-surface truncate">
                          {pet.nome}
                        </h3>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => router.push(`/pets/editar/${pet.id}`)}
                            className="text-primary-color hover:text-primary-dark p-1 rounded transition-colors"
                            title="Editar pet"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeletePet(pet.id, pet.nome)}
                            className="text-error-color hover:text-red-800 p-1 rounded transition-colors"
                            title="Excluir pet"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-on-surface text-sm mb-2 line-clamp-2">
                        {pet.descricao}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📞</span>
                        <span>{pet.contato}</span>
                      </div>

                      <div className="mt-2 text-xs text-gray-400">
                        Cadastrado em {pet.criadoEm?.toDate().toLocaleDateString('pt-BR')}
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
        onClick={() => router.push('/pets/cadastro')}
        className="fixed bottom-20 right-6 bg-primary-color text-on-primary w-14 h-14 rounded-full shadow-lg flex-center text-2xl hover:bg-primary-dark transition-colors z-10"
      >
        +
      </button>
    </div>
  );
}