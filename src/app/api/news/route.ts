// app/api/news/route.ts
import { NextResponse } from 'next/server';
import { newsService } from '@/services/newsService';

export async function GET() {
  try {
    const news = await newsService.fetchAllPetNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error('Erro na API de notícias:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar notícias' },
      { status: 500 }
    );
  }
}