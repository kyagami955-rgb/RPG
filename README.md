**Kenynamy (RPG)**

A concise social-sharing web application backend and single-page frontend. This repository contains a Node.js + Express server (`server.js`) that serves a single-page frontend (`index.html`) and exposes a small JSON API for authentication, user profiles, and posts. The project includes Google OAuth integration (real or demo mode), JWT-based authentication for API routes, and simple file uploads for profile photos.

**Table of Contents**
- **Project Overview**: what the app does and its structure.
- **Quick Start**: how to install, configure, and run locally.
- **Environment**: required environment variables.
- **File Structure**: short list of important files and folders.
- **File-by-File Explanation**: clear, accurate descriptions of the code in each key file.
- **API Endpoints**: summary of the routes this project provides.
- **Deployment**: notes about hosting the frontend vs full backend.
- **Contributing & Contact**n+
**Project Overview**

Kenynamy is a minimal social app prototype used for learning and demonstration. It provides:
- User signup/login (email/username + password) and Google OAuth sign-in.
- A user profile with editable bio and profile photo upload.
- Posting capability (simple posts or reels) and a read-only feed endpoint.

The repository intentionally keeps the frontend simple: `index.html` is a single-file UI that calls the backend JSON API under `/api/*`.

**Quick Start**

Prerequisites:
- Node.js (recommended LTS)
- npm (comes with Node.js)
- MongoDB (optional if you use demo mode)

Copy and run these commands in your terminal inside the project folder:

```bash
git clone https://github.com/kyagami955-rgb/RPG.git
cd RPG
npm install
# Create .env from .env.template and customize if needed
copy .env.template .env   # Windows (PowerShell)
# or
cp .env.template .env     # macOS / Linux

# Start the server (production):
npm start

# During development, if you have nodemon installed globally or via dev dependencies:
npm run dev

# Open in browser:
http://localhost:4000
```

Demo mode (no MongoDB required):
1. In `.env`, set `DEMO_MODE=true` (or export `DEMO_MODE=true` in your environment).
2. Start the server. Demo mode provides a mock Google sign-in and avoids persistent DB usage.

**Environment Variables**

Use the provided `.env.template` as a starting point. Important variables:
- `MONGO_URI` — MongoDB connection string used by Mongoose. Defaults to `mongodb://127.0.0.1:27017/kenynamy`.
- `JWT_SECRET` — secret used to sign JWT tokens (keep this private in production).
- `PORT` — port where the server listens (default: `4000`).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CALLBACK_URL` — required for real Google OAuth (not needed in demo mode).
- `DEMO_MODE` — when `true`, the app runs without a DB-backed Google OAuth flow and provides demo endpoints.

**File Structure**

- `server.js` — Application entry point and HTTP server setup.
- `index.html` — Single-file frontend served by the server for the demo UI.
- `package.json` — npm metadata and scripts (`start`, `dev`).
- `routes/` — Express routers:
  - `auth.js` — signup, login, Google OAuth and demo auth endpoints.
  - `users.js` — profile endpoints and photo upload.
  - `posts.js` — fetching and creating posts.
- `models/` — Mongoose models:
  - `User.js` — user schema and fields.
  - `Post.js` — post schema.
- `middleware/auth.js` — JWT authorization middleware used for protected routes.
- `uploads/` — Folder where multer stores uploaded profile photos.
- `.env.template` — example environment variables.
- `.gitignore` — files not committed (e.g., `node_modules`, `.env`).

**File-by-File Explanation**

`server.js`
- Loads environment with `dotenv` and imports necessary modules: `express`, `mongoose`, `cors`, `passport`, and session handling.
- Configures middlewares:
  - `cors()` to allow cross-origin requests (useful while developing a separate frontend).
  - `express.json()` to parse JSON request bodies.
  - `express-session` and `passport.initialize()` / `passport.session()` for OAuth flows that use sessions.
  - Serves static uploads via `app.use('/uploads', express.static(...))`.
- Mounts API routers:
  - `/api/auth` -> `routes/auth.js`
  - `/api/users` -> `routes/users.js`
  - `/api/posts` -> `routes/posts.js`
- Serves `index.html` for any unmatched route (`app.get('*', ...)`) so the SPA can handle client-side navigation.
- Connects to MongoDB via Mongoose using `MONGO_URI`. If `DEMO_MODE` is enabled and the DB is unavailable, the app will still start (it logs the situation).

`routes/auth.js`
- Responsible for user authentication and Google OAuth integration.
- Uses `passport-local` strategy for standard email/username + password login. The strategy checks for a user by email or username, compares hashed passwords with `bcrypt.compare`, and calls `done()`.
- Uses `passport-google-oauth20` for Google sign-ins. Behavior differs by mode:
  - Demo mode (`DEMO_MODE=true`): provides a simple HTML form (`GET /google`) and a demo callback (`POST /google/demo-callback`) that creates an in-memory demo user object and returns a signed JWT token.
  - Production mode: the real Google OAuth flow uses `passport.authenticate('google')` and `GET /google/callback` redirects back to the SPA with `?token=...&user=...` in the URL.
- Provides endpoints:
  - `POST /signup` — creates a new user after hashing the password with `bcrypt.hash` and returns a JWT token valid for 7 days.
  - `POST /login` — authenticates the user and returns a JWT token and basic user info.
  - `POST /check` — checks if an email or username already exists.

Implementation notes:
- JWT tokens are signed with `JWT_SECRET`. The token payload contains the user id as `id` which the `middleware/auth.js` expects when verifying requests.

`routes/users.js`
- Handles profile endpoints and profile-photo uploads.
- Uses `multer` with `diskStorage` so uploaded files land in the `uploads/` folder. Filenames are prefixed with a timestamp for uniqueness.
- Endpoints:
  - `GET /me` — returns data for the authenticated user (requires `Authorization: Bearer <token>` header).
  - `PUT /me` — updates `name` and `bio` on the authenticated user.
  - `POST /me/photo` — accepts `photo` form field, saves the file, updates the `profilePic` for the user, and returns the new photo URL.

`routes/posts.js`
- Public endpoint `GET /` returns a feed of posts sorted by creation date. The route populates user data (`username`, `name`, `profilePic`) via Mongoose `populate()`.
- Protected endpoint `POST /` requires JWT auth and creates a new `Post` document connected to the requesting user, increments the user's `postsCount`, and returns the created post with populated user information.

`middleware/auth.js`
- Looks for an `Authorization` header with a `Bearer <token>` value. If missing or malformed, it returns HTTP 401.
- Verifies the token using `jwt.verify` with `JWT_SECRET`. If valid, it locates the user in the DB (`User.findById`) and attaches it to `req.user` for downstream routes. If verification or lookup fails, returns HTTP 401.

`models/User.js`
- Mongoose schema that stores basic user profile data:
  - `name`, `email`, `username`, `password` (hashed), `googleId` (for OAuth), `bio`, `profilePic`.
  - `followers` and `following` are arrays of `ObjectId` referencing other `User` documents.
  - `postsCount` is an integer counter used for quick counts.

`models/Post.js`
- A minimal schema describing posts:
  - `user` — reference to the author (`User`).
  - `caption` — optional text.
  - `image` — optional path to an uploaded or external image.
  - `likes` — array of `User` ObjectIds.
  - `type` — either `post` or `reel` (enum).

`index.html` (frontend)
- A single-file UI used for demonstration. It provides the login/signup UI, a demo Google sign-in page (when used), and a simple app shell that shows user info and a posts grid.
- The demo Google flow in `index.html` posts to `/api/auth/google/demo-callback` and then navigates to `/?token=...&user=...` where the client-side code can read the token and use it for authenticated API calls.

`package.json` and scripts
- `start`: `node server.js` — runs the server in production mode.
- `dev`: `nodemon server.js` — useful during development to restart on file changes.

**API Endpoints (summary)**

- `POST /api/auth/signup` — register a new user; returns `{ token, user }`.
- `POST /api/auth/login` — login and obtain `{ token, user }`.
- `POST /api/auth/check` — check email/username availability.
- `GET /api/auth/google` — begin Google OAuth (demo or real depending on `DEMO_MODE`).
- `GET /api/posts` — public list of posts.
- `POST /api/posts` — create a post (requires `Authorization: Bearer <token>`).
- `GET /api/users/me` — get current user profile (requires auth).
- `PUT /api/users/me` — update name/bio (requires auth).
- `POST /api/users/me/photo` — upload profile photo (multipart form `photo` field, requires auth).

**Deployment notes**

- This repository contains both a static frontend (`index.html`) and a Node/Express backend. Static hosting (GitHub Pages, Vercel static sites) can serve `index.html`, but API routes and the MongoDB-backed server require a Node runtime.
- Recommended hosts for the full backend: Render, Railway, Heroku, or a VPS. Vercel can run serverless functions, but migrating this Express app to serverless requires refactoring or using Vercel's Node server adapters.

**Security & Best Practices**

- Never commit `.env` with secrets. Keep `.env` in `.gitignore` (already present).
- Use a strong `JWT_SECRET` in production and rotate credentials as needed.
- Validate and sanitize user inputs for real-world production use.

**Contributing & Contact**

If you want this README expanded further (for example, adding line-by-line comments, or converting key server functions into annotated code blocks), tell me which files or functions you want explained in more depth and I will expand them.

Author: kyagami955-rgb
