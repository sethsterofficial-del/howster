const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { postId, user } = body;
  if (!postId || !user) {
    return { statusCode: 400, body: JSON.stringify({ error: 'postId and user are required' }) };
  }

  const store = getStore('social');
  const posts = (await store.get('posts', { type: 'json' })) || [];
  const post = posts.find((p) => p.id === postId);
  if (!post) return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };

  const idx = post.likedBy.indexOf(user);
  if (idx === -1) post.likedBy.push(user);
  else post.likedBy.splice(idx, 1);

  await store.setJSON('posts', posts);
  return { statusCode: 200, body: JSON.stringify({ likedBy: post.likedBy }) };
};
