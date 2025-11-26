'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  onSnapshot, 
  orderBy, 
  query, 
  serverTimestamp,
  updateDoc,
  arrayUnion 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ChatGroup {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  icone: string;
  criadorId: string;
  criadorNome: string;
  membrosCount: number;
  membros?: string[];
  ativo: boolean;
  ultimaMensagem?: string;
  ultimaMensagemData?: any;
}

interface ChatMessage {
  id: string;
  texto: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  timestamp: any;
}

export default function ChatGroupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadGroup();
  }, [user, groupId, router]);

  const loadGroup = async () => {
    try {
      const groupDoc = await getDoc(doc(db, 'chat_grupos', groupId));
      if (groupDoc.exists()) {
        const groupData = groupDoc.data() as ChatGroup;
        setGroup({ id: groupDoc.id, ...groupData });

        // Adicionar o usuário como membro se ainda não for
        if (!groupData.membros?.includes(user.uid)) {
          await updateDoc(doc(db, 'chat_grupos', groupId), {
            membros: arrayUnion(user.uid),
            membrosCount: (groupData.membrosCount || 0) + 1,
            atualizadoEm: serverTimestamp(),
          });
        }
      } else {
        setError('Grupo não encontrado');
      }
    } catch (error: any) {
      setError('Erro ao carregar grupo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = () => {
    const q = query(
      collection(db, 'chat_grupos', groupId, 'mensagens'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const messagesData: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          messagesData.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        setMessages(messagesData);
      },
      (error) => {
        console.error('Erro ao carregar mensagens:', error);
        setError('Erro ao carregar mensagens');
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    if (group) {
      const unsubscribe = loadMessages();
      return () => unsubscribe();
    }
  }, [group]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    setError('');
    try {
      await addDoc(collection(db, 'chat_grupos', groupId, 'mensagens'), {
        texto: newMessage.trim(),
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        userPhotoURL: user.photoURL || '',
        timestamp: serverTimestamp(),
      });

      // Atualizar última mensagem no grupo
      await updateDoc(doc(db, 'chat_grupos', groupId), {
        ultimaMensagem: newMessage.trim(),
        ultimaMensagemData: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error: any) {
      setError('Erro ao enviar mensagem: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-color flex-center">
        <div className="loading-spinner-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background-color flex-center">
        <div className="text-center">
          <div className="text-6xl mb-4 text-gray-300">❌</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Grupo não encontrado</h3>
          <button
            onClick={() => router.push('/community')}
            className="btn btn-primary"
          >
            Voltar para Comunidade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-color flex flex-col">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/community')}
              className="p-2 hover:bg-primary-dark rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">{group.nome}</h1>
              <p className="text-xs text-blue-100">{group.membrosCount} membros</p>
            </div>
          </div>
          <div className="text-2xl">
            {group.icone}
          </div>
        </div>
      </header>

      {/* Descrição do Grupo */}
      <div className="bg-surface-color border-b border-gray-200 p-4">
        <p className="text-on-surface text-sm">{group.descricao}</p>
        <div className="flex items-center mt-2">
          <span className="badge badge-primary">
            {group.categoria}
          </span>
          <span className="ml-2 text-xs text-gray-500">
            Criado por {group.criadorNome}
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error m-4">
          {error}
        </div>
      )}

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">💬</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma mensagem ainda</h3>
            <p className="text-gray-500">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.userId === user.uid ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.userId === user.uid
                    ? 'bg-primary-color text-on-primary'
                    : 'bg-surface-color text-on-surface border border-gray-200'
                }`}
              >
                {message.userId !== user.uid && (
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    {message.userName}
                  </p>
                )}
                <p className="text-sm">{message.texto}</p>
                <p className="text-xs opacity-70 mt-1 text-right">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulário de Envio de Mensagem */}
      <div className="bg-surface-color border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 form-input"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="btn btn-primary"
          >
            {sending ? (
              <div className="loading-spinner"></div>
            ) : (
              'Enviar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}