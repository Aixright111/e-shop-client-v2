import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OpenAI from 'openai';
import { SYSTEM_PROMPT_STREAM } from '../aiPrompts';
import { executeSearchProducts } from '../aiTools';
import './AiChat.css';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.REACT_APP_DEEPSEEK_API_KEY,
  dangerouslyAllowBrowser: true,
});

const STORAGE_KEY = 'aiChatMessages';
const POSITION_KEY = 'aiChatPosition';

function AiChat() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(POSITION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: window.innerWidth - 92, y: window.innerHeight - 92 };
  });
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const saveMessages = (msgs) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)); } catch {}
  };

  const goProduct = (id) => {
    setOpen(false);
    navigate('/product/' + id);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // 1. 前端直接执行语义搜索（不经过模型调工具）
      const searchStart = performance.now();
      const fetchedProducts = await executeSearchProducts({ query: text });
      console.log(`[AI助手] 语义搜索耗时: ${Math.round(performance.now() - searchStart)}ms, 命中 ${fetchedProducts.length} 个商品`);

      // 2. 构建搜索结果上下文
      const searchContext = fetchedProducts.length > 0
        ? `搜索结果（共${fetchedProducts.length}个商品）：\n${fetchedProducts.map(p => `- ${p.name} ¥${p.price}`).join('\n')}`
        : '搜索结果为空，没有找到相关商品。';

      // 3. 流式回复
      setMessages([...updatedMessages, { role: 'assistant', content: '', products: fetchedProducts }]);

      const stream = await openai.chat.completions.create({
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_STREAM },
          ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: `【搜索结果】\n${searchContext}\n\n请基于以上搜索结果回答用户的问题：“${text}”\n注意：商品卡片会自动展示，回复中不需要重复罗列商品信息。` },
        ],
        stream: true,
      });

      let content = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        content += delta;
        const currentContent = content;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: currentContent, products: fetchedProducts };
          return next;
        });
      }

      updatedMessages.push({ role: 'assistant', content, products: fetchedProducts });
      setMessages((prev) => [...prev]);
      saveMessages(updatedMessages);
    } catch (err) {
      const errorText = '抱歉，出错了：' + (err.message || '网络错误');
      const errorMsgs = [...updatedMessages, { role: 'assistant', content: errorText }];
      setMessages(errorMsgs);
      saveMessages(errorMsgs);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const wrapperRef = useRef(null);
  const draggingRef = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    draggingRef.current = true;
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.x, position.y]);

  const handleTouchStart = useCallback((e) => {
    draggingRef.current = true;
    const touch = e.touches[0];
    dragOffset.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.x, position.y]);

  const handleMouseMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const newX = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 60));
    const newY = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 60));
    setPosition({ x: newX, y: newY });
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const touch = e.touches[0];
    const newX = Math.max(0, Math.min(touch.clientX - dragOffset.current.x, window.innerWidth - 60));
    const newY = Math.max(0, Math.min(touch.clientY - dragOffset.current.y, window.innerHeight - 60));
    setPosition({ x: newX, y: newY });
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(position)); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const handleTouchEnd = useCallback(() => {
    draggingRef.current = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(position)); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      <div
        className="aichat-fab-wrapper"
        ref={wrapperRef}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <button className="aichat-fab" onClick={() => setOpen(true)} title="AI 助手">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.27A7.02 7.02 0 0 1 14 22h-4a7.02 7.02 0 0 1-5.73-3H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <circle cx="9" cy="13" r="1"/>
            <circle cx="15" cy="13" r="1"/>
          </svg>
        </button>
        <span className="aichat-fab-label">AI 助手</span>
      </div>

      {open && (
        <div className="aichat-overlay" onClick={() => setOpen(false)}>
          <div className="aichat-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="aichat-header">
              <span className="aichat-title">AI 助手</span>
              <div className="aichat-header-actions">
                {messages.length > 0 && (
                  <button className="aichat-clear-btn" onClick={clearMessages}>清空对话</button>
                )}
                <button className="aichat-close-btn" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>

            <div className="aichat-messages">
              {messages.length === 0 && (
                <div className="aichat-empty">
                  <p>有什么可以帮助你的吗？<br/>试试：看看有哪些商品</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`aichat-msg ${msg.role === 'user' ? 'aichat-msg-user' : 'aichat-msg-ai'}`}>
                  <div className={`aichat-bubble ${msg.role === 'user' ? 'aichat-bubble-user' : 'aichat-bubble-ai'}`}>
                    {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
                  </div>
                  {msg.products && msg.products.length > 0 && (
                    <div className="aichat-products">
                      {msg.products.map((p) => (
                        <div key={p.id} className="aichat-product-card" onClick={() => goProduct(p.id)}>
                          <img
                            className="aichat-product-img"
                            src={p.image || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.id}`}
                            alt={p.name}
                          />
                          <div className="aichat-product-info">
                            <div className="aichat-product-name">{p.name}</div>
                            <div className="aichat-product-price">¥{p.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="aichat-input-area">
              <input
                ref={inputRef}
                className="aichat-input"
                placeholder="试试：看看有哪些商品"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="aichat-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || loading}
              >
                {loading ? '...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AiChat;
