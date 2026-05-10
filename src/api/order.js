const BASE_URL = 'http://localhost:8080/orders';

export async function sendOfferApi({ senderId, receiverId, productId, price, timeHours }, token) {
  const body = {
    buyerId: senderId,
    sellerId: receiverId,
    productId: productId,
    amount: price,
  };
  if (timeHours) body.hours = Number(timeHours);

  const res = await fetch(`${BASE_URL}/offer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function getOffersApi(userId, otherUserId, token) {
  const res = await fetch(`${BASE_URL}/get/${userId}/${otherUserId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return res.json();
}
