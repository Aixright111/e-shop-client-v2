import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, getUserInfoApi } from '../../api/auth';
import './Login.css';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 前端校验：空值检查
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      // 1. 调用后端登录接口获取 token
      const result = await loginApi(email, password);

      if (result.code === 0) {
        // 2. 提取 token 并保存
        const token = result.data;
        if (!token) {
          setError('登录响应中未包含 token');
          return;
        }
        
        localStorage.setItem('token', token);

        // 3. 用 token 请求用户信息
        const userResult = await getUserInfoApi(token);
        if (userResult.code === 0) {
          localStorage.setItem('user', JSON.stringify(userResult.data || {}));
        } else {
          setError(userResult.message || '获取用户信息失败');
          return;
        }

        // 4. 跳转到主页面并刷新
        window.location.href = '/';
      } else {
        // 后端返回的业务错误（如用户名或密码错误）
        setError(result.message || '登录失败');
      }
    } catch (err) {
      // 网络错误或后端服务不可用
      setError('网络错误，请稍后重试');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>用户登录</h2>
          <p>欢迎回来，请登录您的账户</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn">登录</button>
        </form>

        <div className="login-footer">
          <a href="/user/forgot-password">忘记密码？</a>
          <span>·</span>
          {/* 跳转到注册页 */}
          <a href="/user/register">注册账户</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
