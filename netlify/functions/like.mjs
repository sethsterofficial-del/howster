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

  const { postId, user } = body;
  if (!postId || !user) {
    return new Response(JSON.stringify({ error: 'postId and user are required' }), { status: 400 });
  }

  const store = getStore('social');
  const posts = (await store.get('posts', { type: 'json' })) || [];
  const post = posts.find((p) => p.id === postId);
  if (!post) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });

  const idx = post.likedBy.indexOf(user);
  if (idx === -1) post.likedBy.push(user);
  else post.likedBy.splice(idx, 1);

  await store.setJSON('posts', posts);
  return new Response(JSON.stringify({ likedBy: post.likedBy }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
