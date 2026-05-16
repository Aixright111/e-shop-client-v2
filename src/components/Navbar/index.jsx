import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 每次渲染时直接从 localStorage 读取登录状态，保证即时反映退出登录
  const token = localStorage.getItem('token');
  let isLoggedIn = false;
  let userName = '';
  let avatarUrl = '';

  if (token) {
    try {
      const userInfo = localStorage.getItem('user');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user && (user.username || user.email)) {
          isLoggedIn = true;
          avatarUrl = user.avatarUrl || '';
          userName = user.username || (user.email ? user.email.split('@')[0] : '用户');
        }
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        E-Shop
      </div>
      <div className="navbar-links">
        {isLoggedIn ? (
          <>
            <span className="navbar-link-btn" onClick={() => navigate('/messages')}>
              消息
            </span>
            <span className="navbar-link-btn" onClick={() => navigate('/my-quotes')}>
              我的报价
            </span>
            <span className="navbar-add-product" onClick={() => navigate('/product/add')}>
              上架商品
            </span>
            <div className="navbar-avatar-wrapper" ref={dropdownRef}>
              <div className="navbar-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userName || 'user'}`}
                  alt="头像"
                  className="avatar-img"
                />
                <span className="avatar-name">{userName || '用户'}</span>
              </div>
              {dropdownOpen && (
                <div className="avatar-dropdown">
                  <div className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/my-store'); }}>
                    我的店铺
                  </div>
                  <div className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/user'); }}>
                    个人信息
                  </div>
                  <div className="dropdown-divider" />
                  <div className="dropdown-item dropdown-item-danger" onClick={() => { setDropdownOpen(false); localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }}>
                    退出登录
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <button className="navbar-login-btn" onClick={() => navigate('/user/login')}>
            登录
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
