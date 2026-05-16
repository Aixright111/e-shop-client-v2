import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerApi } from '../../api/auth';
import '../Login/Login.css';

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 前端校验：空值检查
    if (!username || !email || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    // 前端校验：邮箱格式
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    // 前端校验：两次密码是否一致
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    // 前端校验：密码长度
    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    try {
      // 调用后端注册接口
      const result = await registerApi(username, email, password);

      if (result.code === 200) {
        // 注册成功，提示并跳转到登录页
        alert('注册成功，请登录');
        navigate('/user/login');
      } else {
        // 后端返回的业务错误（如用户名已存在）
        setError(result.message || '注册失败');
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
          <h2>用户注册</h2>
          <p>创建您的账户，开始购物之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>

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
              placeholder="请输入密码（至少6位）"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn">注册</button>
        </form>

        <div className="login-footer">
          <span>已有账户？</span>
          {/* 跳转到登录页 */}
          <a href="/user/login">立即登录</a>
        </div>
      </div>
    </div>
  );
}

export default Register;
