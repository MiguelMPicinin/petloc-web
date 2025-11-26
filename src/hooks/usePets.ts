import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

interface Pet {
  id: string;
  nome: string;
  descricao: string;
  contato: string;
  imagemBase64?: string;
  userId: string;
  criadoEm: Date;
}

export function usePets() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'pets'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const petsData: Pet[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          petsData.push({
            id: doc.id,
            ...data,
            criadoEm: data.criadoEm?.toDate(),
          } as Pet);
        });
        setPets(petsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addPet = async (pet: Omit<Pet, 'id' | 'userId' | 'criadoEm'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      await addDoc(collection(db, 'pets'), {
        ...pet,
        userId: user.uid,
        criadoEm: new Date(),
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updatePet = async (id: string, updates: Partial<Pet>) => {
    try {
      await updateDoc(doc(db, 'pets', id), updates);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deletePet = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pets', id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    pets,
    loading,
    error,
    addPet,
    updatePet,
    deletePet,
  };
}