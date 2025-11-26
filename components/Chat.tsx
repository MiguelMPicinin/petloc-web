// components/Chat.tsx
'use client';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  sender: string;
  senderId: string;
  timestamp: Date;
  type: 'text';
}

interface ChatProps {
  currentUserId: string;
  chatName: string;
  chatStatus?: string;
  initialMessages?: Message[];
}

export default function Chat({ 
  currentUserId, 
  chatName, 
  chatStatus = "Online",
  initialMessages = []
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.length > 0 ? initialMessages : [
    {
      id: '1',
      content: 'Olá! Como você está?',
      sender: 'João Silva',
      senderId: 'user2',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text'
    },
    {
      id: '2',
      content: 'Estou bem, obrigado! E você?',
      sender: 'Você',
      senderId: currentUserId,
      timestamp: new Date(Date.now() - 3500000),
      type: 'text'
    },
    {
      id: '3',
      content: 'Também estou bem! Obrigado por perguntar. Como estão os pets?',
      sender: 'João Silva',
      senderId: 'user2',
      timestamp: new Date(Date.now() - 3400000),
      type: 'text'
    },
    {
      id: '4',
      content: 'Todos bem! O Rex está mais animado hoje.',
      sender: 'Você',
      senderId: currentUserId,
      timestamp: new Date(Date.now() - 3300000),
      type: 'text'
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'Você',
      senderId: currentUserId,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simular resposta após 1-3 segundos
    const responseTime = Math.random() * 2000 + 1000;
    
    setIsTyping(true);
    setTimeout(() => {
      const responses = [
        'Interessante! Conte-me mais.',
        'Entendo perfeitamente.',
        'Que bom saber disso!',
        'Obrigado por compartilhar.',
        'Vamos marcar de nos encontrar com os pets?'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        sender: chatName,
        senderId: 'other-user',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, responseMessage]);
      setIsTyping(false);
    }, responseTime);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
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
        year: 'numeric'
      });
    }
  };

  // Agrupar mensagens por data
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const dateKey = message.timestamp.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-avatar">
          <span>{chatName.charAt(0)}</span>
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name">{chatName}</div>
          <div className="chat-header-status">{chatStatus}</div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="chat-messages">
        {Object.keys(messageGroups).length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma mensagem</h3>
            <p className="text-gray-600">Envie uma mensagem para iniciar a conversa</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([dateKey, dayMessages]) => (
            <div key={dateKey}>
              {/* Separador de data */}
              <div className="date-separator">
                <span>{formatDate(new Date(dateKey))}</span>
              </div>
              
              {/* Mensagens do dia */}
              {dayMessages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
                >
                  {message.senderId !== currentUserId && (
                    <div className="message-sender">{message.sender}</div>
                  )}
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Indicador de digitando */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
            <span>{chatName} está digitando...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-container">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="chat-input"
          placeholder="Digite sua mensagem..."
          rows={1}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="chat-send-button"
        >
          <span>Enviar</span>
          <span>➤</span>
        </button>
      </div>
    </div>
  );
}