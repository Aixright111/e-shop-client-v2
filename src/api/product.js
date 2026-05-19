import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/products`;

/**
 * 上架商品
 * @param {Object} productData - 商品数据 { name, price, imageUrl }
 * @param {string} token - 认证令牌
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 */
export async function addProductApi(productData, token) {
  const body = {
    name: productData.name,
    price: productData.price,
    imageUrl: productData.imageUrl,
    description: productData.description,
  };
  if (productData.typeId !== undefined) body.typeId = productData.typeId;
  if (productData.bannerUrls) body.bannerUrls = productData.bannerUrls;
  const res = await fetch(`${BASE_URL}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * 获取商品详情
 * @param {number} id - 商品ID
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 */
export async function getProductDetailApi(id) {
  const res = await fetch(`${BASE_URL}/details/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

/**
 * 分页获取商品列表
 * @param {number} page - 页码（从0开始）
 * @param {number} size - 每页数量
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 *   data 包含 { content, totalPages, totalElements, number, size }
 */
export async function getProductsApi(page = 0, size = 10, typeId = null, name = null, sortField = null, sortOrder = null) {
  const body = { pageNum: page + 1, pageSize: size };
  if (typeId !== null) body.typeId = typeId;
  if (name !== null && name.trim()) body.name = name.trim();
  if (sortField) body.sortField = sortField;
  if (sortOrder) body.sortOrder = sortOrder;
  const res = await fetch(`${BASE_URL}/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function aiGetProductsApi(page = 0, size = 10, typeId = null, name = null, sortField = null, sortOrder = null) {
  const body = { pageNum: page + 1, pageSize: size };
  if (typeId !== null) body.typeId = typeId;
  if (name !== null && name.trim()) body.name = name.trim();
  if (sortField) body.sortField = sortField;
  if (sortOrder) body.sortOrder = sortOrder;
  const res = await fetch(`${BASE_URL}/aiList`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * 分页获取用户自己的商品列表
 * @param {number} userId - 用户ID
 * @param {number} page - 页码（从0开始）
 * @param {number} size - 每页数量
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 */
/**
 * 下架商品
 * @param {number} productId - 商品ID
 * @param {string} token - 认证令牌
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 */
/**
 * 修改商品信息
 * @param {Object} productData - UpdateProductsDTO { id, name, price, imageUrl, description, typeId }
 * @param {string} token - 认证令牌
 * @returns {Promise} - 返回 { code, message, data } 格式的响应
 */
export async function updateProductApi(productData, token) {
  const body = {
    id: productData.id,
    name: productData.name,
    price: productData.price,
    imageUrl: productData.imageUrl,
    description: productData.description,
  };
  if (productData.typeId !== undefined) body.typeId = productData.typeId;
  if (productData.bannerUrls) body.bannerUrls = productData.bannerUrls;
  const res = await fetch(`${BASE_URL}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function deleteProductApi(productId, token) {
  const res = await fetch(`${BASE_URL}/delete/${productId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getUserProductsApi(userId, page = 0, size = 10, typeId = null, name = null, sortField = null, sortOrder = null) {
  const body = { userId, pageNum: page + 1, pageSize: size };
  if (typeId !== null) body.typeId = typeId;
  if (name !== null && name.trim()) body.name = name.trim();
  if (sortField) body.sortField = sortField;
  if (sortOrder) body.sortOrder = sortOrder;
  const res = await fetch(`${BASE_URL}/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
