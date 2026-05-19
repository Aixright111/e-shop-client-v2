import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { getUserProductsApi } from '../api/product';
import './Products.css';

function SellerStore() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [sortBy, setSortBy] = useState(null); // null | 'price_asc' | 'price_desc' | 'detailviews'

  const PAGE_SIZE = 10;
  const CATEGORIES = [
    { name: '全部', typeId: null },
    { name: '数码电子', typeId: 0 },
    { name: '生活日用', typeId: 1 },
    { name: '充值代练', typeId: 2 },
    { name: '其他', typeId: 3 },
    { name: '食品酒水', typeId: 4 },
  ];

  useEffect(() => {
    fetchProducts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, userId, selectedTypeId, searchName, sortBy]);

  const togglePriceSort = () => {
    setSortBy(prev => {
      if (prev === 'price_asc') return 'price_desc';
      if (prev === 'price_desc') return null;
      return 'price_asc';
    });
    setCurrentPage(0);
  };

  const toggleDetailViewsSort = () => {
    setSortBy(prev => prev === 'detailviews' ? null : 'detailviews');
    setCurrentPage(0);
  };

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
      let sortField, sortOrder;
      if (sortBy === 'price_asc') { sortField = 'price'; sortOrder = 'asc'; }
      else if (sortBy === 'price_desc') { sortField = 'price'; sortOrder = 'desc'; }
      else if (sortBy === 'detailviews') { sortField = 'detailviews'; sortOrder = 'desc'; }
      const res = await getUserProductsApi(userId, page, PAGE_SIZE, selectedTypeId, searchName, sortField, sortOrder);
      if (res.code === 0 && res.data) {
        const items = res.data.items || [];
        const total = res.data.total || 0;
        const pages = Math.ceil(total / PAGE_SIZE);

        if (items.length === 0 && page > 0 && total > 0) {
          setCurrentPage(0);
          return;
        }

        setProducts(items.filter((p) => p.show !== false));
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
            <h1>卖家店铺</h1>
            <p className="products-banner-sub">该卖家的所有商品</p>
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
        <div className="sort-group">
          <button
            className={`sort-btn ${sortBy && sortBy.startsWith('price') ? 'active' : ''}`}
            onClick={togglePriceSort}
          >
            价格 {sortBy === 'price_asc' ? '↑' : sortBy === 'price_desc' ? '↓' : ''}
          </button>
          <button
            className={`sort-btn ${sortBy === 'detailviews' ? 'active' : ''}`}
            onClick={toggleDetailViewsSort}
          >
            大家都在看
          </button>
        </div>
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
            <p>该卖家暂无商品</p>
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
                      {product.isOrder ? (
                        <span className="ordered-tag">已有报价</span>
                      ) : (
                        <button className="buy-btn" onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}>
                          购买
                        </button>
                      )}
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

export default SellerStore;
