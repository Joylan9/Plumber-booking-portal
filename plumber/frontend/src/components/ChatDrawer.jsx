import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socketService';
import { getChatHistory } from '../services/chatService';
import './ChatDrawer.css';

const TypingIndicator = ({ userName }) => (
  <div className="chat-typing">
    <span className="typing-name">{userName}</span> is typing
    <span className="typing-dots">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </span>
  </div>
);

const SingleTick = () => (
  <svg viewBox="0 0 16 15" width="16" height="15" fill="currentColor">
    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" opacity="0"/>
    <path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
  </svg>
);

const DoubleTick = () => (
  <svg viewBox="0 0 16 15" width="16" height="15" fill="currentColor">
    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
  </svg>
);

export default function ChatDrawer({ isOpen, onClose, bookingId, currentUser, otherUserName }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const acknowledgedMessageIdsRef = useRef(new Set());
  const pendingReadBatchRef = useRef([]);
  const readTimeoutRef = useRef(null);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Join chat room and load history
  useEffect(() => {
    if (!isOpen || !bookingId) return;

    setLoading(true);
    setMessages([]);

    const socket = socketService.getSocket();
    if (!socket) {
      setLoading(false);
      return;
    }

    // Join the chat room
    socketService.emit('chat:join', { bookingId });

    // Process incoming unread messages
    const markAsRead = (msgList) => {
      if (!isOpen || document.visibilityState !== 'visible' || !socketService.isConnected()) return;

      const currentUserId = currentUser?._id || currentUser?.id;
      const unreadIds = msgList
        .filter(m => 
          m.senderId !== currentUserId && 
          m.status !== 'read' && 
          !acknowledgedMessageIdsRef.current.has(m._id)
        )
        .map(m => m._id);

      if (unreadIds.length === 0) return;

      unreadIds.forEach(id => acknowledgedMessageIdsRef.current.add(id));
      pendingReadBatchRef.current.push(...unreadIds);

      // Debounce the socket emission to prevent spam
      if (readTimeoutRef.current) clearTimeout(readTimeoutRef.current);
      readTimeoutRef.current = setTimeout(() => {
        const batch = [...new Set(pendingReadBatchRef.current)];
        if (batch.length > 0) {
          socketService.emit('chat:read', { bookingId, messageIds: batch });
          pendingReadBatchRef.current = [];
        }
      }, 400);
    };

    // Listen for chat history
    const handleHistory = (data) => {
      if (data.bookingId === bookingId) {
        setMessages(data.messages || []);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
        // Mark any incoming unread messages from history as read
        markAsRead(data.messages || []);
      }
    };

    // Listen for new messages
    const handleReceive = (msg) => {
      if (msg.bookingId === bookingId) {
        setMessages(prev => {
          // Prevent duplicates on receive if we just sent it (though normally UI updates after history, 
          // but for robustness we check if we already have it)
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTypingUser(null);
        setTimeout(scrollToBottom, 50);
        // Mark this incoming message as read
        markAsRead([msg]);
      }
    };

    // Listen for status updates (read receipts)
    const handleMessageStatus = (data) => {
      if (data.bookingId === bookingId && data.status === 'read') {
        setMessages(prev => prev.map(m => 
          data.messageIds.includes(m._id) ? { ...m, status: 'read', readAt: data.readAt } : m
        ));
      }
    };

    // Listen for typing
    const handleTyping = (data) => {
      if (data.bookingId === bookingId && data.userId !== currentUser?._id) {
        setTypingUser(data.userName);
        // Clear typing after 3 seconds
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      }
    };

    // Listen for errors
    const handleError = (data) => {
      console.error('[Chat] Error:', data.message);
      setLoading(false);
    };

    socket.on('chat:history', handleHistory);
    socket.on('chat:receive', handleReceive);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:error', handleError);
    socket.on('chat:messageStatus', handleMessageStatus);

    // Also listen to visibility change to mark read if they come back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOpen) {
        markAsRead(messages);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Fallback: if history doesn't arrive via socket in 3s, use REST
    const fallbackTimer = setTimeout(async () => {
      if (messages.length === 0 && loading) {
        try {
          const res = await getChatHistory(bookingId);
          setMessages(res.data || []);
        } catch { /* ignore */ }
        setLoading(false);
      }
    }, 3000);

    return () => {
      socket.off('chat:history', handleHistory);
      socket.off('chat:receive', handleReceive);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:error', handleError);
      socket.off('chat:messageStatus', handleMessageStatus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      socketService.emit('chat:leave', { bookingId });
      clearTimeout(fallbackTimer);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (readTimeoutRef.current) clearTimeout(readTimeoutRef.current);
    };
  }, [isOpen, bookingId, currentUser]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !bookingId) return;

    socketService.emit('chat:send', { bookingId, message: trimmed });
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      // Emit typing indicator (throttled by the server)
      socketService.emit('chat:typing', { bookingId });
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="chat-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">{otherUserName?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <h3 className="chat-header-name">{otherUserName || 'Chat'}</h3>
                  <span className="chat-header-sub">Booking Chat</span>
                </div>
              </div>
              <button className="chat-close-btn" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {loading ? (
                <div className="chat-loading">
                  <div className="chat-loading-dots">
                    <span /><span /><span />
                  </div>
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--sky)" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  <h4>Start the conversation</h4>
                  <p>Send a message to coordinate your booking details.</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                  <div key={dateKey}>
                    <div className="chat-date-separator">
                      <span>{formatDateSeparator(msgs[0].createdAt)}</span>
                    </div>
                    {msgs.map((msg) => {
                      const isOwn = msg.senderId === currentUser?._id || msg.senderId === currentUser?.id;
                      return (
                        <motion.div
                          key={msg._id || msg.createdAt}
                          className={`chat-bubble ${isOwn ? 'own' : 'other'}`}
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {!isOwn && <span className="bubble-sender">{msg.senderName || otherUserName}</span>}
                          <p className="bubble-content">{msg.content}</p>
                          <span className="bubble-time">
                            {formatTime(msg.createdAt)}
                            {isOwn && (
                              <span className={`msg-status-ticks ${msg.status === 'read' ? 'read' : 'sent'}`}>
                                {msg.status === 'read' ? <DoubleTick /> : <SingleTick />}
                              </span>
                            )}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                ))
              )}

              {typingUser && <TypingIndicator userName={typingUser} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-bar">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={2000}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
