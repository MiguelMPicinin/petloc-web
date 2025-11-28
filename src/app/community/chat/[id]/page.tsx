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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          const data = doc.data();
          messagesData.push({ 
            id: doc.id, 
            texto: data.texto || '',
            userId: data.userId || data.remetenteId || '',
            userName: data.userName || data.remetenteNome || 'Usuário',
            userPhotoURL: data.userPhotoURL || '',
            timestamp: data.timestamp || data.enviadoEm
          } as ChatMessage);
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
      const mensagemData = {
        texto: newMessage.trim(),
        userId: user.uid,
        userName: user.displayName || 'Usuário',
        userPhotoURL: user.photoURL || '',
        timestamp: serverTimestamp(),
        remetenteId: user.uid,
        remetenteNome: user.displayName || 'Usuário',
        enviadoEm: serverTimestamp(),
      };

      await addDoc(collection(db, 'chat_grupos', groupId, 'mensagens'), mensagemData);

      await updateDoc(doc(db, 'chat_grupos', groupId), {
        ultimaMensagem: newMessage.trim(),
        ultimaMensagemData: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      setNewMessage('');
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
      } else {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        });
      }
    } catch (error) {
      return '';
    }
  };

  const groupMessagesByDate = () => {
    const grouped: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });

    return grouped;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex-center">
        <div className="loading-spinner-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex-center">
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

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="chat-main-container">
      <header className="chat-header-centered">
        <div className="chat-header-content">
          <button
            onClick={() => router.push('/community')}
            className="chat-back-button"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="chat-title">
            <h1 className="chat-group-name">{group.nome}</h1>
            <p className="chat-group-info">
              {group.membrosCount} membros • {group.categoria}
            </p>
          </div>

          <button 
            className="chat-header-button p-2 rounded-lg"
            aria-label="Mais opções"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="chat-center-panel">
        <div className="chat-messages-scroll">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma mensagem ainda</h3>
              <p className="text-gray-500">Seja o primeiro a enviar uma mensagem neste grupo!</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="date-separator">
                  <span>{date}</span>
                </div>

                {dateMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex mb-4 ${
                      message.userId === user.uid ? 'justify-end' : 'justify-start'
                    } message-animate`}
                  >
                    <div className="max-w-xs lg:max-w-md">
                      {message.userId !== user.uid && (
                        <div className="flex items-center space-x-2 mb-1 ml-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex-center text-white text-xs font-semibold">
                            {message.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {message.userName}
                          </span>
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm ${
                          message.userId === user.uid
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.texto}</p>
                        <div className={`flex justify-end mt-1 ${
                          message.userId === user.uid ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          <span className="text-xs">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} className="chat-messages-end" />
        </div>

        <div className="chat-input-centered">
          <form onSubmit={handleSendMessage} className="w-full">
            <div className="chat-input-expanded">
              <div className="chat-input-actions">
                <button
                  type="button"
                  className="chat-action-button"
                  aria-label="Anexar arquivo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  className="chat-action-button"
                  aria-label="Enviar imagem"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="chat-input-field-expanded"
                disabled={sending}
                rows={1}
              />

              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="chat-send-button-expanded"
                aria-label="Enviar mensagem"
              >
                {sending ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}