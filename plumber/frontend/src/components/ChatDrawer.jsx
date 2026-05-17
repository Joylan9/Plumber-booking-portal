import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socketService';
import { getChatHistory } from '../services/chatService';
import ConfirmModal from './ConfirmModal';
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

/* ── Deleted message placeholder bubble ──────────────── */
const DeletedBubble = ({ isOwn }) => (
  <div className={`chat-bubble deleted ${isOwn ? 'own' : 'other'}`}>
    <p className="bubble-content bubble-deleted-text">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
      This message was deleted
    </p>
  </div>
);

/* ── Message context menu ────────────────────────────── */
const MessageActionMenu = ({ isOwn, onDeleteForMe, onDeleteForEveryone, onClose }) => (
  <motion.div
    className="msg-action-menu"
    initial={{ opacity: 0, scale: 0.85, y: -4 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.85, y: -4 }}
    transition={{ duration: 0.15 }}
    onClick={(e) => e.stopPropagation()}
  >
    <button className="msg-action-item" onClick={onDeleteForMe}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
      </svg>
      Delete for me
    </button>
    {isOwn && (
      <button className="msg-action-item msg-action-danger" onClick={onDeleteForEveryone}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
        Delete for everyone
      </button>
    )}
  </motion.div>
);

/* ── Header kebab menu ───────────────────────────────── */
const HeaderMenu = ({ onClearChat, onClose }) => (
  <motion.div
    className="chat-header-dropdown"
    initial={{ opacity: 0, scale: 0.9, y: -8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: -8 }}
    transition={{ duration: 0.15 }}
    onClick={(e) => e.stopPropagation()}
  >
    <button className="header-menu-item" onClick={onClearChat}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
      </svg>
      Clear chat
    </button>
  </motion.div>
);

export default function ChatDrawer({ isOpen, onClose, bookingId, currentUser, otherUserName }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);

  // Menu & modal state
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, messageId: null });

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const acknowledgedMessageIdsRef = useRef(new Set());
  const pendingReadBatchRef = useRef([]);
  const readTimeoutRef = useRef(null);

  const currentUserId = currentUser?._id || currentUser?.id;

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Close all menus when clicking anywhere
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = () => {
      setActiveMenuMsgId(null);
      setHeaderMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

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

      const unreadIds = msgList
        .filter(m =>
          m.senderId !== currentUserId &&
          m.status !== 'read' &&
          !m._isDeletedPlaceholder &&
          !acknowledgedMessageIdsRef.current.has(m._id)
        )
        .map(m => m._id);

      if (unreadIds.length === 0) return;

      unreadIds.forEach(id => acknowledgedMessageIdsRef.current.add(id));
      pendingReadBatchRef.current.push(...unreadIds);

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
        markAsRead(data.messages || []);
      }
    };

    // Listen for new messages
    const handleReceive = (msg) => {
      if (msg.bookingId === bookingId) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTypingUser(null);
        setTimeout(scrollToBottom, 50);
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
      if (data.bookingId === bookingId && data.userId !== currentUserId) {
        setTypingUser(data.userName);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      }
    };

    // Listen for "deleted for everyone" (real-time broadcast)
    const handleDeletedForEveryone = (data) => {
      if (data.bookingId === bookingId) {
        setMessages(prev => prev.map(m =>
          m._id === data.messageId
            ? { ...m, content: null, _isDeletedPlaceholder: true, isDeletedForEveryone: true }
            : m
        ));
      }
    };

    // Listen for "deleted for me" confirmation
    const handleDeletedForMe = (data) => {
      if (data.bookingId === bookingId) {
        setMessages(prev => prev.filter(m => m._id !== data.messageId));
      }
    };

    // Listen for "chat cleared" confirmation
    const handleChatCleared = (data) => {
      if (data.bookingId === bookingId) {
        setMessages([]);
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
    socket.on('chat:messageDeletedForEveryone', handleDeletedForEveryone);
    socket.on('chat:messageDeletedForMe', handleDeletedForMe);
    socket.on('chat:chatCleared', handleChatCleared);

    // Visibility change handler
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
      socket.off('chat:messageDeletedForEveryone', handleDeletedForEveryone);
      socket.off('chat:messageDeletedForMe', handleDeletedForMe);
      socket.off('chat:chatCleared', handleChatCleared);
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

  // ── Action Handlers ───────────────────────────────────

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
      socketService.emit('chat:typing', { bookingId });
    }
  };

  const openDeleteModal = (type, messageId) => {
    setActiveMenuMsgId(null);
    setConfirmModal({ open: true, type, messageId });
  };

  const handleConfirmAction = () => {
    const { type, messageId } = confirmModal;

    if (type === 'deleteForMe' && messageId) {
      // Optimistic: remove from local state immediately
      setMessages(prev => prev.filter(m => m._id !== messageId));
      socketService.emit('chat:deleteForMe', { bookingId, messageId });
    } else if (type === 'deleteForEveryone' && messageId) {
      // Optimistic: replace with placeholder
      setMessages(prev => prev.map(m =>
        m._id === messageId
          ? { ...m, content: null, _isDeletedPlaceholder: true, isDeletedForEveryone: true }
          : m
      ));
      socketService.emit('chat:deleteForEveryone', { bookingId, messageId });
    } else if (type === 'clearChat') {
      setMessages([]);
      socketService.emit('chat:clearChat', { bookingId });
    }

    setConfirmModal({ open: false, type: null, messageId: null });
  };

  const handleCancelAction = () => {
    setConfirmModal({ open: false, type: null, messageId: null });
  };

  // ── Helpers ───────────────────────────────────────────

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

  const getConfirmModalProps = () => {
    const { type } = confirmModal;
    if (type === 'deleteForMe') {
      return { title: 'Delete Message', message: 'Delete this message for you? This action cannot be undone.', confirmLabel: 'Delete for Me', danger: true };
    }
    if (type === 'deleteForEveryone') {
      return { title: 'Delete for Everyone', message: 'This message will be removed for both you and the other participant. This cannot be undone.', confirmLabel: 'Delete for Everyone', danger: true };
    }
    if (type === 'clearChat') {
      return { title: 'Clear Chat', message: 'Clear all messages from this chat? The other participant will still see their copy. This cannot be undone.', confirmLabel: 'Clear Chat', danger: true };
    }
    return {};
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
              <div className="chat-header-actions">
                {/* Kebab menu button */}
                <div className="chat-kebab-wrap">
                  <button
                    className="chat-kebab-btn"
                    onClick={(e) => { e.stopPropagation(); setHeaderMenuOpen(prev => !prev); }}
                    title="More options"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                    </svg>
                  </button>
                  <AnimatePresence>
                    {headerMenuOpen && (
                      <HeaderMenu
                        onClearChat={() => { setHeaderMenuOpen(false); openDeleteModal('clearChat', null); }}
                        onClose={() => setHeaderMenuOpen(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
                {/* Close button */}
                <button className="chat-close-btn" onClick={onClose}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
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
                      const isOwn = msg.senderId === currentUserId;
                      const isDeleted = msg._isDeletedPlaceholder || msg.isDeletedForEveryone;

                      if (isDeleted) {
                        return (
                          <motion.div
                            key={msg._id || msg.createdAt}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <DeletedBubble isOwn={isOwn} />
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={msg._id || msg.createdAt}
                          className={`chat-bubble-wrap ${isOwn ? 'own' : 'other'}`}
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className={`chat-bubble ${isOwn ? 'own' : 'other'}`}>
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
                          </div>

                          {/* Chevron trigger for action menu */}
                          <button
                            className="msg-menu-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMsgId(prev => prev === msg._id ? null : msg._id);
                            }}
                            title="Message options"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                          </button>

                          {/* Context menu */}
                          <AnimatePresence>
                            {activeMenuMsgId === msg._id && (
                              <MessageActionMenu
                                isOwn={isOwn}
                                onDeleteForMe={() => openDeleteModal('deleteForMe', msg._id)}
                                onDeleteForEveryone={() => openDeleteModal('deleteForEveryone', msg._id)}
                                onClose={() => setActiveMenuMsgId(null)}
                              />
                            )}
                          </AnimatePresence>
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

          {/* Confirmation Modal */}
          <ConfirmModal
            isOpen={confirmModal.open}
            onConfirm={handleConfirmAction}
            onCancel={handleCancelAction}
            {...getConfirmModalProps()}
          />
        </>
      )}
    </AnimatePresence>
  );
}
