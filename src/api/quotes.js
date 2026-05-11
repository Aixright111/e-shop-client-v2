const BASE_URL = 'http://localhost:8080/orders';

export async function getReceivedQuotesApi(userId, token) {
  const res = await fetch(`${BASE_URL}/received/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getSentQuotesApi(userId, token) {
  const res = await fetch(`${BASE_URL}/sent/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return res.json();
}
