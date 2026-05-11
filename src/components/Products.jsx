import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import { getProductsApi } from '../api/product';
import './Products.css';

function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initTypeId = searchParams.get('typeId');
  const [selectedTypeId, setSelectedTypeId] = useState(initTypeId !== null ? Number(initTypeId) : null);

  const PAGE_SIZE = 10;
  const CATEGORIES = [
    { name: '全部', typeId: null },
    { name: '数码电子', typeId: 0 },
    { name: '生活日用', typeId: 1 },
    { name: '充值代练', typeId: 2 },
    { name: '其他', typeId: 3 },
  ];

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, selectedTypeId]);

  const handleCategoryChange = (typeId) => {
    if (typeId === selectedTypeId) return;
    setSelectedTypeId(typeId);
    setCurrentPage(0);
    if (typeId === null) {
      setSearchParams({});
    } else {
      setSearchParams({ typeId });
    }
  };

  const fetchProducts = async (page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProductsApi(page, PAGE_SIZE, selectedTypeId);
      if (res.code === 0 && res.data) {
        const items = res.data.items || [];
        const total = res.data.total || 0;
        const pages = Math.ceil(total / PAGE_SIZE);

        // 当前页无数据但总数据量不为 0，说明当前页已失效，自动跳回第一页
        if (items.length === 0 && page > 0 && total > 0) {
          setCurrentPage(0);
          return;
        }

        setProducts(items.filter((p) => p.show !== false));
        setTotalPages(pages);
      } else {
        setError(res.message || '获取商品列表失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = (product) => {
    navigate(`/product/${product.id}`);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
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
            <h1>商品列表</h1>
            <p className="products-banner-sub">发现你喜欢的商品</p>
          </div>
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
            <p>暂无商品</p>
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
                    <div className="product-footer">
                      <span className="product-price">{product.price}</span>
                      <button className="buy-btn" onClick={(e) => { e.stopPropagation(); handleBuy(product); }}>
                        购买
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={handlePrevPage}
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
                  onClick={handleNextPage}
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

export default Products;
