import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const ChatRoom = ({ questionId, questionStatus }) => {
  const [messages, setMessages] = useState([]);
  const [senderName, setSenderName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load saved name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('chatSenderName');
    if (savedName) {
      setSenderName(savedName);
    }
  }, []);

  // Save name to localStorage when it changes
  useEffect(() => {
    if (senderName.trim()) {
      localStorage.setItem('chatSenderName', senderName.trim());
    }
  }, [senderName]);

  // Initialize socket and fetch messages
  useEffect(() => {
    if (!questionId || questionStatus !== 'closed') {
      return;
    }

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);
    socketRef.current = newSocket;

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${questionId}`);
        const data = await response.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Join the room
    newSocket.emit('joinRoom', { questionId });

    // Listen for new messages
    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for deleted messages
    newSocket.on('messageDeleted', ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    // Cleanup on unmount
    return () => {
      newSocket.emit('leaveRoom', { questionId });
      newSocket.disconnect();
    };
  }, [questionId, questionStatus]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!senderName.trim() || !messageText.trim() || !socket) {
      return;
    }

    socket.emit('sendMessage', {
      questionId,
      senderName: senderName.trim(),
      text: messageText.trim()
    });

    setMessageText('');
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (questionStatus !== 'closed') {
    return null;
  }

  return (
    <div className="chat-room" style={{
      marginTop: '1rem',
      border: '1px solid #2a4d3a',
      borderRadius: '0.5rem',
      backgroundColor: '#1a2f2a',
      overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '0.75rem 1rem',
        backgroundColor: '#0f1f1a',
        borderBottom: '1px solid #2a4d3a',
        color: '#00d4aa',
        fontWeight: 'bold',
        fontSize: '0.875rem'
      }}>
        💬 Discussion ({messages.length})
      </div>

      {/* Messages Container */}
      <div style={{
        maxHeight: '350px',
        overflowY: 'auto',
        padding: '1rem',
        backgroundColor: '#1a2f2a'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            Be the first to discuss this question! 💬
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              style={{
                marginBottom: '1rem',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: '#0f1f1a'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#00d4aa', fontSize: '0.875rem' }}>
                {message.senderName}
              </div>
              <div style={{ color: 'white', margin: '0.25rem 0' }}>
                {message.text}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {formatTimeAgo(message.createdAt)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} style={{
        padding: '1rem',
        borderTop: '1px solid #2a4d3a',
        backgroundColor: '#0f1f1a'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder="Your name"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            maxLength={50}
            required
            style={{
              flex: '0 0 120px',
              padding: '0.5rem',
              border: '1px solid #2a4d3a',
              borderRadius: '0.25rem',
              backgroundColor: '#1a2f2a',
              color: 'white',
              fontSize: '0.875rem'
            }}
          />
          <input
            type="text"
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            maxLength={500}
            required
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid #2a4d3a',
              borderRadius: '0.25rem',
              backgroundColor: '#1a2f2a',
              color: 'white',
              fontSize: '0.875rem'
            }}
          />
          <button
            type="submit"
            disabled={!senderName.trim() || !messageText.trim()}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.25rem',
              backgroundColor: senderName.trim() && messageText.trim() ? '#00d4aa' : '#374151',
              color: 'white',
              cursor: senderName.trim() && messageText.trim() ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;
