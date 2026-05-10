/*
 * 认证相关 API 接口
 * 向后端 Spring Boot 发送登录/注册请求
 */

const BASE_URL = 'http://localhost:8080/user';

/**
 * 登录请求
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 */
export async function loginApi(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

/**
 * 注册请求
 * @param {string} username - 用户名
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 */
export async function registerApi(username, email, password) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
}

/**
 * 获取用户信息
 * @param {string} token - 认证令牌
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 */
export async function getUserInfoApi(token) {
  const res = await fetch(`${BASE_URL}/info`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  return res.json();
}

/**
 * 更新用户信息
 * @param {Object} userData - 要更新的用户数据 { username, email, avatarUrl }
 * @param {string} token - 认证令牌
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 */
export async function updateUserApi(userData, token) {
  const res = await fetch(`${BASE_URL}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  return res.json();
}
