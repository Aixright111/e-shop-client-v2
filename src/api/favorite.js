import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/favorites`;

export async function addFavoriteApi(productId, token) {
  const res = await fetch(`${BASE_URL}/add/${productId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  try { return JSON.parse(text); } catch { return { code: 200 }; }
}

export async function getFavoritesApi(token) {
  const res = await fetch(`${BASE_URL}/list`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  try { return JSON.parse(text); } catch { return { code: 0, data: [] }; }
}

export async function removeFavoriteApi(productId, token) {
  const res = await fetch(`${BASE_URL}/${productId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  try { return JSON.parse(text); } catch { return { code: 200 }; }
}

export async function getRecommendApi(token) {
  const res = await fetch(`${BASE_URL}/recommend`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  try { return JSON.parse(text); } catch { return { code: 0, data: [] }; }
}
