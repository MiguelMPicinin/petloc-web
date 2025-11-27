// services/newsService.ts

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: string;
  category: string;
  apiSource: string;
  author: string;
}

class NewsService {
  private newsApiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY;
  private newsApiUrl = 'https://newsapi.org/v2/everything';

  async fetchAllPetNews(): Promise<NewsArticle[]> {
    try {
      const results = await Promise.allSettled([
        this.fetchNewsFromBrazilianSources(),
        this.fetchNewsFromNewsAPI(),
        this.fetchNewsFromReddit(),
        this.fetchDogFacts(),
      ]);

      let allNews: NewsArticle[] = [];
      
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allNews = allNews.concat(result.value);
        }
      }

      // Ordenar por data (mais recentes primeiro)
      allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      return allNews;
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      return [];
    }
  }

  private async fetchNewsFromBrazilianSources(): Promise<NewsArticle[]> {
    try {
      const ongs = [
        {
          titulo: 'Campanha de Adoção - Cães SRD',
          descricao: 'Centenas de cães aguardam por um lar amoroso. Venha conhecer nossos peludos!',
          url: 'https://www.amparanimal.org.br',
          imagem: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop',
          fonte: 'AMPARA Animal',
          categoria: 'Adoção'
        },
        {
          titulo: 'Feira de Adoção Responsável',
          descricao: 'Domingo no Parque Ibirapuera - Venha adotar seu novo melhor amigo!',
          url: 'https://www.adoteumfocinho.com.br',
          imagem: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=600&fit=crop',
          fonte: 'Adote um Focinho',
          categoria: 'Adoção'
        }
      ];

      const noticias = [
        {
          titulo: 'Cuidados com pets no verão brasileiro',
          descricao: 'Veterinários dão dicas essenciais para proteger seu pet no calor intenso',
          url: 'https://exemplo.com/noticia1',
          imagem: 'https://images.unsplash.com/photo-1509205477838-a534e43b84b9?w=800&h=600&fit=crop',
          fonte: 'Pet Brasil',
          categoria: 'Saúde'
        },
        {
          titulo: 'Nova lei de maus-tratos a animais',
          descricao: 'Entenda as mudanças na legislação brasileira sobre proteção animal',
          url: 'https://exemplo.com/noticia2',
          imagem: 'https://images.unsplash.com/photo-1453227588063-bb302b62f50b?w=800&h=600&fit=crop',
          fonte: 'Jornal Animal',
          categoria: 'Comportamento'
        }
      ];

      const allItems = [...ongs, ...noticias];
      const brazilianNews: NewsArticle[] = [];

      for (const item of allItems) {
        brazilianNews.push({
          id: `br-${Date.now()}-${Math.random()}`,
          title: item.titulo,
          description: item.descricao,
          url: item.url,
          urlToImage: item.imagem,
          publishedAt: new Date().toISOString(),
          source: item.fonte,
          category: item.categoria,
          apiSource: 'Brasil',
          author: 'ONG Brasileira',
        });
      }

      return brazilianNews;
    } catch (error) {
      console.error('Erro fontes brasileiras:', error);
      return [];
    }
  }

  private async fetchNewsFromNewsAPI(): Promise<NewsArticle[]> {
    try {
      if (!this.newsApiKey || this.newsApiKey === 'SUA_CHAVE_NEWSAPI_AQUI') {
        console.warn('⚠️ Configure sua chave da NewsAPI em .env.local');
        return [];
      }

      const queries = [
        'pets OR animais OR saúde animal',
        'cachorro OR gato OR veterinário',
        'adoção animal OR resgate animais',
      ];

      let allArticles: NewsArticle[] = [];

      for (const query of queries) {
        try {
          const response = await fetch(
            `${this.newsApiUrl}?q=${encodeURIComponent(query)}&language=pt&pageSize=5&sortBy=publishedAt&apiKey=${this.newsApiKey}`
          );

          if (response.ok) {
            const data = await response.json();
            const articles = data.articles || [];
            
            for (const article of articles) {
              const newsArticle: NewsArticle = {
                id: `newsapi-${article.url}`,
                title: article.title || 'Sem título',
                description: article.description || 'Sem descrição',
                url: article.url || '',
                urlToImage: article.urlToImage || '',
                publishedAt: article.publishedAt || new Date().toISOString(),
                source: article.source?.name || 'Fonte desconhecida',
                category: this.determineCategory(article.title || ''),
                apiSource: 'NewsAPI',
                author: article.author || 'Autor desconhecido',
              };
              allArticles.push(newsArticle);
            }
          }
        } catch (error) {
          console.error('Erro na query NewsAPI:', error);
        }
      }

      return allArticles;
    } catch (error) {
      console.error('Erro NewsAPI:', error);
      return [];
    }
  }

  private async fetchNewsFromReddit(): Promise<NewsArticle[]> {
    try {
      const subreddits = ['pets', 'dogs', 'cats', 'dogtraining', 'PetAdvice'];
      let allPosts: NewsArticle[] = [];

      for (const subreddit of subreddits) {
        try {
          const response = await fetch(
            `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`
          );

          if (response.ok) {
            const data = await response.json();
            const posts = data.data?.children || [];

            for (const post of posts) {
              const postData = post.data;
              const article: NewsArticle = {
                id: `reddit-${postData.id}`,
                title: postData.title || 'Sem título',
                description: postData.selftext || 'Clique para ver mais detalhes no Reddit',
                url: `https://reddit.com${postData.permalink}`,
                urlToImage: this.getRedditImage(postData),
                publishedAt: new Date(postData.created_utc * 1000).toISOString(),
                source: `Reddit - r/${postData.subreddit || 'unknown'}`,
                category: this.determineCategory(postData.title || ''),
                apiSource: 'Reddit',
                author: `u/${postData.author || 'unknown'}`,
              };
              allPosts.push(article);
            }
          }
        } catch (error) {
          console.error(`Erro no subreddit ${subreddit}:`, error);
        }
      }

      return allPosts;
    } catch (error) {
      console.error('Erro Reddit:', error);
      return [];
    }
  }

  private getRedditImage(postData: any): string {
    try {
      // Tenta obter thumbnail
      if (postData.thumbnail && 
          postData.thumbnail.startsWith('http') &&
          postData.thumbnail !== 'self' &&
          postData.thumbnail !== 'default') {
        return postData.thumbnail;
      }
      
      // Tenta obter preview images
      if (postData.preview?.images?.[0]?.source?.url) {
        return postData.preview.images[0].source.url.replace(/&amp;/g, '&');
      }
      
      // Tenta obter URL direta se for imagem
      if (postData.url && 
          (postData.url.endsWith('.jpg') || 
           postData.url.endsWith('.png') ||
           postData.url.endsWith('.jpeg'))) {
        return postData.url;
      }
    } catch (error) {
      console.error('Erro ao obter imagem do Reddit:', error);
    }
    
    return '';
  }

  private async fetchDogFacts(): Promise<NewsArticle[]> {
    try {
      const response = await fetch('https://dog-api.kinduff.com/api/facts?number=2');
      
      if (response.ok) {
        const data = await response.json();
        const facts = data.facts || [];
        
        let imageUrl = '';
        try {
          const imageResponse = await fetch('https://api.thedogapi.com/v1/images/search?limit=1');
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            imageUrl = imageData[0]?.url || '';
          }
        } catch (error) {
          console.error('Erro ao buscar imagem de cachorro:', error);
        }

        return facts.map((fact: string, index: number) => ({
          id: `dogapi-${index}`,
          title: 'Curiosidade Canina 🐕',
          description: fact,
          url: 'https://thedogapi.com',
          urlToImage: imageUrl,
          publishedAt: new Date().toISOString(),
          source: 'The Dog API',
          category: 'Entretenimento',
          apiSource: 'DogAPI',
          author: 'The Dog API',
        }));
      }
      return [];
    } catch (error) {
      console.error('Erro Dog API:', error);
      return [];
    }
  }

  private determineCategory(title: string): string {
    if (!title) return 'Entretenimento';
    
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('saúde') || lowerTitle.includes('veterinár') || 
        lowerTitle.includes('doença') || lowerTitle.includes('medicina') ||
        lowerTitle.includes('health') || lowerTitle.includes('vet')) {
      return 'Saúde';
    } else if (lowerTitle.includes('alimentação') || lowerTitle.includes('nutrição') || 
               lowerTitle.includes('ração') || lowerTitle.includes('dieta') ||
               lowerTitle.includes('food') || lowerTitle.includes('nutrition')) {
      return 'Nutrição';
    } else if (lowerTitle.includes('comportamento') || lowerTitle.includes('treinamento') || 
               lowerTitle.includes('adestramento') || lowerTitle.includes('behavior') ||
               lowerTitle.includes('training')) {
      return 'Comportamento';
    } else if (lowerTitle.includes('adoção') || lowerTitle.includes('abandono') || 
               lowerTitle.includes('resgate') || lowerTitle.includes('adoption') ||
               lowerTitle.includes('rescue')) {
      return 'Adoção';
    } else {
      return 'Entretenimento';
    }
  }
}

export const newsService = new NewsService();