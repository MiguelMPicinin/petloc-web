'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'pets'),
        where('userId', '==', user.uid)
      ),
      (snapshot) => {
        const petsData: Pet[] = [];
        snapshot.forEach((doc) => {
          petsData.push({ id: doc.id, ...doc.data() } as Pet);
        });
        petsData.sort((a, b) => 
          new Date(b.criadoEm?.toDate()).getTime() - new Date(a.criadoEm?.toDate()).getTime()
        );
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

    return () => unsubscribe();
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
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button
              onClick={() => router.push('/home')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">Meus Pets</h1>
              <p className="text-xs text-blue-100">Gerencie seus pets cadastrados</p>
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
            <div className="loading-spinner loading-spinner-primary"></div>
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
          <div className="space-y-6">
            {filteredPets.map((pet) => (
              <div 
                key={pet.id} 
                className="card overflow-hidden hover-lift border-gray-200"
              >
                <div className="relative imagem-container">
                  {pet.imagemBase64 ? (
                    <img
                      src={`data:image/jpeg;base64,${pet.imagemBase64}`}
                      alt={pet.nome}
                      className="img-limitada w-full"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex-center">
                      <span className="text-4xl text-gray-400">🐾</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex-between mb-3">
                    <h3 className="text-xl font-semibold text-on-surface">
                      {pet.nome}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/pets/editar/${pet.id}`)}
                        className="text-primary-color hover:text-primary-dark p-2 rounded transition-colors"
                        title="Editar pet"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeletePet(pet.id, pet.nome)}
                        className="text-error-color hover:text-red-800 p-2 rounded transition-colors"
                        title="Excluir pet"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-on-surface mb-4 leading-relaxed">
                    {pet.descricao}
                  </p>
                  
                  <div className="flex items-center text-on-surface">
                    <span className="mr-2">📞</span>
                    <span className="font-medium">{pet.contato}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Criado em {pet.criadoEm?.toDate().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => router.push('/pets/cadastro')}
        className="fixed bottom-20 right-6 bg-primary-color text-on-primary w-14 h-14 rounded-full shadow-lg flex-center text-2xl hover:bg-primary-dark transition-colors z-10"
      >
        +
      </button>

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
          className="nav-item active"
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
          className="nav-item"
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