'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase/config';

interface AuthContextType {
  user: User | null;
  userRole: 'user' | 'admin' | null;
  userData: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userRole: null, 
  userData: null,
  loading: true,
  signOut: async () => {},
  refreshUserData: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar usuário no Firestore por EMAIL
  const fetchUserByEmail = async (email: string) => {
    try {
      console.log('🔍 Buscando usuário no Firestore por email:', email);
      
      const usersQuery = query(
        collection(db, 'users'), 
        where('email', '==', email)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        // Encontrou usuário pelo email
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('✅ Usuário encontrado no Firestore:', userData);
        
        setUserData(userData);
        setUserRole(userData.role || 'user');
        return userData;
      } else {
        // Não encontrou - criar novo usuário
        console.log('📝 Criando novo usuário no Firestore...');
        
        const newUserData = {
          id: user?.uid || '',
          nome: user?.displayName || 'Usuário',
          email: email,
          role: 'user', // Padrão é user
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };
        
        // Se temos um user com UID, usar o UID como ID do documento
        if (user?.uid) {
          await setDoc(doc(db, 'users', user.uid), newUserData);
        } else {
          // Se não tem UID, criar com ID automático
          const docRef = await setDoc(doc(collection(db, 'users')), newUserData);
        }
        
        setUserData(newUserData);
        setUserRole('user');
        return newUserData;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar/criar usuário no Firestore:', error);
      setUserRole('user');
      return null;
    }
  };

  const refreshUserData = async () => {
    if (user?.email) {
      await fetchUserByEmail(user.email);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 Estado de autenticação alterado:', user ? user.email : 'Nenhum usuário');
      setLoading(true);
      
      if (user && user.email) {
        setUser(user);
        await fetchUserByEmail(user.email);
      } else {
        setUser(null);
        setUserRole(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserRole(null);
      setUserData(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    userData,
    loading,
    signOut,
    refreshUserData
  };

  console.log('🎯 AuthContext atualizado:', { 
    user: user?.email, 
    userRole, 
    loading 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};