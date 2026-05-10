import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ChatDialog from './ChatDialog';
import { getProductDetailApi } from '../api/product';
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [sellerId, setSellerId] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProductDetailApi(id);
      if (res.code === 0 && res.data) {
        setProduct(res.data);
        setSellerId(res.data.userVO?.id || res.data.userId);
      } else {
        setError(res.message || '获取商品详情失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/user/login');
      return;
    }
    if (!sellerId) {
      alert('无法获取卖家信息');
      return;
    }
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.id === sellerId) {
      alert('这是您自己的商品');
      return;
    }
    setShowChat(true);
  };

  return (
    <div className="detail-container">
      <Navbar />
      {showChat && sellerId && (
        <ChatDialog
          product={product}
          sellerId={sellerId}
          sellerName={product?.userVO?.username || product?.userName}
          sellerAvatar={product?.userVO?.avatarUrl}
          onClose={() => setShowChat(false)}
        />
      )}
      <div className="detail-banner">
        <div className="detail-banner-inner">
          <h1>商品详情</h1>
        </div>
      </div>
      <div className="detail-content">
        <button className="detail-back" onClick={() => navigate('/products')}>
          ← 返回商品列表
        </button>

        {loading && (
          <div className="detail-loading">
            <div className="loading-spinner" />
            加载中...
          </div>
        )}

        {error && (
          <div className="detail-error">{error}</div>
        )}

        {!loading && !error && product && (
          <div className="detail-card">
            <div className="detail-image-wrapper">
              <img
                src={product.image || product.imageUrl}
                alt={product.name}
                className="detail-image"
              />
            </div>
            <div className="detail-info">
              <h2 className="detail-name">{product.name}</h2>
              <p className="detail-desc">{product.description}</p>

              <div className="detail-seller" style={{ cursor: 'pointer' }} onClick={() => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                if (currentUser.id === sellerId) {
                  navigate('/my-store');
                } else {
                  navigate(`/store/${sellerId}`);
                }
              }}>
                <span className="seller-label">卖家信息</span>
                <div className="seller-info">
                  <img
                    src={product.userVO?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${product.userVO?.username || 'user'}`}
                    alt="卖家头像"
                    className="seller-avatar"
                  />
                  <span className="seller-name">{product.userVO?.username || product.userName || '未知'}</span>
                </div>
              </div>

              <div className="detail-price">¥{product.price}</div>
              <div className="detail-actions">
                <button className="detail-buy-btn" onClick={handleBuy}>
                  立即购买
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
