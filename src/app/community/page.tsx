'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

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
  membrosCount: number;
  ultimaMensagem: string;
  ultimaMensagemData: any;
  icone: string;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'blog' | 'chat'>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Carregar posts do blog
    const blogUnsubscribe = onSnapshot(
      collection(db, 'blog_posts'),
      (snapshot) => {
        const posts: BlogPost[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.ativo !== false) {
            posts.push({ id: doc.id, ...data } as BlogPost);
          }
        });
        // Ordenar por data (mais recentes primeiro)
        posts.sort((a, b) => 
          new Date(b.dataPublicacao?.toDate()).getTime() - new Date(a.dataPublicacao?.toDate()).getTime()
        );
        setBlogPosts(posts);
        setLoading(false);
      }
    );

    // Carregar grupos de chat
    const chatUnsubscribe = onSnapshot(
      collection(db, 'chat_grupos'),
      (snapshot) => {
        const groups: ChatGroup[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.ativo !== false) {
            groups.push({ id: doc.id, ...data } as ChatGroup);
          }
        });
        setChatGroups(groups);
        setLoading(false);
      }
    );

    return () => {
      blogUnsubscribe();
      chatUnsubscribe();
    };
  }, [user, router]);

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
            <h1 className="text-xl font-bold">Comunidade PetLoc</h1>
          </div>
        </div>
      </header>

      {/* Abas */}
      <div className="flex border-b bg-surface-color">
        <button
          onClick={() => setAbaAtiva('blog')}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            abaAtiva === 'blog'
              ? 'border-b-2 border-primary-color text-primary-color'
              : 'text-on-surface hover:text-primary-color'
          }`}
        >
          📝 Blog
        </button>
        <button
          onClick={() => setAbaAtiva('chat')}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            abaAtiva === 'chat'
              ? 'border-b-2 border-primary-color text-primary-color'
              : 'text-on-surface hover:text-primary-color'
          }`}
        >
          💬 Grupos
        </button>
      </div>

      <div className="container">
        {abaAtiva === 'blog' && (
          <div>
            <h2 className="text-lg font-semibold text-on-surface mb-4">Últimas do Blog</h2>
            
            {loading ? (
              <div className="flex-center py-12">
                <div className="loading-spinner-primary"></div>
              </div>
            ) : blogPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 text-gray-300">📝</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhum post no blog
                </h3>
                <p className="text-gray-500">
                  Em breve teremos conteúdo interessante para você!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <div 
                    key={post.id}
                    className="card hover-lift cursor-pointer"
                    onClick={() => router.push(`/blog/${post.id}`)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex-center flex-shrink-0">
                        <span className="text-lg">{post.icone || '📄'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-on-surface mb-1">
                          {post.titulo}
                        </h3>
                        <p className="text-on-surface text-sm mb-2 line-clamp-2">
                          {post.descricao}
                        </p>
                        <div className="flex-between text-xs text-gray-500">
                          <span>Por {post.autor}</span>
                          <span>{post.tempoLeitura || '5'} min de leitura</span>
                        </div>
                        <div className="flex-between mt-2">
                          <span className="badge badge-primary">
                            {post.categoria}
                          </span>
                          <span className="text-xs text-gray-500">
                            {post.dataPublicacao?.toDate().toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'chat' && (
          <div>
            <div className="flex-between mb-4">
              <h2 className="text-lg font-semibold text-on-surface">Grupos de Conversa</h2>
              <button
                onClick={() => router.push('/community/chat/novo')}
                className="btn btn-primary btn-sm"
              >
                Novo Grupo
              </button>
            </div>

            {loading ? (
              <div className="flex-center py-12">
                <div className="loading-spinner-primary"></div>
              </div>
            ) : chatGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 text-gray-300">💬</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhum grupo de chat
                </h3>
                <p className="text-gray-500 mb-6">
                  Crie o primeiro grupo para começar a conversar!
                </p>
                <button
                  onClick={() => router.push('/community/chat/novo')}
                  className="btn btn-primary"
                >
                  Criar Primeiro Grupo
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {chatGroups.map((group) => (
                  <div 
                    key={group.id}
                    className="card hover-lift cursor-pointer"
                    onClick={() => router.push(`/community/chat/${group.id}`)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex-center flex-shrink-0">
                        <span className="text-lg">{group.icone || '💬'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex-between mb-1">
                          <h3 className="font-semibold text-on-surface">
                            {group.nome}
                          </h3>
                          <span className="bg-gray-100 text-on-surface px-2 py-1 rounded text-xs">
                            {group.membrosCount} membros
                          </span>
                        </div>
                        <p className="text-on-surface text-sm mb-2">
                          {group.descricao}
                        </p>
                        <div className="flex-between items-center text-xs text-gray-500">
                          <span className="truncate">
                            {group.ultimaMensagem || 'Nenhuma mensagem ainda'}
                          </span>
                          {group.ultimaMensagemData && (
                            <span>
                              {group.ultimaMensagemData.toDate().toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
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
          className="nav-item"
        >
          <span className="nav-icon">🐾</span>
          <span className="nav-label">Pets</span>
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
          className="nav-item active"
        >
          <span className="nav-icon">👥</span>
          <span className="nav-label">Comunidade</span>
        </button>
      </nav>
    </div>
  );
}