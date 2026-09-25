const { getStore } = require('@netlify/blobs');

// All posts live as one JSON array under a single blob key.
// Fine for a small demo app; a real app would use one record per post.
async function loadPosts(store) {
  const data = await store.get('posts', { type: 'json' });
  return data || [];
}

exports.handler = async (event) => {
  const store = getStore('social');

  if (event.httpMethod === 'GET') {
    const posts = await loadPosts(store);
    // newest first
    posts.sort((a, b) => b.createdAt - a.createdAt);
    return { statusCode: 200, body: JSON.stringify(posts) };
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const author = (body.author || '').trim().slice(0, 24);
    const content = (body.content || '').trim().slice(0, 2000);
    if (!author || !content) {
      return { statusCode: 400, body: JSON.stringify({ error: 'author and content are required' }) };
    }

    const posts = await loadPosts(store);
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

    return { statusCode: 201, body: JSON.stringify(post) };
  }

  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    const author = event.queryStringParameters && event.queryStringParameters.author;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id is required' }) };

    const posts = await loadPosts(store);
    const target = posts.find((p) => p.id === id);
    if (!target) return { statusCode: 404, body: JSON.stringify({ error: 'Post not found' }) };
    // No real auth in this demo — we just check the claimed display name matches.
    if (target.author !== author) return { statusCode: 403, body: JSON.stringify({ error: 'Not your post' }) };

    await store.setJSON('posts', posts.filter((p) => p.id !== id));
    return { statusCode: 204, body: '' };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
};
