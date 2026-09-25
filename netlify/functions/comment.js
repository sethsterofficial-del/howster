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

  const postId = body.postId;
  const author = (body.author || '').trim().slice(0, 24);
  const content = (body.content || '').trim().slice(0, 500);
  if (!postId || !author || !content) {
    return { statusCode: 400, body: JSON.stringify({ error: 'postId, author, and content are required' }) };
  }

  const store = getStore('social');
  const posts = (await store.get('posts', { type: 'json' })) || [];
  const post = posts.find((p) => p.id === postId);
  if (!post) return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };

  post.comments.push({ author, content, createdAt: Date.now() });
  await store.setJSON('posts', posts);

  return { statusCode: 201, body: JSON.stringify(post.comments) };
};
