import { getStore } from '@netlify/blobs';

export default async (req) => {
  const store = getStore('social');

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const me = (url.searchParams.get('me') || '').trim();
    const withUser = (url.searchParams.get('with') || '').trim();
    if (!me) {
      return new Response(JSON.stringify({ error: 'me is required' }), { status: 400 });
    }

    const messages = (await store.get('messages', { type: 'json' })) || [];
    let result;
    if (withUser) {
      result = messages.filter(
        (m) => (m.from === me && m.to === withUser) || (m.from === withUser && m.to === me)
      );
    } else {
      result = messages.filter((m) => m.from === me || m.to === me);
    }
    result.sort((a, b) => a.createdAt - b.createdAt);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const from = (body.from || '').trim().slice(0, 24);
    const to = (body.to || '').trim().slice(0, 24);
    const content = (body.content || '').trim().slice(0, 1000);
    if (!from || !to || !content) {
      return new Response(JSON.stringify({ error: 'from, to, and content are required' }), { status: 400 });
    }
    if (from === to) {
      return new Response(JSON.stringify({ error: "You can't message yourself" }), { status: 400 });
    }

    const messages = (await store.get('messages', { type: 'json' })) || [];
    const message = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      from,
      to,
      content,
      createdAt: Date.now(),
    };
    messages.push(message);
    await store.setJSON('messages', messages);

    return new Response(JSON.stringify(message), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
};
