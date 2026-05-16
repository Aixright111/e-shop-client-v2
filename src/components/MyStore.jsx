import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { getUserProductsApi, deleteProductApi } from '../api/product';
import { deleteProductImage } from '../api/supabase';
import './Products.css';

function MyStore() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [searchName, setSearchName] = useState('');

  const PAGE_SIZE = 10;
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.id;
  const CATEGORIES = [
    { name: '全部', typeId: null },
    { name: '数码电子', typeId: 0 },
    { name: '生活日用', typeId: 1 },
    { name: '充值代练', typeId: 2 },
    { name: '其他', typeId: 3 },
  ];

  useEffect(() => {
    if (!userId) {
      navigate('/user/login');
      return;
    }
    fetchProducts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedTypeId, searchName]);

  const handleCategoryChange = (typeId) => {
    if (typeId === selectedTypeId) return;
    setSelectedTypeId(typeId);
    setCurrentPage(0);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    setSearchName(e.target.search.value);
  };

  const handleSearchClear = () => {
    setSearchName('');
    setCurrentPage(0);
  };

  const fetchProducts = async (page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUserProductsApi(userId, page, PAGE_SIZE, selectedTypeId, searchName);
      if (res.code === 0 && res.data) {
        const items = res.data.items || [];
        const total = res.data.total || 0;
        const pages = Math.ceil(total / PAGE_SIZE);

        if (items.length === 0 && page > 0 && total > 0) {
          setCurrentPage(0);
          return;
        }

        setProducts(items);
        setTotalPages(pages);
      } else {
        setError(res.message || '获取商品列表失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const token = localStorage.getItem('token');

  const handleDelist = async (product) => {
    if (!window.confirm('确定要下架该商品吗？')) return;
    try {
      const res = await deleteProductApi(product.id, token);
      if (res.code === 0) {
        // 后端返回的 data 中包含图片 URL，从 Supabase 存储桶中删除
        const imageUrl = res.data || product.image || product.imageUrl;
        if (imageUrl) {
          deleteProductImage(imageUrl);
        }
        fetchProducts(currentPage);
      } else {
        alert(res.message || '下架失败');
      }
    } catch {
      alert('网络错误，请稍后重试');
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="products-container">
      <Navbar />
      <div className="products-banner">
        <div className="products-banner-inner">
          <div>
            <h1>我的店铺</h1>
            <p className="products-banner-sub">管理你上架的商品</p>
          </div>
          <form className="search-bar" onSubmit={handleSearch}>
            {searchName && (
              <button type="button" className="search-clear" onClick={handleSearchClear}>✕</button>
            )}
            <input
              name="search"
              className="search-input"
              placeholder="搜索商品名称..."
              defaultValue={searchName}
            />
            <button type="submit" className="search-btn">搜索</button>
          </form>
        </div>
      </div>
      <div className="products-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.typeId}
            className={`category-btn ${selectedTypeId === cat.typeId ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.typeId)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="products-content">

        {loading && (
          <div className="products-loading">
            <div className="loading-spinner" />
            加载中...
          </div>
        )}

        {error && (
          <div className="products-error">
            <span className="products-error-icon">!</span>
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="products-empty">
            <span className="products-empty-icon">📦</span>
            <p>还没有上架商品</p>
            <button className="messages-empty-btn" onClick={() => navigate('/product/add')}>
              去上架
            </button>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
                  <div className="product-image-wrapper">
                    <img src={product.image || product.imageUrl} alt={product.name} className="product-image" loading="lazy" />
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    {product.detailView !== undefined && (
                      <div className="product-views">
                        <span className="product-views-icon">&#128065;</span>
                        <span className="product-views-count">{product.detailView}</span>
                      </div>
                    )}
                    <div className="product-footer">
                      <span className="product-price">{product.price}</span>
                      <div className="product-actions">
                        <button className="edit-btn" onClick={(e) => { e.stopPropagation(); navigate(`/product/edit/${product.id}`); }}>
                          修改
                        </button>
                        <button className="delist-btn" onClick={(e) => { e.stopPropagation(); handleDelist(product); }}>
                          下架
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  上一页
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page + 1}
                  </button>
                ))}

                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MyStore;
