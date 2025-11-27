'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/config';

interface BlogPost {
  id: string;
  titulo: string;
  descricao: string;
  autor: string;
  categoria: string;
  icone: string;
  tempoLeitura: string;
  dataPublicacao: any;
  ativo: boolean;
}

interface ChatGroup {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  criadorId: string;
  criadorNome: string;
  membrosCount: number;
  ativo: boolean;
  criadoEm: any;
}

export default function AdminBlogChatPage() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'blog' | 'chat'>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || userRole !== 'admin') {
      return;
    }
    loadData();
  }, [user, userRole]);

  const loadData = async () => {
    try {
      // Carregar posts do blog
      const blogSnapshot = await getDocs(collection(db, 'blog_posts'));
      const blogData: BlogPost[] = [];
      blogSnapshot.forEach((doc) => {
        blogData.push({ id: doc.id, ...doc.data() } as BlogPost);
      });
      setBlogPosts(blogData);

      // Carregar grupos de chat
      const chatSnapshot = await getDocs(collection(db, 'chat_grupos'));
      const chatData: ChatGroup[] = [];
      chatSnapshot.forEach((doc) => {
        chatData.push({ id: doc.id, ...doc.data() } as ChatGroup);
      });
      setChatGroups(chatData);
    } catch (error: any) {
      setError('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlogPostAtivo = async (postId: string, ativo: boolean) => {
    try {
      await updateDoc(doc(db, 'blog_posts', postId), {
        ativo: !ativo,
        atualizadoEm: new Date(),
      });
      await loadData();
    } catch (error: any) {
      setError('Erro ao atualizar post: ' + error.message);
    }
  };

  const toggleChatGroupAtivo = async (groupId: string, ativo: boolean) => {
    try {
      await updateDoc(doc(db, 'chat_grupos', groupId), {
        ativo: !ativo,
        atualizadoEm: new Date(),
      });
      await loadData();
    } catch (error: any) {
      setError('Erro ao atualizar grupo: ' + error.message);
    }
  };

  const deletarBlogPost = async (postId: string) => {
    if (confirm('Tem certeza que deseja excluir este post?')) {
      try {
        await deleteDoc(doc(db, 'blog_posts', postId));
        await loadData();
      } catch (error: any) {
        setError('Erro ao excluir post: ' + error.message);
      }
    }
  };

  const deletarChatGroup = async (groupId: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo?')) {
      try {
        await deleteDoc(doc(db, 'chat_grupos', groupId));
        await loadData();
      } catch (error: any) {
        setError('Erro ao excluir grupo: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut();
      router.push('/login');
    }
  };

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-color p-4">
      {/* Header com Navegação */}
      <header className="card mb-6">
        <div className="flex-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-color">
              💬 Administração do Blog/Chat
            </h1>
            <p className="text-on-surface mt-1">
              Gerencie posts do blog e grupos de conversa
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

        {/* Navegação entre Telas Admin */}
        <nav className="flex space-x-2 border-t pt-4 mt-4 flex-wrap gap-2">
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color flex items-center"
          >
            👥 Usuários
          </button>
          <button
            onClick={() => router.push('/admin/missing-pets')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color flex items-center"
          >
            🐕 Pets Desaparecidos
          </button>
          <button
            onClick={() => router.push('/admin/blog-chat')}
            className="px-4 py-2 bg-primary-color text-on-primary rounded-full font-medium transition-colors flex items-center"
          >
            💬 Blog/Chat
          </button>
          <button
            onClick={() => router.push('/admin/loja')}
            className="px-4 py-2 bg-surface-color text-on-surface border border-gray-300 rounded-full font-medium transition-colors hover:border-primary-color flex items-center"
          >
            🛍️ Loja
          </button>
        </nav>
      </header>

      {/* Abas Internas */}
      <div className="flex bg-surface-color rounded-lg shadow-sm mb-6">
        <button
          onClick={() => setAbaAtiva('blog')}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            abaAtiva === 'blog'
              ? 'border-b-2 border-primary-color text-primary-color'
              : 'text-on-surface hover:text-primary-color'
          }`}
        >
          📝 Blog Posts
        </button>
        <button
          onClick={() => setAbaAtiva('chat')}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            abaAtiva === 'chat'
              ? 'border-b-2 border-primary-color text-primary-color'
              : 'text-on-surface hover:text-primary-color'
          }`}
        >
          💬 Grupos de Chat
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex-center py-12">
          <div className="loading-spinner-primary"></div>
        </div>
      ) : (
        <>
          {abaAtiva === 'blog' && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-on-surface">
                  Posts do Blog ({blogPosts.length})
                </h2>
              </div>
              {blogPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 text-gray-300">📝</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhum post no blog
                  </h3>
                  <p className="text-gray-500">
                    Não há posts do blog para gerenciar
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {blogPosts.map((post) => (
                    <div key={post.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{post.icone}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-on-surface">
                                {post.titulo}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Por {post.autor} • {post.categoria} • {post.tempoLeitura} min
                              </p>
                            </div>
                          </div>
                          <p className="text-on-surface text-sm mb-2">
                            {post.descricao}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              Criado em {post.dataPublicacao?.toDate().toLocaleDateString('pt-BR')}
                            </span>
                            <span className={`badge ${
                              post.ativo 
                                ? 'badge-success' 
                                : 'badge-error'
                            }`}>
                              {post.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => toggleBlogPostAtivo(post.id, post.ativo)}
                            className={`btn btn-sm ${
                              post.ativo
                                ? 'btn-secondary'
                                : 'btn-success'
                            }`}
                          >
                            {post.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => deletarBlogPost(post.id)}
                            className="btn btn-sm btn-error"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {abaAtiva === 'chat' && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-on-surface">
                  Grupos de Chat ({chatGroups.length})
                </h2>
              </div>
              {chatGroups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 text-gray-300">💬</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhum grupo de chat
                  </h3>
                  <p className="text-gray-500">
                    Não há grupos de chat para gerenciar
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {chatGroups.map((group) => (
                    <div key={group.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">💬</span>
                            <div>
                              <h3 className="text-lg font-semibold text-on-surface">
                                {group.nome}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Criado por {group.criadorNome} • {group.categoria} • {group.membrosCount} membros
                              </p>
                            </div>
                          </div>
                          <p className="text-on-surface text-sm mb-2">
                            {group.descricao}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              Criado em {group.criadoEm?.toDate().toLocaleDateString('pt-BR')}
                            </span>
                            <span className={`badge ${
                              group.ativo 
                                ? 'badge-success' 
                                : 'badge-error'
                            }`}>
                              {group.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => toggleChatGroupAtivo(group.id, group.ativo)}
                            className={`btn btn-sm ${
                              group.ativo
                                ? 'btn-secondary'
                                : 'btn-success'
                            }`}
                          >
                            {group.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => deletarChatGroup(group.id)}
                            className="btn btn-sm btn-error"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}