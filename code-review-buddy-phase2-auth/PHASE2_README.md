# Phase 2 – Authentication

## 1. Install packages
```bash
cd server
npm install express mongoose dotenv cors helmet express-rate-limit bcryptjs jsonwebtoken zod
npm install -D nodemon
```
Add to `server/package.json` scripts:
```json
"dev": "nodemon server.js",
"start": "node server.js",
"seed": "node seed.js"
```
Client (if not already installed):
```bash
cd client
npm install axios react-router-dom
```

## 2. Copy files
Copy the `server/` and `client/src/` folders over your project. This replaces
`server/server.js`, `client/src/App.jsx` and `client/src/main.jsx`.
Create `server/.env` and `client/.env` from the `.env.example` files.
Add the font `@import` from `client/src/index.css.snippet` to your `index.css`.

## 3. Run
```bash
cd server && npm run seed && npm run dev
cd client && npm run dev
```

## 4. Test
- http://localhost:5173/register creates a student
- teacher@crbuddy.com / Teacher@123 lands on /teacher
- student@crbuddy.com / Student@123 lands on /dashboard
- GET /api/auth/me with no token returns 401

## Note
The server code uses CommonJS (`require`). If Phase 1 used ES modules
("type": "module"), switch the imports/exports to `import`/`export`.
