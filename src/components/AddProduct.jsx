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
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('user');
    if (!userInfo) {
      navigate('/user/login');
    }
  }, [navigate]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // 校验文件类型
    if (!selected.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 校验文件大小（最大 5MB）
    if (selected.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setFile(selected);
    setError('');

    // 生成预览
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 校验
    if (!file) {
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

    const token = localStorage.getItem('token');
    if (!token) {
      setError('请先登录');
      return;
    }

    setSubmitting(true);

    try {
      // 1. 上传图片到 Supabase
      const imageUrl = await uploadProductImage(file);

      // 2. 将商品信息发送到后端
      const result = await addProductApi(
        { name: name.trim(), price: Number(price), imageUrl, description: description.trim() },
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
            {/* 图片上传 */}
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
