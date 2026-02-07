# Nobzo Blog API

Simple Blog REST API for Nobzo technical evaluation.

Tech: Node.js, Express, MongoDB, Mongoose

Environment variables (see `.env.example`):

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - secret for signing JWTs
- `PORT` - port to run server

MongoDB URI setup

- Local MongoDB (Compass or local service): use `mongodb://localhost:27017/nobzo-blog`
- MongoDB Atlas: create a free cluster, add a database user, whitelist your IP, then copy the SRV connection string and set `MONGODB_URI` to it (e.g., `mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority`)

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

Sample test

```js
const request = require('supertest');
const app = require('../src/app');

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login Test User',
      email: 'login@example.com',
      password: 'password123'
    });
  });

  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
```

Curl

curl -X 'POST' \
  'http://localhost:3000/api/auth/register' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "joe derek",
  "email": "joederek@gmail.com",
  "password": "password123"
}'
Request URL
http://localhost:3000/api/auth/register
Server response
Code	Details
201	
Response body

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODczOTIzNzBmNmY1NTI3Mzk3NmFlZiIsImlhdCI6MTc3MDQ2OTY2NywiZXhwIjoxNzcxMDc0NDY3fQ.qvbNUTMKrmvAGrwcNBo4JTyqWetjNjn4x91nVH3zRZQ",
  "user": {
    "id": "6987392370f6f55273976aef",
    "name": "joe derek",
    "email": "joederek@gmail.com"
  }
}

curl -X 'POST' \
  'http://localhost:3000/api/auth/login' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "joederek@gmail.com",
  "password": "password123"
}'
Request URL
http://localhost:3000/api/auth/login
Server response
Code	Details
200	
Response body
Download
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODczOTIzNzBmNmY1NTI3Mzk3NmFlZiIsImlhdCI6MTc3MDQ2OTc1NiwiZXhwIjoxNzcxMDc0NTU2fQ.cBpKCdJi4ouw3106I2RlGSrbJCwvWT3agYAkubFpoeA",
  "user": {
    "id": "6987392370f6f55273976aef",
    "name": "joe derek",
    "email": "joederek@gmail.com"
  }
}

Curl

curl -X 'POST' \
  'http://localhost:3000/api/posts' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODczOTIzNzBmNmY1NTI3Mzk3NmFlZiIsImlhdCI6MTc3MDQ2OTc1NiwiZXhwIjoxNzcxMDc0NTU2fQ.cBpKCdJi4ouw3106I2RlGSrbJCwvWT3agYAkubFpoeA' \
  -H 'Content-Type: application/json' \
  -d '{
  "title": "Hello",
  "content": "Hello joe derek",
  "tags": [
    "joe"
  ],
  "status": "published"
}'
Request URL
http://localhost:3000/api/posts
Server response
Code	Details
201	
Response body
Download
{
  "title": "Hello",
  "content": "Hello joe derek",
  "author": "6987392370f6f55273976aef",
  "status": "published",
  "tags": [
    "joe"
  ],
  "deletedAt": null,
  "_id": "69873a3a70f6f55273976af3",
  "createdAt": "2026-02-07T13:12:26.463Z",
  "slug": "hello",
  "updatedAt": "2026-02-07T13:12:26.481Z",
  "__v": 0
}

Curl

//get post by slug
curl -X 'GET' \
  'http://localhost:3000/api/posts/hello' \
  -H 'accept: */*'
Request URL
http://localhost:3000/api/posts/hello
Server response
Code	Details
200	
Response body
Download
{
  "_id": "69873a3a70f6f55273976af3",
  "title": "Hello",
  "content": "Hello joe derek",
  "author": {
    "_id": "6987392370f6f55273976aef",
    "name": "joe derek",
    "email": "joederek@gmail.com"
  },
  "status": "published",
  "tags": [
    "joe"
  ],
  "deletedAt": null,
  "createdAt": "2026-02-07T13:12:26.463Z",
  "slug": "hello",
  "updatedAt": "2026-02-07T13:12:26.481Z",
  "__v": 0
}


curl -X 'PUT' \
  'http://localhost:3000/api/posts/69873a3a70f6f55273976af3' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODczOTIzNzBmNmY1NTI3Mzk3NmFlZiIsImlhdCI6MTc3MDQ2OTc1NiwiZXhwIjoxNzcxMDc0NTU2fQ.cBpKCdJi4ouw3106I2RlGSrbJCwvWT3agYAkubFpoeA' \
  -H 'Content-Type: application/json' \
  -d '{
  "title": "string",
  "content": "string",
  "tags": [
    "string"
  ],
  "status": "draft"
}'
Request URL
http://localhost:3000/api/posts/69873a3a70f6f55273976af3
Server response
Code	Details
200	
Response body
Download
{
  "_id": "69873a3a70f6f55273976af3",
  "title": "string",
  "content": "string",
  "author": "6987392370f6f55273976aef",
  "status": "draft",
  "tags": [
    "string"
  ],
  "deletedAt": null,
  "createdAt": "2026-02-07T13:12:26.463Z",
  "slug": "hello",
  "updatedAt": "2026-02-07T13:16:51.964Z",
  "__v": 1
}


GET
/api/posts
List posts

Parameters
Cancel
Name	Description
page
integer
(query)
1
limit
integer
(query)
10
search
string
(query)
joe
tag
string
(query)
tag
author
string
(query)
Author ID

author
status
string
(query)

published
Execute
Clear
Responses
Curl

curl -X 'GET' \
  'http://localhost:3000/api/posts?page=1&limit=10&search=joe&status=published' \
  -H 'accept: */*'
Request URL
http://localhost:3000/api/posts?page=1&limit=10&search=joe&status=published
Server response
Code	Details
200	
Response body
Download
{
  "page": 1,
  "limit": 10,
  "total": 1,
  "items": [
    {
      "_id": "69873fbae47f5bffae478945",
      "title": "joe",
      "content": "joe derek is a goood guy",
      "author": {
        "_id": "6987392370f6f55273976aef",
        "name": "joe derek",
        "email": "joederek@gmail.com"
      },
      "status": "published",
      "tags": [
        "derek"
      ],
      "deletedAt": null,
      "createdAt": "2026-02-07T13:35:54.488Z",
      "slug": "joe",
      "updatedAt": "2026-02-07T13:35:54.497Z",
      "__v": 0
    }
  ]
}

Notes

- Passwords are hashed with bcrypt.
- JWTs are used for authentication.
- Soft delete is implemented via `deletedAt`.
