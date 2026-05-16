import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadProductImage } from '../api/supabase';
import { getProductDetailApi, updateProductApi } from '../api/product';
import Navbar from './Navbar';
import './AddProduct.css';

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [existingBannerUrls, setExistingBannerUrls] = useState([]);
  const [newBannerFiles, setNewBannerFiles] = useState([]);
  const [newBannerPreviews, setNewBannerPreviews] = useState([]);
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
      return;
    }
    fetchProduct();
  }, [id, navigate]);

  const fetchProduct = async () => {
    try {
      const res = await getProductDetailApi(id);
      if (res.code === 0 && res.data) {
        const p = res.data;
        setName(p.name || '');
        setPrice(p.price !== undefined ? String(p.price) : '');
        setDescription(p.description || '');
        setTypeId(p.typeId !== undefined && p.typeId !== null ? p.typeId : '');
        setExistingImageUrl(p.image || p.imageUrl || '');
        setPreview(p.image || p.imageUrl || '');
        setExistingBannerUrls(p.bannerUrls || []);
      } else {
        setError(res.message || '获取商品信息失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
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

    setFile(selected);
    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
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

    if (existingBannerUrls.length + newBannerFiles.length >= 5) {
      setError('最多上传5张轮播图');
      return;
    }

    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewBannerPreviews(prev => [...prev, ev.target.result]);
      setNewBannerFiles(prev => [...prev, selected]);
    };
    reader.readAsDataURL(selected);

    e.target.value = '';
  };

  const removeExistingBanner = (index) => {
    setExistingBannerUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewBanner = (index) => {
    setNewBannerFiles(prev => prev.filter((_, i) => i !== index));
    setNewBannerPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      let imageUrl = existingImageUrl;
      if (file) {
        imageUrl = await uploadProductImage(file);
      }

      const bannerUrls = [...existingBannerUrls];
      for (const bannerFile of newBannerFiles) {
        const url = await uploadProductImage(bannerFile);
        bannerUrls.push(url);
      }

      const result = await updateProductApi(
        {
          id: Number(id),
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
        alert('商品修改成功！');
        navigate(`/product/${id}`);
      } else {
        setError(result.message || '修改失败');
      }
    } catch (err) {
      setError(err.message || '操作失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="add-product-container">
        <Navbar />
        <div className="add-product-content">
          <div className="add-product-card" style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
            加载中...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-product-container">
      <Navbar />
      <div className="add-product-content">
        <div className="add-product-card">
          <h1 className="add-product-title">修改商品</h1>

          <form onSubmit={handleSubmit} className="add-product-form">
            {/* 主图上传 */}
            <div className="form-group">
              <label>商品图片</label>
              <div
                className="image-upload-area"
                onClick={() => document.getElementById('fileInput').click()}
              >
                {preview ? (
                  <img src={preview} alt="预览" className="image-preview" />
                ) : (
                  <div className="image-placeholder">
                    <span className="upload-icon">+</span>
                    <span>点击选择图片</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="fileInput"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
            </div>

            {/* 轮播图上传 */}
            <div className="form-group">
              <label>轮播展示图 <span style={{ fontWeight: 400, color: '#999' }}>（最多5张，可选）</span></label>
              <div className="banner-upload-grid">
                {existingBannerUrls.map((url, index) => (
                  <div key={`existing-${index}`} className="banner-thumb-wrapper">
                    <img src={url} alt={`轮播图${index + 1}`} className="banner-thumb-img" />
                    <button type="button" className="banner-thumb-remove" onClick={() => removeExistingBanner(index)}>✕</button>
                  </div>
                ))}
                {newBannerPreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="banner-thumb-wrapper">
                    <img src={preview} alt={`新增轮播图${index + 1}`} className="banner-thumb-img" />
                    <button type="button" className="banner-thumb-remove" onClick={() => removeNewBanner(index)}>✕</button>
                  </div>
                ))}
                {existingBannerUrls.length + newBannerPreviews.length < 5 && (
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
              {submitting ? '修改中...' : '确认修改'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProduct;
