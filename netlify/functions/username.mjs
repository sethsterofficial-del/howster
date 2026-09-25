import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const username = (body.username || '').trim().slice(0, 24);
  const token = body.token || null;
  if (!username) {
    return new Response(JSON.stringify({ error: 'username is required' }), { status: 400 });
  }

  const store = getStore('social');
  const usernames = (await store.get('usernames', { type: 'json' })) || {};
  const existingToken = usernames[username];

  if (existingToken) {
    if (token && token === existingToken) {
      return new Response(JSON.stringify({ success: true, token: existingToken }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: false, error: 'That username is already taken' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const newToken = crypto.randomUUID();
  usernames[username] = newToken;
  await store.setJSON('usernames', usernames);

  return new Response(JSON.stringify({ success: true, token: newToken }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
