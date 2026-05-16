import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadProductImage } from '../api/supabase';
import { addProductApi } from '../api/product';
import Navbar from './Navbar';
import './AddProduct.css';

function AddProduct() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState('');
  const [mainFile, setMainFile] = useState(null);
  const [mainPreview, setMainPreview] = useState('');
  const [bannerFiles, setBannerFiles] = useState([]);
  const [bannerPreviews, setBannerPreviews] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const CATEGORIES = [
    { name: '数码电子', typeId: 0 },
    { name: '生活日用', typeId: 1 },
    { name: '充值代练', typeId: 2 },
    { name: '其他', typeId: 3 },
  ];

  useEffect(() => {
    const userInfo = localStorage.getItem('user');
    if (!userInfo) {
      navigate('/user/login');
    }
  }, [navigate]);

  const handleMainFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setMainFile(selected);
    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => setMainPreview(ev.target.result);
    reader.readAsDataURL(selected);
  };

  const handleBannerFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    if (bannerFiles.length >= 5) {
      setError('最多上传5张轮播图');
      return;
    }

    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setBannerPreviews(prev => [...prev, ev.target.result]);
      setBannerFiles(prev => [...prev, selected]);
    };
    reader.readAsDataURL(selected);

    e.target.value = '';
  };

  const removeBanner = (index) => {
    setBannerFiles(prev => prev.filter((_, i) => i !== index));
    setBannerPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mainFile) {
      setError('请选择商品图片');
      return;
    }
    if (!name.trim()) {
      setError('请输入商品名称');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('请输入有效的商品价格');
      return;
    }
    if (typeId === '') {
      setError('请选择商品分类');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('请先登录');
      return;
    }

    setSubmitting(true);

    try {
      const imageUrl = await uploadProductImage(mainFile);

      const bannerUrls = [];
      for (const file of bannerFiles) {
        const url = await uploadProductImage(file);
        bannerUrls.push(url);
      }

      const result = await addProductApi(
        {
          name: name.trim(),
          price: Number(price),
          imageUrl,
          description: description.trim(),
          typeId,
          bannerUrls: bannerUrls.length > 0 ? bannerUrls : undefined,
        },
        token
      );

      if (result.code === 0) {
        alert('商品上架成功！');
        navigate('/products');
      } else {
        setError(result.message || '上架失败');
      }
    } catch (err) {
      setError(err.message || '操作失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-product-container">
      <Navbar />
      <div className="add-product-content">
        <div className="add-product-card">
          <h1 className="add-product-title">上架商品</h1>

          <form onSubmit={handleSubmit} className="add-product-form">
            {/* 主图上传 */}
            <div className="form-group">
              <label>商品图片</label>
              <div
                className="image-upload-area"
                onClick={() => document.getElementById('mainFileInput').click()}
              >
                {mainPreview ? (
                  <img src={mainPreview} alt="预览" className="image-preview" />
                ) : (
                  <div className="image-placeholder">
                    <span className="upload-icon">+</span>
                    <span>点击选择图片</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="mainFileInput"
                accept="image/*"
                onChange={handleMainFileChange}
                hidden
              />
            </div>

            {/* 轮播图上传 */}
            <div className="form-group">
              <label>轮播展示图 <span style={{ fontWeight: 400, color: '#999' }}>（最多5张，可选）</span></label>
              <div className="banner-upload-grid">
                {bannerPreviews.map((preview, index) => (
                  <div key={index} className="banner-thumb-wrapper">
                    <img src={preview} alt={`轮播图${index + 1}`} className="banner-thumb-img" />
                    <button type="button" className="banner-thumb-remove" onClick={() => removeBanner(index)}>✕</button>
                  </div>
                ))}
                {bannerPreviews.length < 5 && (
                  <div className="banner-add-cell" onClick={() => document.getElementById('bannerFileInput').click()}>
                    <span className="banner-add-icon">+</span>
                    <span className="banner-add-text">添加图片</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="bannerFileInput"
                accept="image/*"
                onChange={handleBannerFileChange}
                hidden
              />
            </div>

            {/* 商品名称 */}
            <div className="form-group">
              <label htmlFor="name">商品名称</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入商品名称"
                maxLength={100}
              />
            </div>

            {/* 商品价格 */}
            <div className="form-group">
              <label htmlFor="price">商品价格 (¥)</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="请输入价格"
                min="0"
                step="0.01"
              />
            </div>

            {/* 商品分类 */}
            <div className="form-group">
              <label htmlFor="category">商品分类</label>
              <select
                id="category"
                value={typeId}
                onChange={(e) => setTypeId(Number(e.target.value))}
                className="category-select"
              >
                <option value="">请选择分类</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.typeId} value={cat.typeId}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* 商品描述 */}
            <div className="form-group">
              <label htmlFor="description">商品描述</label>
              <textarea
                id="description"
                className="description-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请描述你的商品..."
                rows={4}
                maxLength={500}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? '上架中...' : '确认上架'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
