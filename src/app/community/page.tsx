'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
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
  membrosCount: number;
  ultimaMensagem: string;
  ultimaMensagemData: any;
  icone: string;
}

const categorias = [
  'Todos',
  'Saúde',
  'Nutrição',
  'Comportamento',
  'Entretenimento',
  'Adoção'
];

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'blog' | 'chat'>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [apiNews, setApiNews] = useState<NewsArticle[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [loadingApiNews, setLoadingApiNews] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Carregar posts do blog com filtro de categoria
    let blogQuery;
    if (categoriaSelecionada === 'Todos') {
      blogQuery = query(
        collection(db, 'blog_posts'),
        where('ativo', '==', true),
        orderBy('dataPublicacao', 'desc')
      );
    } else {
      blogQuery = query(
        collection(db, 'blog_posts'),
        where('ativo', '==', true),
        where('categoria', '==', categoriaSelecionada),
        orderBy('dataPublicacao', 'desc')
      );
    }

    const blogUnsubscribe = onSnapshot(blogQuery, (snapshot) => {
      const posts: BlogPost[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.ativo !== false) {
          posts.push({ id: doc.id, ...data } as BlogPost);
        }
      });
      setBlogPosts(posts);
      setLoading(false);
    });

    // Carregar grupos de chat
    const chatUnsubscribe = onSnapshot(
      query(collection(db, 'chat_grupos'), where('ativo', '!=', false)),
      (snapshot) => {
        const groups: ChatGroup[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          groups.push({ id: doc.id, ...data } as ChatGroup);
        });
        setChatGroups(groups);
        setLoading(false);
      }
    );

    return () => {
      blogUnsubscribe();
      chatUnsubscribe();
    };
  }, [user, router, categoriaSelecionada]);

  // Carregar notícias da API quando a aba de blog estiver ativa
  useEffect(() => {
    if (abaAtiva === 'blog') {
      loadApiNews();
    }
  }, [abaAtiva, categoriaSelecionada]);

  const loadApiNews = async () => {
    setLoadingApiNews(true);
    setError('');
    try {
      const news = await newsService.fetchAllPetNews();
      
      // Filtrar por categoria se necessário
      const filteredNews = categoriaSelecionada === 'Todos' 
        ? news 
        : news.filter(article => article.category === categoriaSelecionada);
      
      setApiNews(filteredNews);
    } catch (error: any) {
      console.error('Erro ao carregar notícias:', error);
      setError('Erro ao carregar notícias da internet. Tente novamente.');
    } finally {
      setLoadingApiNews(false);
    }
  };

  const filteredApiNews = categoriaSelecionada === 'Todos' 
    ? apiNews 
    : apiNews.filter(article => article.category === categoriaSelecionada);

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

      {abaAtiva === 'blog' && (
        <div className="container">
          {/* Header do Blog com botão de refresh */}
          <div className="flex-between mb-4 mt-4">
            <h2 className="text-lg font-semibold text-on-surface">Notícias sobre Pets</h2>
            <button
              onClick={loadApiNews}
              disabled={loadingApiNews}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Recarregar notícias"
            >
              <span className="text-lg">🔄</span>
            </button>
          </div>

          {/* Categorias */}
          <div className="flex overflow-x-auto py-2 mb-4 space-x-2 scrollbar-hide">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setCategoriaSelecionada(categoria)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  categoria === categoriaSelecionada
                    ? 'bg-primary-color text-on-primary shadow-md'
                    : 'bg-surface-color text-on-surface border border-gray-300 hover:border-primary-color'
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          {/* Conteúdo Combinado */}
          <div className="space-y-6">
            {/* Notícias do Firestore */}
            {blogPosts.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-on-surface mb-3">Notícias do Nosso Blog</h3>
                <div className="space-y-4">
                  {blogPosts.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Notícias da API */}
            {filteredApiNews.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-on-surface mb-3">Notícias da Internet</h3>
                <div className="space-y-4">
                  {filteredApiNews.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            )}

            {/* Loading API News */}
            {loadingApiNews && (
              <div className="flex-center py-8">
                <div className="loading-spinner-primary"></div>
                <span className="ml-3 text-on-surface">Carregando notícias...</span>
              </div>
            )}

            {/* Estado Vazio */}
            {!loading && !loadingApiNews && blogPosts.length === 0 && filteredApiNews.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 text-gray-300">📝</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhuma notícia encontrada
                </h3>
                <p className="text-gray-500 mb-4">
                  Tente mudar a categoria ou recarregar as notícias.
                </p>
                <button
                  onClick={loadApiNews}
                  className="btn btn-primary"
                >
                  🔄 Recarregar Notícias
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {abaAtiva === 'chat' && (
        <div className="container">
          <div className="flex-between mb-4 mt-4">
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
                <ChatGroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      )}

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

// Componente para exibir um post do blog (Firestore)
function BlogPostCard({ post }: { post: BlogPost }) {
  const router = useRouter();

  return (
    <div 
      className="card hover-lift cursor-pointer transition-all duration-200 hover:shadow-md"
      onClick={() => router.push(`/blog/${post.id}`)}
    >
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex-center flex-shrink-0">
          <span className="text-lg">{post.icone || '📄'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-on-surface mb-1 line-clamp-2">
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
  );
}

// Componente para exibir notícia da API
function NewsCard({ article }: { article: NewsArticle }) {
  const handleClick = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const getSourceColor = (apiSource: string) => {
    switch (apiSource) {
      case 'NewsAPI': return 'bg-blue-500';
      case 'Brasil': return 'bg-green-500';
      case 'Reddit': return 'bg-orange-500';
      case 'DogAPI': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceAbbreviation = (apiSource: string) => {
    switch (apiSource) {
      case 'NewsAPI': return 'NEWS';
      case 'Brasil': return 'BR';
      case 'Reddit': return 'REDDIT';
      case 'DogAPI': return 'CURIOSIDADE';
      default: return apiSource;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Hoje';
      } else if (diffDays === 1) {
        return 'Ontem';
      } else if (diffDays < 7) {
        return `${diffDays} dias atrás`;
      } else {
        return date.toLocaleDateString('pt-BR');
      }
    } catch (e) {
      return 'Data desconhecida';
    }
  };

  return (
    <div 
      className="card hover-lift cursor-pointer transition-all duration-200 hover:shadow-md"
      onClick={handleClick}
    >
      <div className="flex flex-col">
        {article.urlToImage && (
          <div className="relative h-48 w-full mb-3">
            <img
              src={article.urlToImage}
              alt={article.title}
              className="rounded-t-lg object-cover w-full h-full"
              onError={(e) => {
                // Fallback para imagem quebrada
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className={`absolute top-2 left-2 ${getSourceColor(article.apiSource)} text-white px-2 py-1 rounded text-xs font-bold`}>
              {getSourceAbbreviation(article.apiSource)}
            </div>
          </div>
        )}
        <div className="flex-1 p-4">
          <h3 className="font-semibold text-on-surface mb-2 line-clamp-2">
            {article.title}
          </h3>
          <p className="text-on-surface text-sm mb-3 line-clamp-3">
            {article.description}
          </p>
          <div className="flex-between text-xs text-gray-500 mb-2">
            <span className="badge badge-primary">
              {article.category}
            </span>
            <span>
              {formatDate(article.publishedAt)}
            </span>
          </div>
          <div className="flex-between text-xs text-gray-500">
            <span className="truncate mr-2">
              {article.source}
            </span>
            <span className="text-right">
              Por {article.author}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para grupo de chat
function ChatGroupCard({ group }: { group: ChatGroup }) {
  const router = useRouter();

  return (
    <div 
      className="card hover-lift cursor-pointer transition-all duration-200 hover:shadow-md"
      onClick={() => router.push(`/community/chat/${group.id}`)}
    >
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex-center flex-shrink-0">
          <span className="text-lg">{group.icone || '💬'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex-between mb-1">
            <h3 className="font-semibold text-on-surface line-clamp-1">
              {group.nome}
            </h3>
            <span className="bg-gray-100 text-on-surface px-2 py-1 rounded text-xs whitespace-nowrap">
              {group.membrosCount} membros
            </span>
          </div>
          <p className="text-on-surface text-sm mb-2 line-clamp-2">
            {group.descricao}
          </p>
          <div className="flex-between items-center text-xs text-gray-500">
            <span className="truncate mr-2">
              {group.ultimaMensagem || 'Nenhuma mensagem ainda'}
            </span>
            {group.ultimaMensagemData && (
              <span className="whitespace-nowrap">
                {group.ultimaMensagemData.toDate().toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}