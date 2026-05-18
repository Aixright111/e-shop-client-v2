import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendCodeApi, resetPasswordApi } from '../api/auth';
import './Login.css';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  const startCountdown = () => {
    setCountdown(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    setSendingCode(true);
    setError('');
    try {
      const res = await sendCodeApi(email);
      if (res.code === 0 || res.code === 200) {
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

    if (!code) { setError('请输入验证码'); return; }
    if (!password) { setError('请输入新密码'); return; }
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
    if (password.length < 6) { setError('密码长度不能少于6位'); return; }

    setSubmitting(true);
    try {
      const res = await resetPasswordApi(email, code, password);
      if (res.code === 0 || res.code === 200) {
        alert('密码重置成功，请重新登录');
        navigate('/user/login');
      } else {
        setError(res.message || '重置失败');
      }
    } catch (err) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>忘记密码</h2>
          <p>验证邮箱后重置密码</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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
              placeholder="请输入验证码"
              maxLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">新密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入新密码（至少6位）"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">确认新密码</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? '提交中...' : '重置密码'}
          </button>
        </form>

        <div className="login-footer">
          <span>想起密码？</span>
          <a href="/user/login">返回登录</a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
