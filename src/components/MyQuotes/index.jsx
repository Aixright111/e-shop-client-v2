import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReceivedQuotesApi, getSentQuotesApi } from '../../api/quotes';
import Navbar from '../Navbar';
import './MyQuotes.css';

const getStatus = (item) => {
  if (item.isExpired) return { text: '已过期', className: 'status-expired' };
  if (item.isPay) return { text: '已付款', className: 'status-paid' };
  if (item.isReject) return { text: '已拒绝', className: 'status-rejected' };
  if (item.isCommit) return { text: '待付款', className: 'status-wait-pay' };
  return { text: '待确认', className: 'status-pending' };
};

function MyQuotes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('received');
  const [receivedList, setReceivedList] = useState([]);
  const [sentList, setSentList] = useState([]);
  const [loading, setLoading] = useState({ received: true, sent: true });
  const [error, setError] = useState({ received: null, sent: null });

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/user/login');
      return;
    }
  }, []);

  useEffect(() => {
    fetchReceived();
  }, []);

  useEffect(() => {
    fetchSent();
  }, []);

  const fetchReceived = async () => {
    setLoading((prev) => ({ ...prev, received: true }));
    setError((prev) => ({ ...prev, received: null }));
    try {
      const res = await getReceivedQuotesApi(currentUser.id, token);
      if (res.code === 0) {
        setReceivedList(res.data || []);
      } else {
        setError((prev) => ({ ...prev, received: res.message || '获取收到的报价失败' }));
      }
    } catch {
      setError((prev) => ({ ...prev, received: '网络错误，请稍后重试' }));
    } finally {
      setLoading((prev) => ({ ...prev, received: false }));
    }
  };

  const fetchSent = async () => {
    setLoading((prev) => ({ ...prev, sent: true }));
    setError((prev) => ({ ...prev, sent: null }));
    try {
      const res = await getSentQuotesApi(currentUser.id, token);
      if (res.code === 0) {
        setSentList(res.data || []);
      } else {
        setError((prev) => ({ ...prev, sent: res.message || '获取发出的报价失败' }));
      }
    } catch {
      setError((prev) => ({ ...prev, sent: '网络错误，请稍后重试' }));
    } finally {
      setLoading((prev) => ({ ...prev, sent: false }));
    }
  };

  const renderTabContent = (list, isLoading, err, emptyText) => {
    if (isLoading) {
      return (
        <div className="quotes-loading">
          <div className="loading-spinner" />
          加载中...
        </div>
      );
    }

    if (err) {
      return <div className="quotes-error">{err}</div>;
    }

    if (list.length === 0) {
      return (
        <div className="quotes-empty">
          <p>{emptyText}</p>
        </div>
      );
    }

    return (
      <div className="quotes-list">
        {list.map((item, idx) => {
          const status = getStatus(item);
          return (
            <div key={item.id ?? idx} className="quote-item" onClick={() => navigate(`/order/${item.id}`)}>
              <img
                src={item.imageUrl || 'https://via.placeholder.com/64'}
                alt=""
                className="quote-item-img"
              />
              <div className="quote-item-body">
                <div className="quote-item-top">
                  <span className="quote-item-name">{item.name || `商品 #${item.productId}`}</span>
                  <span className={`quote-item-status ${status.className}`}>{status.text}</span>
                </div>
                <div className="quote-item-price">报价 ¥{item.amount ?? 0}</div>
                {item.isPay && item.transactiondeadline
                  ? <div className="quote-item-hours">订单保留至 {formatTime(item.transactiondeadline)}</div>
                  : item.hours && <div className="quote-item-hours">有效 {item.hours}小时</div>
                }
                <div className="quote-item-time">
                  {item.createTime ? formatTime(item.createTime) : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="quotes-container">
      <Navbar />
      <h1 className="quotes-page-title">我的报价</h1>
      <div className="quotes-tabs">
        <button
          className={`quotes-tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          收到的报价
        </button>
        <button
          className={`quotes-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          发出的报价
        </button>
      </div>
      <div className="quotes-content">
        {activeTab === 'received'
          ? renderTabContent(receivedList, loading.received, error.received, '暂未收到任何报价')
          : renderTabContent(sentList, loading.sent, error.sent, '暂未发出任何报价')
        }
      </div>
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default MyQuotes;
