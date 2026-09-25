# Social App — Shared version (Netlify Functions + Blobs)

This version fixes the "other person can't see my post" problem: posts now
live in a shared store (Netlify Blobs) that every visitor's browser reads
from, instead of each browser's own local storage.

**Important:** drag-and-drop deploy does NOT run Netlify Functions. You need
one of the two options below.

## Option A: Connect to GitHub (recommended)

1. Create a new GitHub repo and push this folder's contents to it.
2. In Netlify: **Add new project → Import an existing project → connect to
   GitHub**, and pick the repo.
3. Netlify reads `netlify.toml` automatically — no publish directory or
   functions directory setting needed, it's already in the file.
4. Deploy. Give it a minute to install dependencies and build.

## Option B: Netlify CLI (no GitHub needed)

```bash
npm install -g netlify-cli
cd netlify-social-shared
npm install
netlify login
netlify deploy --prod
```
When prompted, point it at this folder. This runs a full build (installing
`@netlify/blobs` and bundling your functions), which drag-and-drop skips.

## How it works

- `public/index.html` — the whole frontend, calls `/.netlify/functions/...`
- `netlify/functions/posts.js` — list all posts (GET), create a post (POST),
  delete your own post (DELETE)
- `netlify/functions/like.js` — toggle a like
- `netlify/functions/comment.js` — add a comment
- All of the above read/write one JSON blob via `@netlify/blobs`'s
  `getStore('social')` — Netlify's built-in, zero-setup data store. No
  external database account needed.

## Still no real accounts

Anyone can type any display name and post/delete as "them" — there's no
password or session check. That's fine for a quick shared demo among people
who trust each other, but not for a public-facing app. Real accounts would
need the login/JWT setup from the very first version I gave you, adapted to
call Netlify Functions instead of an Express server.
