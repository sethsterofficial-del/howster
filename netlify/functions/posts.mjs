import { getStore } from '@netlify/blobs';

export default async (req) => {
  const store = getStore('social');

  if (req.method === 'GET') {
    const posts = (await store.get('posts', { type: 'json' })) || [];
    posts.sort((a, b) => b.createdAt - a.createdAt);
    return new Response(JSON.stringify(posts), {
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

    const author = (body.author || '').trim().slice(0, 24);
    const content = (body.content || '').trim().slice(0, 2000);
    if (!author || !content) {
      return new Response(JSON.stringify({ error: 'author and content are required' }), { status: 400 });
    }

    const posts = (await store.get('posts', { type: 'json' })) || [];
    const post = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      author,
      content,
      createdAt: Date.now(),
      likedBy: [],
      comments: [],
    };
    posts.push(post);
    await store.setJSON('posts', posts);

    return new Response(JSON.stringify(post), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const author = url.searchParams.get('author');
    if (!id) return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });

    const posts = (await store.get('posts', { type: 'json' })) || [];
    const target = posts.find((p) => p.id === id);
    if (!target) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    if (target.author !== author) return new Response(JSON.stringify({ error: 'Not your post' }), { status: 403 });

    await store.setJSON('posts', posts.filter((p) => p.id !== id));
    return new Response(null, { status: 204 });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
};
