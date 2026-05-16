import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversationsApi, getUserByIdApi } from '../../api/chat';
import ChatDialog from '../ChatDialog';
import Navbar from '../Navbar';
import './MessagesBox.css';

function MessagesBox() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatTarget, setChatTarget] = useState(null);

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const getOtherUserId = (conv) => {

    return conv.participantUserIds?.find((id) => id !== currentUser.id);
  };

  useEffect(() => {
    if (!token) {
      navigate('/user/login');
      return;
    }
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getConversationsApi(token);
      if (res.code === 0) {
        const list = res.data || [];
        const enriched = await Promise.all(list.map(async (conv) => {
          const otherUserId = getOtherUserId(conv);
          let otherUserName = '用户' + otherUserId;
          let otherUserAvatar = '';
          try {
            const userRes = await getUserByIdApi(otherUserId, token);
            if (userRes.code === 0) {
              otherUserName = userRes.data.name || otherUserName;
              otherUserAvatar = userRes.data.avatarUrl || '';
            }
          } catch {}
          return { ...conv, otherUserName, otherUserAvatar };
        }));
        setConversations(enriched.filter((c) => c.lastMessage));
      } else {
        setError(res.message || '获取消息列表失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (conv) => {
    const otherUserId = conv.participantUserIds?.find((id) => id !== currentUser.id);
    try {
      const res = await getUserByIdApi(otherUserId, token);
      if (res.code === 0) {
        setChatTarget({
          sellerId: otherUserId,
          sellerName: res.data.name || '用户' + otherUserId,
          sellerAvatar: res.data.avatarUrl || '',
        });
        console.log(res.data);
      } 
    } catch {
      setChatTarget({
        sellerId: otherUserId,
        sellerName: '用户' + otherUserId,
        sellerAvatar: '',
      });
    }
  };

  return (
    <div className="messages-container">
      <Navbar />
      <h1 className="messages-page-title">消息盒子</h1>
      {chatTarget && (
        <ChatDialog
          sellerId={chatTarget.sellerId}
          sellerName={chatTarget.sellerName}
          sellerAvatar={chatTarget.sellerAvatar}
          onClose={() => setChatTarget(null)}
        />
      )}
      <div className="messages-content">
        {loading && (
          <div className="messages-loading">
            <div className="loading-spinner" />
            加载中...
          </div>
        )}

        {error && (
          <div className="messages-error">{error}</div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="messages-empty">
            <div className="messages-empty-icon">💬</div>
            <p>暂无消息</p>
            <p className="messages-empty-hint">去商品列表看看有没有感兴趣的商品吧</p>
            <button className="messages-empty-btn" onClick={() => navigate('/products')}>
              浏览商品
            </button>
          </div>
        )}

        {!loading && !error && conversations.length > 0 && (
          <div className="messages-list">
            {conversations.map((conv, idx) => {
              const otherUserId = getOtherUserId(conv);
              
              return (
              <div
                key={conv.id ?? idx}
                className="message-item"
                onClick={() => openChat(conv)}
              >
                <img
                  src={conv.otherUserAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${otherUserId || 'user'}`}
                  alt=""
                  className="message-avatar"
                />
                <div className="message-info">
                  <div className="message-top">
                    <span className="message-name">{conv.otherUserName || '用户' + otherUserId}</span>
                    <span className="message-time">{conv.lastMessageAt ? formatTimeAgo(conv.lastMessageAt) : ''}</span>
                  </div>
                  <div className="message-bottom">
                    <span className="message-preview">{conv.lastMessage || '暂无消息'}</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;

  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${pad(d.getDate())}`;
}

export default MessagesBox;
