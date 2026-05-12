import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ChatDialog from './ChatDialog';
import { getProductDetailApi, deleteProductApi } from '../api/product';
import { sendOfferApi } from '../api/order';
import { deleteProductImage } from '../api/supabase';
import './ProductDetail.css';

const CATEGORIES = ['数码电子', '生活日用', '充值代练', '其他'];

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConsultChat, setShowConsultChat] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerHours, setOfferHours] = useState('');
  const [offerSending, setOfferSending] = useState(false);
  const [sellerId, setSellerId] = useState(null);
  const fetchedRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (fetchedRef.current === id) return;
    fetchedRef.current = id;
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
    if (currentUser.id === sellerId) {
      alert('这是您自己的商品');
      return;
    }
    setOfferPrice(String(product.price ?? ''));
    setOfferHours('');
    setShowOfferModal(true);
  };

  const handleConfirmOffer = async () => {
    const token = localStorage.getItem('token');
    if (!token || !product) return;
    if (!offerPrice || isNaN(Number(offerPrice)) || Number(offerPrice) <= 0) {
      alert('请输入有效的报价金额');
      return;
    }
    setOfferSending(true);
    try {
      const res = await sendOfferApi({
        senderId: currentUser.id,
        receiverId: sellerId,
        productId: product.id,
        price: Number(offerPrice),
        timeHours: offerHours || undefined,
      }, token);
      if (res.code === 0 && res.data) {
        setShowOfferModal(false);
        setOfferPrice('');
        navigate(`/order/${res.data.id}`);
      } else {
        alert(res.message || '报价发送失败');
      }
    } catch {
      alert('网络错误，请稍后重试');
    } finally {
      setOfferSending(false);
    }
  };

  const handleConsult = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/user/login');
      return;
    }
    setShowConsultChat(true);
  };

  const handleDelist = async () => {
    if (!window.confirm('确定要下架该商品吗？')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await deleteProductApi(id, token);
      if (res.code === 0) {
        const imageUrl = res.data || product.image || product.imageUrl;
        if (imageUrl) deleteProductImage(imageUrl);
        navigate(-1);
      } else {
        alert(res.message || '下架失败');
      }
    } catch {
      alert('网络错误，请稍后重试');
    }
  };

  return (
    <div className="detail-container">
      <Navbar />
      {showConsultChat && sellerId && (
        <ChatDialog
          product={product}
          sellerId={sellerId}
          sellerName={product?.userVO?.username || product?.userName}
          sellerAvatar={product?.userVO?.avatarUrl}
          onClose={() => setShowConsultChat(false)}
        />
      )}
      <div className="detail-banner">
        <div className="detail-banner-inner">
          <h1>商品详情</h1>
        </div>
      </div>
      <div className="detail-content">
        <button className="detail-back" onClick={() => navigate(-1)}>
          &larr; 返回
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

              <div
                className="detail-category"
                onClick={() => { if (product.typeId !== null && product.typeId !== undefined) navigate(`/products?typeId=${product.typeId}`); }}
              >
                <span className="detail-category-label">商品分类</span>
                <span className="detail-category-value">
                  {CATEGORIES[product.typeId] ?? '其他'}
                </span>
              </div>

              <div className="detail-meta-stats">
                {product.detailView !== undefined && (
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">浏览量</span>
                    <span className="detail-meta-value">{product.detailView}</span>
                  </div>
                )}
                {product.createdAt && (
                  <div className="detail-meta-item">
                    <span className="detail-meta-label">上架时间</span>
                    <span className="detail-meta-value">{formatDate(product.createdAt)}</span>
                  </div>
                )}
              </div>

              <div className="detail-seller" style={{ cursor: 'pointer' }} onClick={() => {
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
                {currentUser.id === sellerId ? (
                  <>
                    <button className="detail-edit-btn" onClick={() => navigate(`/product/edit/${id}`)}>
                      修改
                    </button>
                    <button className="detail-delist-btn" onClick={handleDelist}>
                      下架
                    </button>
                  </>
                ) : (
                  <>
                    <button className="detail-buy-btn" onClick={handleBuy}>
                      立即购买
                    </button>
                    <button className="detail-consult-btn" onClick={handleConsult}>
                      咨询
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {showOfferModal && product && (
          <div className="offer-overlay" onClick={() => { if (!offerSending) setShowOfferModal(false); }}>
            <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="offer-modal-header">
                <span>确认报价</span>
                <button className="offer-modal-close" onClick={() => { if (!offerSending) setShowOfferModal(false); }}>✕</button>
              </div>
              <div className="offer-modal-body">
                <div className="offer-modal-product">
                  <img src={product.image || product.imageUrl} alt={product.name} className="offer-modal-img" />
                  <div>
                    <div className="offer-modal-name">{product.name}</div>
                    <div className="offer-modal-price">¥{product.price}</div>
                  </div>
                </div>
                <div className="offer-modal-row">
                  <span className="offer-modal-label">报价金额</span>
                  <div className="offer-modal-price-input">
                    <span className="offer-price-sign">¥</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="输入金额"
                      className="offer-price-field"
                    />
                  </div>
                </div>
                <div className="offer-modal-row">
                  <span className="offer-modal-label">有效时间</span>
                  <div className="offer-modal-hours-input">
                    <input
                      type="number"
                      min="1"
                      value={offerHours}
                      onChange={(e) => setOfferHours(e.target.value)}
                      placeholder="小时"
                      className="offer-hours-field"
                    />
                    <span className="offer-hours-suffix">小时</span>
                  </div>
                </div>
              </div>
              <button className="offer-modal-btn" onClick={handleConfirmOffer} disabled={offerSending}>
                {offerSending ? '发送中...' : '确认报价'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default ProductDetail;
