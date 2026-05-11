import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOrderDetailApi, commitOrderApi, payOrderApi } from '../api/order';
import Navbar from './Navbar';
import './OrderDetail.css';

function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token) {
      navigate('/user/login');
      return;
    }
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrderDetailApi(id, token);
      if (res.code === 0) {
        setOrder(res.data);
      } else {
        setError(res.message || '获取订单详情失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    setActionLoading(true);
    try {
      const res = await commitOrderApi(id, token);
      if (res.code === 0) {
        setOrder((prev) => ({ ...prev, isCommit: true }));
      } else {
        alert(res.message || '确认失败');
      }
    } catch {
      alert('网络错误，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    setActionLoading(true);
    try {
      const res = await payOrderApi(id, token);
      if (res.code === 0) {
        setOrder((prev) => ({ ...prev, isPay: true }));
      } else {
        alert(res.message || '支付失败');
      }
    } catch {
      alert('网络错误，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const isSeller = currentUser.id === order?.sellerid;
  const isBuyer = currentUser.id === order?.buyerid;
  const canCommit = isSeller && !order?.isCommit;
  const canPay = isBuyer && order?.isCommit && !order?.isPay;

  if (loading) {
    return (
      <div className="order-detail-container">
        <Navbar />
        <div className="order-detail-loading">
          <div className="loading-spinner" />
          加载中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-detail-container">
        <Navbar />
        <div className="order-detail-error">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-container">
        <Navbar />
        <div className="order-detail-error">订单不存在</div>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      <Navbar />
      <div className="order-detail-content">
        <button className="order-detail-back" onClick={() => navigate(-1)}>
          &larr; 返回
        </button>
        <div className="order-detail-card">
          <div className="order-detail-header">
            <h1 className="order-detail-title">订单详情</h1>
          </div>

          <div className="order-detail-product">
            <img
              src={order.imageUrl || 'https://via.placeholder.com/120'}
              alt=""
              className="order-detail-img"
            />
            <div className="order-detail-product-info">
              <div className="order-detail-product-name">{order.name || `商品 #${order.productId}`}</div>
              <div className="order-detail-product-price">报价 ¥{order.amount ?? 0}</div>
              {order.hours && <div className="order-detail-hours">有效 {order.hours}小时</div>}
            </div>
          </div>

          <div className="order-detail-status-section">
            <div className="order-detail-meta-row">
              <span className="order-detail-meta-label">卖家确认</span>
              <span className={`order-detail-badge ${order.isCommit ? 'badge-done' : 'badge-pending'}`}>
                {order.isCommit ? '已确认' : '未确认'}
              </span>
            </div>
            <div className="order-detail-meta-row">
              <span className="order-detail-meta-label">买家付款</span>
              <span className={`order-detail-badge ${order.isPay ? 'badge-done' : 'badge-pending'}`}>
                {order.isPay ? '已付款' : '未付款'}
              </span>
            </div>
          </div>

          {isSeller && (
            <div className="order-detail-actions">
              <button
                className="order-detail-btn btn-commit"
                onClick={handleCommit}
                disabled={order.isCommit || actionLoading}
              >
                {actionLoading ? '处理中...' : order.isCommit ? '已确认' : '确认订单'}
              </button>
            </div>
          )}

          {isBuyer && (
            <div className="order-detail-actions">
              <button
                className="order-detail-btn btn-pay"
                onClick={handlePay}
                disabled={!canPay || actionLoading}
              >
                {actionLoading ? '处理中...' : order.isPay ? '已付款' : canPay ? '付款' : '等待卖家确认'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
