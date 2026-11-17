# Phase 3 – AI Code Review

## 1. Install
```bash
cd server
npm install @google/genai
npm uninstall @google/generative-ai   # deprecated SDK, replaced by @google/genai

cd ../client
npm install @monaco-editor/react
```

## 2. Update server/.env
```
GEMINI_MODEL=gemini-2.5-flash
```
gemini-1.5-flash is no longer available to new Google projects. If you get a
404 "model not found", open Google AI Studio and use a model name it lists.

## 3. Copy files
Copy `server/` and `client/src/` over your project. Replaced files:
server.js, middleware/errorHandler.js, client/src/routes/AppRoutes.jsx.
Add the `.bug-line` CSS from `client/src/index.css.snippet` to index.css.
You can delete client/src/pages/StudentDashboard.jsx (no longer used).

## 4. Test
1. Log in as student@crbuddy.com
2. New review: paste `for (let i = 0; i <= arr.length; i++) { total += arr[i]; }`
3. Submit the exact same code again: the second result comes back instantly
   (fromCache: true) with no AI call.
4. Fire 11 reviews in a minute: the 11th returns 429.
