import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerApi, sendCodeApi } from '../api/auth';
import './Login.css';

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('请先输入有效的邮箱地址');
      return;
    }
    setSendingCode(true);
    setError('');
    try {
      const res = await sendCodeApi(email);
      if (res.code === 0 || res.code === 200) {
        setCodeSent(true);
        startCountdown();
      } else {
        setError(res.message || '发送验证码失败');
      }
    } catch (err) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    if (!code) {
      setError('请输入验证码');
      return;
    }

    try {
      const result = await registerApi(username, email, password, code);

      if (result.code === 200) {
        alert('注册成功，请登录');
        navigate('/user/login');
      } else {
        setError(result.message || '注册失败');
      }
    } catch (err) {
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
            <div className="code-input-row">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="send-code-btn"
                onClick={handleSendCode}
                disabled={!email || sendingCode || countdown > 0}
              >
                {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="code">验证码</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入邮箱验证码"
              maxLength={6}
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
          <a href="/user/login">立即登录</a>
        </div>
      </div>
    </div>
  );
}

export default Register;
