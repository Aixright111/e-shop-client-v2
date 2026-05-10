import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('user');

      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          // 检查用户信息是否有效
          if (user && (user.username || user.email)) {
            setIsLoggedIn(true);
            setAvatarUrl(user.avatarUrl || '');
            // 优先使用username，其次使用email的@前部分
            if (user.username) {
              setUserName(user.username);
            } else if (user.email) {
              setUserName(user.email.split('@')[0]);
            } else {
              setUserName('用户');
            }
          } else {
            setIsLoggedIn(false);
            setUserName('');
            setAvatarUrl('');
          }
        } catch (e) {
          setIsLoggedIn(false);
          setUserName('');
          setAvatarUrl('');
        }
      } else {
        setIsLoggedIn(false);
        setUserName('');
        setAvatarUrl('');
      }
    };

    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [navigate]);

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
                  <div className="dropdown-item dropdown-item-danger" onClick={() => { setDropdownOpen(false); localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/user/login'); }}>
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
