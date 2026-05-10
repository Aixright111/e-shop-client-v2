import { useState, useEffect, useRef } from 'react';
import { getConversationMessagesApi, sendMessageApi } from '../api/chat';
import './ChatDialog.css';

function ChatDialog({ product, sellerId, sellerName, sellerAvatar, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token || !currentUser.id || !sellerId) return;
    initChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initChat = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getConversationMessagesApi(sellerId, token);
      if (res.code !== 0 || !res.data) {
        setError(res.message || '获取会话失败');
        return;
      }

      // 兼容两种格式：data 直接是消息数组，或 data.messages
      const messages = Array.isArray(res.data) ? res.data : (res.data.messages || []);
      const convId = res.data.conversationId || res.data.id || messages[0]?.conversationId;

      if (convId) {
        setConversationId(convId);
      }

      setMessages(messages);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !token) return;

    setSending(true);
    try {
      const res = await sendMessageApi(sellerId, text, token);
      if (res.code === 0 && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setInput('');
      }
    } catch {
      // 发送失败不做额外处理
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="chat-header">
          <div className="chat-header-info">
            <img
              src={sellerAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${sellerName || 'seller'}`}
              alt={sellerName}
              className="chat-header-avatar"
            />
            <div>
              <div className="chat-header-name">{sellerName || '卖家'}</div>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 消息列表 */}
        <div className="chat-messages">
          {loading && (
            <div className="chat-loading">加载中...</div>
          )}

          {error && (
            <div className="chat-error">{error}</div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <p>开始和卖家聊一聊吧</p>
              <p className="chat-empty-hint">咨询商品详情、价格等</p>
            </div>
          )}

          {!loading && !error && messages.length > 0 && (
            <>
              {messages.map((msg) => {
                const isMine = msg.senderUserId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`chat-msg ${isMine ? 'chat-msg-mine' : 'chat-msg-other'}`}
                  >
                    <div className="chat-bubble">
                      <div className="chat-bubble-text">{msg.content}</div>
                      <div className="chat-bubble-time">
                        {msg.sentAt ? formatTime(msg.sentAt) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div className="chat-input-area">
          <input
            ref={inputRef}
            className="chat-input"
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || !!error}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || sending || loading || !!error}
          >
            {sending ? '...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default ChatDialog;
