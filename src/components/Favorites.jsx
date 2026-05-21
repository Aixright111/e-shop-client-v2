import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavoritesApi, removeFavoriteApi } from '../api/favorite';
import Navbar from './Navbar';
import './Products.css';

function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/user/login'); return; }
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await getFavoritesApi(token);
      if (res.code === 0) {
        setFavorites(res.data || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e, productId) => {
    e.stopPropagation();
    try {
      const res = await removeFavoriteApi(productId, token);
      if (res.code === 0 || res.code === 200) {
        setFavorites(prev => prev.filter(f => f.productId !== productId));
      }
    } catch {}
  };

  return (
    <div className="products-container">
      <Navbar />
      <div className="products-banner">
        <div className="products-banner-inner">
          <h1>我的收藏</h1>
          <p className="products-banner-sub">收藏了你喜欢的商品</p>
        </div>
      </div>
      <div className="products-content">
        {loading && (
          <div className="products-loading">
            <div className="loading-spinner" />
            加载中...
          </div>
        )}

        {!loading && favorites.length === 0 && (
          <div className="products-empty">
            <span className="products-empty-icon">❤️</span>
            <p>暂无收藏</p>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <div className="products-grid">
            {favorites.map((item) => {
              const prodId = item.productId;
              return (
                <div key={prodId} className="product-card" onClick={() => navigate(`/product/${prodId}`)}>
                  <div className="product-image-wrapper">
                    <img src={item.imageUrl} alt={item.name} className="product-image" loading="lazy" />
                    <button className="fav-remove-btn" onClick={(e) => handleRemove(e, prodId)}>✕</button>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{item.name}</h3>
                    <div className="product-footer">
                      <span className="product-price">{item.price}</span>
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

export default Favorites;
