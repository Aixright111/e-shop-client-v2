import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversationMessagesApi, sendMessageApi } from '../api/chat';
import { sendOfferApi, getOffersApi } from '../api/order';
import { getUserProductsApi } from '../api/product';
import './ChatDialog.css';

const getOfferStatus = (offer) => {
  if (offer.isPay) return { text: '已付款', className: 'offer-status-paid' };
  if (offer.isCommit) return { text: '待付款', className: 'offer-status-wait-pay' };
  return { text: '待确认', className: 'offer-status-pending' };
};

function ChatDialog({ product, sellerId, sellerName, sellerAvatar, onClose }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [offers, setOffers] = useState([]);
  const [showOffer, setShowOffer] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerHours, setOfferHours] = useState('');
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const userScrolledUpRef = useRef(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token || !currentUser.id || !sellerId) return;
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  // 每 1s 轮询读取最新消息
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(async () => {
      try {
        const res = await getConversationMessagesApi(sellerId, token);
        if (res.code === 0 && res.data) {
          const msgs = Array.isArray(res.data) ? res.data : (res.data.messages || []);
          if (msgs.length > 0) {
            setMessages(msgs);
          }
        }
      } catch {
        // 静默失败
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, sellerId, token]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    userScrolledUpRef.current = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const initChat = async () => {
    setLoading(true);
    setError(null);
    try {
      const [msgRes, offerRes] = await Promise.all([
        getConversationMessagesApi(sellerId, token),
        getOffersApi(currentUser.id, sellerId, token),
      ]);

      if (msgRes.code !== 0 || !msgRes.data) {
        setError(msgRes.message || '获取会话失败');
        return;
      }

      // 兼容两种格式：data 直接是消息数组，或 data.messages
      const messages = Array.isArray(msgRes.data) ? msgRes.data : (msgRes.data.messages || []);

      setMessages(messages);

      if (offerRes.code === 0) {
        setOffers(offerRes.data || []);
      }
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
        userScrolledUpRef.current = false;
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

  const handleOpenOffer = async () => {
    setShowOffer(true);
    setSelectedProduct(null);
    setOfferPrice('');
    setOfferHours('');
    if (userProducts.length === 0) {
      setLoadingProducts(true);
      try {
        const res = await getUserProductsApi(sellerId, 0, 100);
        if (res.code === 0 && res.data) {
          const items = res.data.content || res.data.items || [];
          setUserProducts(items.filter((p) => p.show !== false));
        }
      } catch (err) {
        console.error('加载商品失败:', err);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setOfferPrice(String(product.price ?? ''));
  };

  const handleSendOffer = async () => {
    if (!selectedProduct || !offerPrice || sending || !token) return;
    setSending(true);
    try {
      const res = await sendOfferApi({
        senderId: currentUser.id,
        receiverId: sellerId,
        productId: selectedProduct.id,
        price: offerPrice,
        timeHours: offerHours || undefined,
      }, token);
      if (res.code === 0 && res.data) {
        onClose();
        navigate(`/order/${res.data.id}`);
      } else {
        setToast(res.message || '报价发送失败');
        setTimeout(() => setToast(null), 2500);
      }
    } catch {
      setToast('网络错误，报价发送失败');
      setTimeout(() => setToast(null), 2500);
    } finally {
      setSending(false);
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
              onClick={() => { onClose(); navigate(`/store/${sellerId}`); }}
            />
            <div>
              <div className="chat-header-name">{sellerName || '卖家'}</div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="chat-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
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
          {/* 报价列表 */}
          {!loading && !error && offers.length > 0 && (
            <div className="chat-offer-list">
              <div className="chat-offer-list-title">已发起的报价</div>
              {offers.map((offer) => {
                const status = getOfferStatus(offer);
                return (
                <div key={offer.id} className="chat-offer-item" onClick={() => { onClose(); navigate(`/order/${offer.id}`); }}>
                  <img
                    src={offer.imageUrl || 'https://via.placeholder.com/48'}
                    alt=""
                    className="chat-offer-item-img"
                  />
                  <div className="chat-offer-item-left">
                    <div className="chat-offer-item-top">
                      <span className="chat-offer-item-name">{offer.name || `商品 #${offer.productId}`}</span>
                      <span className={`chat-offer-item-status ${status.className}`}>{status.text}</span>
                    </div>
                    <div className="chat-offer-item-price">报价 ¥{offer.amount}</div>
                    {offer.hours && <div className="chat-offer-item-hours">有效 {offer.hours}小时</div>}
                  </div>
                </div>
                );
              })}
            </div>
          )}
          {toast && <div className="chat-toast">{toast}</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* 报价面板 */}
        {showOffer && (
          <div className="offer-panel">
            <div className="offer-panel-header">
              <span>选择报价商品</span>
              <button className="offer-close-btn" onClick={() => { setShowOffer(false); setSelectedProduct(null); }}>✕</button>
            </div>
            <div className="offer-products">
              {loadingProducts ? (
                <div className="offer-loading">加载商品中...</div>
              ) : userProducts.length === 0 ? (
                <div className="offer-empty">暂无商品可报价</div>
              ) : (
                <div className="offer-products-scroll">
                  {userProducts.map((p) => (
                    <div
                      key={p.id}
                      className={`offer-product-card ${selectedProduct?.id === p.id ? 'selected' : ''}`}
                      onClick={() => handleSelectProduct(p)}
                    >
                      <img
                        src={p.image || p.imageUrl || 'https://via.placeholder.com/80'}
                        alt={p.name}
                        className="offer-product-img"
                      />
                      <div className="offer-product-name">{p.name}</div>
                      <div className="offer-product-price">¥{p.price}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedProduct && (
              <div className="offer-confirm-area">
                <div className="offer-price-row">
                  <span className="offer-price-label">报价金额</span>
                  <span className="offer-price-sign">¥</span>
                  <input
                    className="offer-price-input"
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="输入金额"
                  />
                </div>
                <div className="offer-price-row">
                  <span className="offer-price-label">有效时间</span>
                  <input
                    className="offer-price-input offer-hours-input"
                    type="number"
                    min="1"
                    value={offerHours}
                    onChange={(e) => setOfferHours(e.target.value)}
                    placeholder="小时"
                  />
                  <span className="offer-hours-unit">小时</span>
                </div>
                <button
                  className="offer-confirm-btn"
                  onClick={handleSendOffer}
                  disabled={!offerPrice || sending}
                >
                  {sending ? '发送中...' : '发送报价'}
                </button>
              </div>
            )}
          </div>
        )}

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
            className="chat-offer-btn"
            onClick={handleOpenOffer}
          >
            报价
          </button>
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
