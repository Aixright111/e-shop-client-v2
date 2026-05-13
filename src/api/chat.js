import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/chat`;

export async function getConversationsApi(token) {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

);
  return res.json();
}

export async function getConversationMessagesApi(otherUserId, token) {
  const res = await fetch(`${BASE_URL}/messages/${otherUserId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function sendMessageApi(receiverId, content, token) {
  const res = await fetch(`${BASE_URL}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ receiverId, content }),
  });
  return res.json();
}

export async function getUserByIdApi(userId, token) {
  
  const res = await fetch(`${API_BASE}/user/getInfoById/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
   
    },
  });
  
  return res.json();
}

export async function markMessagesAsReadApi(conversationId, token) {
  const res = await fetch(`${BASE_URL}/read`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ conversationId }),
  });
  return res.json();
}

