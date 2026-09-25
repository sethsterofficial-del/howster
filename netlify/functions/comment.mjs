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

  const postId = body.postId;
  const author = (body.author || '').trim().slice(0, 24);
  const content = (body.content || '').trim().slice(0, 500);
  if (!postId || !author || !content) {
    return new Response(JSON.stringify({ error: 'postId, author, and content are required' }), { status: 400 });
  }

  const store = getStore('social');
  const posts = (await store.get('posts', { type: 'json' })) || [];
  const post = posts.find((p) => p.id === postId);
  if (!post) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });

  post.comments.push({ author, content, createdAt: Date.now() });
  await store.setJSON('posts', posts);

  return new Response(JSON.stringify(post.comments), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
