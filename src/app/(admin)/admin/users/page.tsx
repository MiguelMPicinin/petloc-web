'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/config';

interface User {
  id: string;
  nome: string;
  email: string;
  role: 'user' | 'admin';
  criadoEm: any;
}

export default function AdminUsersPage() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || userRole !== 'admin') {
      return;
    }
    loadUsers();
  }, [user, userRole]);

  const loadUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(usersData);
    } catch (error: any) {
      setError('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        role: newRole,
        atualizadoEm: new Date()
      });
      await loadUsers();
    } catch (error: any) {
      setError('Erro ao atualizar usuário: ' + error.message);
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut();
      router.push('/login');
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-color p-4">
      <header className="card mb-6">
        <div className="flex-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-color">
              👥 Administração de Usuários
            </h1>
            <p className="text-on-surface mt-1">
              Gerencie permissões e acesso dos usuários
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/home')}
              className="btn btn-primary"
            >
              Voltar ao App
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-error"
            >
              🚪 Sair
            </button>
          </div>
        </div>

        <nav className="flex space-x-2 border-t pt-4 mt-4 flex-wrap gap-2">
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-primary-color text-on-primary rounded-full font-medium transition-colors"
          >
            👥 Usuários
          </button>
          <button
            onClick={() => router.push('/admin/missing-pets')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color"
          >
            🐕 Pets Desaparecidos
          </button>
          <button
            onClick={() => router.push('/admin/blog-chat')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color"
          >
            💬 Blog/Chat
          </button>
          <button
            onClick={() => router.push('/admin/loja')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color"
          >
            🛍️ Loja
          </button>
        </nav>
      </header>

      <div className="card mb-6">
        <input
          type="text"
          placeholder="🔍 Buscar usuários por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
        />
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex-center py-12">
            <div className="loading-spinner-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">👥</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Tente buscar com outros termos' : 'Nenhum usuário cadastrado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface-color divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-color rounded-full flex-center text-on-primary font-semibold">
                          {userItem.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-on-surface">
                            {userItem.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {userItem.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-on-surface">{userItem.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          userItem.role === 'admin'
                            ? 'badge-success'
                            : 'badge-primary'
                        }`}
                      >
                        {userItem.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userItem.criadoEm?.toDate().toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {userItem.id !== user.uid && (
                        <button
                          onClick={() =>
                            updateUserRole(
                              userItem.id,
                              userItem.role === 'admin' ? 'user' : 'admin'
                            )
                          }
                          className={`btn btn-sm ${
                            userItem.role === 'admin'
                              ? 'btn-secondary'
                              : 'btn-primary'
                          } mr-2`}
                        >
                          {userItem.role === 'admin' ? 'Rebaixar a Usuário' : 'Promover a Admin'}
                        </button>
                      )}
                      {userItem.id === user.uid && (
                        <span className="text-gray-400 text-xs">Usuário atual</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-color">{users.length}</div>
          <div className="text-on-surface">Total de Usuários</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-success-color">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-on-surface">Administradores</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-accent-color">
            {users.filter(u => u.role === 'user').length}
          </div>
          <div className="text-on-surface">Usuários Normais</div>
        </div>
      </div>
    </div>
  );
}