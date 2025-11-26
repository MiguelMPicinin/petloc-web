export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'user' | 'admin';
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Pet {
  id: string;
  nome: string;
  descricao: string;
  contato: string;
  imagemBase64?: string;
  userId: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: string;
  contato: string;
  imagemBase64?: string;
  estoque?: number;
  categoria: string;
  userId: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Desaparecido {
  id: string;
  nome: string;
  descricao: string;
  contato: string;
  imagemBase64?: string;
  userId: string;
  encontrado: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface BlogPost {
  id: string;
  titulo: string;
  descricao: string;
  autor: string;
  categoria: string;
  icone: string;
  tempoLeitura: string;
  dataPublicacao: Date;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ChatGroup {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  criadorId: string;
  criadorNome: string;
  membrosCount: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}