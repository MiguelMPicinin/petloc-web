'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/config';
import { NewsArticle, newsService } from '@/services/newsService';

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

interface ApiNewsManagement {
  id: string;
  newsId: string;
  title: string;
  source: string;
  apiSource: string;
  hidden: boolean;
  hiddenAt: any;
  hiddenBy: string;
}

export default function AdminBlogChatPage() {
  const { user, userRole, signOut } = useAuth();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'blog' | 'chat' | 'api-news'>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [apiNews, setApiNews] = useState<NewsArticle[]>([]);
  const [newsManagement, setNewsManagement] = useState<ApiNewsManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNews, setLoadingNews] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || userRole !== 'admin') {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, userRole, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const blogQuery = query(collection(db, 'blog_posts'), orderBy('dataPublicacao', 'desc'));
      const blogSnapshot = await getDocs(blogQuery);
      const blogData: BlogPost[] = [];
      blogSnapshot.forEach((doc) => {
        blogData.push({ id: doc.id, ...doc.data() } as BlogPost);
      });
      setBlogPosts(blogData);

      const chatQuery = query(collection(db, 'chat_grupos'), orderBy('criadoEm', 'desc'));
      const chatSnapshot = await getDocs(chatQuery);
      const chatData: ChatGroup[] = [];
      chatSnapshot.forEach((doc) => {
        chatData.push({ id: doc.id, ...doc.data() } as ChatGroup);
      });
      setChatGroups(chatData);

      const newsManagementQuery = query(collection(db, 'api_news_management'));
      const newsManagementSnapshot = await getDocs(newsManagementQuery);
      const managementData: ApiNewsManagement[] = [];
      newsManagementSnapshot.forEach((doc) => {
        managementData.push({ id: doc.id, ...doc.data() } as ApiNewsManagement);
      });
      setNewsManagement(managementData);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadApiNews = async () => {
    try {
      setLoadingNews(true);
      setError('');
      const news = await newsService.fetchAllPetNews();
      setApiNews(news);
    } catch (error: any) {
      setError('Erro ao carregar notícias da API: ' + error.message);
    } finally {
      setLoadingNews(false);
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

  const hideApiNews = async (newsArticle: NewsArticle) => {
    if (confirm('Tem certeza que deseja ocultar esta notícia?')) {
      try {
        const existingEntry = newsManagement.find(item => item.newsId === newsArticle.id);
        
        if (existingEntry) {
          await updateDoc(doc(db, 'api_news_management', existingEntry.id), {
            hidden: true,
            hiddenAt: new Date(),
            hiddenBy: user?.email || 'admin',
          });
        } else {
          await addDoc(collection(db, 'api_news_management'), {
            newsId: newsArticle.id,
            title: newsArticle.title,
            source: newsArticle.source,
            apiSource: newsArticle.apiSource,
            hidden: true,
            hiddenAt: new Date(),
            hiddenBy: user?.email || 'admin',
            createdAt: new Date(),
          });
        }
        await loadData();
      } catch (error: any) {
        setError('Erro ao ocultar notícia: ' + error.message);
      }
    }
  };

  const showApiNews = async (managementId: string) => {
    try {
      await updateDoc(doc(db, 'api_news_management', managementId), {
        hidden: false,
        hiddenAt: null,
        updatedAt: new Date(),
      });
      await loadData();
    } catch (error: any) {
      setError('Erro ao mostrar notícia: ' + error.message);
    }
  };

  const deleteApiNews = async (managementId: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta notícia?')) {
      try {
        await deleteDoc(doc(db, 'api_news_management', managementId));
        await loadData();
      } catch (error: any) {
        setError('Erro ao excluir notícia: ' + error.message);
      }
    }
  };

  const deletarBlogPost = async (postId: string) => {
    if (confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'blog_posts', postId));
        await loadData();
      } catch (error: any) {
        setError('Erro ao excluir post: ' + error.message);
      }
    }
  };

  const deletarChatGroup = async (groupId: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo? Todos os dados do grupo serão perdidos.')) {
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

  const visibleApiNews = apiNews.filter(news => 
    !newsManagement.some(management => 
      management.newsId === news.id && management.hidden
    )
  );

  const hiddenApiNews = newsManagement.filter(management => management.hidden);

  if (!user || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background-color flex items-center justify-center">
        <div className="card p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-color p-4">
      <header className="card mb-6">
        <div className="flex-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-color">
              💬 Administração do Blog/Chat
            </h1>
            <p className="text-on-surface mt-1">
              Gerencie posts do blog, grupos de conversa e notícias da API
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
        <button
          onClick={() => setAbaAtiva('api-news')}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            abaAtiva === 'api-news'
              ? 'border-b-2 border-primary-color text-primary-color'
              : 'text-on-surface hover:text-primary-color'
          }`}
        >
          📰 Notícias API
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

          {abaAtiva === 'api-news' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex-between p-6">
                  <div>
                    <h2 className="text-lg font-semibold text-on-surface">
                      Notícias da API
                    </h2>
                    <p className="text-sm text-gray-500">
                      Gerencie as notícias provenientes de APIs externas
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={loadApiNews}
                      disabled={loadingNews}
                      className="btn btn-primary"
                    >
                      {loadingNews ? '🔄 Carregando...' : '🔄 Atualizar Notícias'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card text-center">
                  <div className="text-2xl font-bold text-primary-color">{visibleApiNews.length}</div>
                  <div className="text-sm text-gray-500">Notícias Visíveis</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-orange-500">{hiddenApiNews.length}</div>
                  <div className="text-sm text-gray-500">Notícias Ocultas</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-blue-500">{apiNews.length}</div>
                  <div className="text-sm text-gray-500">Total da API</div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-on-surface">
                    Notícias Visíveis ({visibleApiNews.length})
                  </h3>
                  <p className="text-sm text-gray-500">
                    Notícias que estão sendo exibidas para os usuários
                  </p>
                </div>
                {loadingNews ? (
                  <div className="flex-center py-12">
                    <div className="loading-spinner-primary"></div>
                  </div>
                ) : visibleApiNews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 text-gray-300">📰</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Nenhuma notícia visível
                    </h3>
                    <p className="text-gray-500">
                      Carregue as notícias da API para começar a gerenciá-las
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {visibleApiNews.map((article) => (
                      <div key={article.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start space-x-3 mb-2">
                              {article.urlToImage && (
                                <img
                                  src={article.urlToImage}
                                  alt={article.title}
                                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-on-surface mb-1">
                                  {article.title}
                                </h3>
                                <p className="text-on-surface text-sm mb-2 line-clamp-2">
                                  {article.description}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="badge badge-primary">
                                    {article.category}
                                  </span>
                                  <span>Fonte: {article.source}</span>
                                  <span>API: {article.apiSource}</span>
                                  <span>
                                    {new Date(article.publishedAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => hideApiNews(article)}
                              className="btn btn-sm btn-warning"
                            >
                              Ocultar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-on-surface">
                    Notícias Ocultas ({hiddenApiNews.length})
                  </h3>
                  <p className="text-sm text-gray-500">
                    Notícias que foram ocultadas e não são exibidas para os usuários
                  </p>
                </div>
                {hiddenApiNews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 text-gray-300">👁️</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Nenhuma notícia oculta
                    </h3>
                    <p className="text-gray-500">
                      Todas as notícias estão visíveis para os usuários
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {hiddenApiNews.map((management) => (
                      <div key={management.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-on-surface mb-1">
                              {management.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                              <span>Fonte: {management.source}</span>
                              <span>API: {management.apiSource}</span>
                              <span>
                                Oculto em: {management.hiddenAt?.toDate().toLocaleDateString('pt-BR')}
                              </span>
                              <span>Por: {management.hiddenBy}</span>
                            </div>
                            <span className="badge badge-warning">
                              Oculta
                            </span>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => showApiNews(management.id)}
                              className="btn btn-sm btn-success"
                            >
                              Mostrar
                            </button>
                            <button
                              onClick={() => deleteApiNews(management.id)}
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
            </div>
          )}
        </>
      )}
    </div>
  );
}