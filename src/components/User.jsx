import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserApi, sendCodeApi, resetPasswordApi } from '../api/auth';
import { uploadAvatarImage } from '../api/supabase';
import './User.css';

function User() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showPwdChange, setShowPwdChange] = useState(false);
  const [pwdCode, setPwdCode] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [sendingPwdCode, setSendingPwdCode] = useState(false);
  const [pwdCountdown, setPwdCountdown] = useState(0);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const pwdTimerRef = useRef(null);

  useEffect(() => {
    const fetchUserInfo = () => {
      const userInfo = localStorage.getItem('user');
      if (!userInfo) {
        navigate('/user/login');
        return;
      }
      try {
        const user = JSON.parse(userInfo);
        if (user && (user.username || user.name || user.email)) {
          setUser(user);
          setFormData({
            username: user.username || user.name || '',
            email: user.email || '',
          });
        } else {
          setError('用户信息无效');
        }
      } catch (err) {
        setError('用户信息解析失败');
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    setUploading(true);
    try {
      const url = await uploadAvatarImage(avatarFile, user.id);
      return url;
    } catch (err) {
      console.error('Supabase upload error:', err);
      setSaveError('头像上传失败: ' + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaveError('');
    setSaving(true);
    try {
      let avatarUrl = user.avatarUrl || '';
      if (avatarFile) {
        const url = await uploadAvatar();
        if (url) {
          avatarUrl = url;
        } else if (!url && avatarFile) {
          setSaving(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setSaveError('请重新登录');
        setSaving(false);
        return;
      }

      const res = await updateUserApi(
        { username: formData.username, email: formData.email, avatarUrl },
        token
      );

      if (res.code === 0) {
        const updatedUser = res.data || { ...user, username: formData.username, email: formData.email, avatarUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('user-updated'));
        setUser(updatedUser);
        setEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        setSaveError(res.message || '保存失败');
      }
    } catch (err) {
      setSaveError('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user.username || user.name || '',
      email: user.email || '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setSaveError('');
    setEditing(false);
  };

  const startPwdCountdown = () => {
    setPwdCountdown(60);
    clearInterval(pwdTimerRef.current);
    pwdTimerRef.current = setInterval(() => {
      setPwdCountdown((prev) => {
        if (prev <= 1) { clearInterval(pwdTimerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendPwdCode = async () => {
    if (!user?.email) { setPwdError('无法获取邮箱'); return; }
    setSendingPwdCode(true);
    setPwdError('');
    try {
      const res = await sendCodeApi(user.email);
      if (res.code === 0 || res.code === 200) {
        startPwdCountdown();
      } else {
        setPwdError(res.message || '发送验证码失败');
      }
    } catch (err) {
      setPwdError(err.message || '网络错误');
    } finally {
      setSendingPwdCode(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdError('');
    if (!pwdCode) { setPwdError('请输入验证码'); return; }
    if (!pwdNew) { setPwdError('请输入新密码'); return; }
    if (pwdNew !== pwdConfirm) { setPwdError('两次输入的密码不一致'); return; }
    if (pwdNew.length < 6) { setPwdError('密码长度不能少于6位'); return; }

    setPwdSubmitting(true);
    try {
      const res = await resetPasswordApi(user.email, pwdCode, pwdNew);
      if (res.code === 0 || res.code === 200) {
        alert('密码修改成功');
        setShowPwdChange(false);
        setPwdCode('');
        setPwdNew('');
        setPwdConfirm('');
      } else {
        setPwdError(res.message || '修改失败');
      }
    } catch (err) {
      setPwdError(err.message || '网络错误');
    } finally {
      setPwdSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('aiChatMessages');
    window.dispatchEvent(new CustomEvent('clearAiChat'));
    navigate('/');
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (user.avatarUrl) return user.avatarUrl;
    const seed = user.username || user.name || 'user';
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
  };

  if (loading) {
    return <div className="user-loading">加载中...</div>;
  }

  if (error) {
    return <div className="user-error">{error}</div>;
  }

  return (
    <div className="user-container">
      <div className="user-card">
        <div className="user-header">
          <h2>个人信息</h2>
          {!editing && (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              编辑
            </button>
          )}
        </div>

        <div className="user-avatar-section">
          <div className="avatar-wrapper">
            <img
              src={getAvatarUrl()}
              alt="头像"
              className="user-avatar"
            />
            {editing && (
              <label className="avatar-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="avatar-input"
                />
                {uploading ? '上传中...' : '更换头像'}
              </label>
            )}
          </div>
        </div>

        {editing ? (
          <div className="user-form">
            <div className="form-item">
              <label>用户名</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="form-input"
                placeholder="请输入用户名"
              />
            </div>

            <div className="form-item">
              <label>邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                placeholder="请输入邮箱"
              />
            </div>

            {saveError && <div className="form-error">{saveError}</div>}

            <div className="form-actions">
              <button className="save-btn" onClick={handleSave} disabled={saving || uploading}>
                {saving || uploading ? '保存中...' : '保存'}
              </button>
              <button className="cancel-btn" onClick={handleCancel} disabled={saving || uploading}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="user-info">
            <div className="info-item">
              <label>用户名</label>
              <span>{user.username || user.name || '未知'}</span>
            </div>

            <div className="info-item">
              <label>用户ID</label>
              <span>{user.id}</span>
            </div>

            <div className="info-item">
              <label>邮箱</label>
              <span>{user.email}</span>
            </div>

            <div className="info-item">
              <label>注册时间</label>
              <span>{user.createdAt || '未知'}</span>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32 }}>
          <button className="pwd-btn" onClick={() => setShowPwdChange(true)}>修改密码</button>
        </div>

        <div className="user-actions">
          <button className="logout-btn" onClick={handleLogout}>退出登录</button>
        </div>

        {/* 修改密码弹窗 */}

        {/* 修改密码弹窗 */}
        {showPwdChange && (
          <div className="modal-overlay" onClick={() => setShowPwdChange(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>修改密码</h3>
                <button className="modal-close" onClick={() => setShowPwdChange(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="code-input-row" style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    value={pwdCode}
                    onChange={(e) => setPwdCode(e.target.value)}
                    placeholder="验证码"
                    maxLength={6}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, outline: 'none' }}
                  />
                  <button
                    type="button"
                    className="send-code-btn"
                    onClick={handleSendPwdCode}
                    disabled={sendingPwdCode || pwdCountdown > 0}
                  >
                    {sendingPwdCode ? '发送中...' : pwdCountdown > 0 ? `${pwdCountdown}s` : '发送验证码'}
                  </button>
                </div>
                <input
                  type="password"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  placeholder="新密码（至少6位）"
                  className="modal-input"
                />
                <input
                  type="password"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  placeholder="确认新密码"
                  className="modal-input"
                />
                {pwdError && <div className="form-error">{pwdError}</div>}
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowPwdChange(false)}>取消</button>
                <button className="save-btn" onClick={handleChangePassword} disabled={pwdSubmitting}>
                  {pwdSubmitting ? '修改中...' : '确认'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default User;
