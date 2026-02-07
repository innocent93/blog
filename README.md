# Nobzo Blog API

Simple Blog REST API for Nobzo technical evaluation.

Tech: Node.js, Express, MongoDB, Mongoose

Environment variables (see `.env.example`):

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - secret for signing JWTs
- `PORT` - port to run server

Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` (or set env vars) using `.env.example`.

3. Run:

```bash
npm run dev
```

API Endpoints

Auth

- POST `/api/auth/register` { name, email, password } -> 201 { token, user }
- POST `/api/auth/login` { email, password } -> 200 { token, user }

Posts

- POST `/api/posts` (auth) create post
- GET `/api/posts` public listing (published only) with query params: `page`, `limit`, `search`, `tag`, `author`, `status` (status requires auth)
- GET `/api/posts/:slug` get single published post
- PUT `/api/posts/:id` (auth & author only) update
- DELETE `/api/posts/:id` (auth & author only) soft delete (204)

Sample curl

Register:

```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}'
```

Create post (replace TOKEN):

```bash
curl -X POST http://localhost:3000/api/posts -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d '{"title":"Hello","content":"World","tags":["intro"]}'
```

Notes

- Passwords are hashed with bcrypt.
- JWTs are used for authentication.
- Soft delete is implemented via `deletedAt`.
