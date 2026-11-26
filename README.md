
# Code Review Buddy 🤖

**An AI-Powered Code Review and Learning Platform for Programming Students**

Built with the MERN stack (MongoDB, Express, React, Node.js) and Google Gemini AI.

---

## 🚀 Features

- **AI Code Review** – Submit code and receive detailed analysis powered by Gemini AI
- **Bug Detection** – Identify bugs with hints and guided solutions
- **Weak Topic Tracking** – Automatically detect recurring programming weaknesses
- **Personalized Roadmap** – AI-generated learning plans based on weaknesses
- **Practice Quizzes** – AI-generated MCQ quizzes on weak topics
- **Progress Analytics** – Charts and dashboards tracking improvement
- **Teacher Dashboard** – Monitor student performance and analytics
- **Role-Based Auth** – Separate flows for students and teachers

---

## 🛠️ Technology Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- React Router DOM
- Axios
- Monaco Editor
- Recharts
- Lucide React Icons

### Backend
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- JWT Authentication
- bcryptjs
- Zod Validation
- Helmet, CORS, express-rate-limit

### AI
- Google Gemini API (`@google/generative-ai`)

---

## 📁 Project Structure

```
code-review-buddy/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route-level page components
│   │   ├── layouts/          # Layout wrappers
│   │   ├── context/          # React Context (Auth, Theme)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # Axios API service functions
│   │   ├── routes/           # Route definitions
│   │   ├── utils/            # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── server/                   # Express backend
│   ├── config/               # DB connection
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Auth, error handling
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routers
│   ├── services/             # AI service (Gemini)
│   ├── utils/                # Helpers (hash, etc.)
│   ├── validators/           # Zod schemas
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/code-review-buddy
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🏃 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Google Gemini API key (from [Google AI Studio](https://aistudio.google.com))

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/code-review-buddy.git
cd code-review-buddy
```

### 2. Setup Backend
```bash
cd server
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### 3. Setup Frontend
```bash
cd client
npm install
cp .env.example .env
# Fill in VITE_API_URL
npm run dev
```

### 4. Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

---

## 🔑 Default Accounts (Development)

After running the seed script:
- **Teacher**: teacher@crbuddy.com / Teacher@123
- **Student**: student@crbuddy.com / Student@123

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new student |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/reviews` | Submit code for review |
| GET | `/api/reviews` | Get user's review history |
| GET | `/api/reviews/:id` | Get single review |
| DELETE | `/api/reviews/:id` | Delete review |
| GET | `/api/progress` | Get topic progress |
| POST | `/api/quizzes/generate` | Generate quiz |
| POST | `/api/quizzes/:id/submit` | Submit quiz answers |
| POST | `/api/roadmap/generate` | Generate learning roadmap |
| PATCH | `/api/roadmap/steps/:id` | Mark roadmap step complete |
| GET | `/api/teacher/students` | List students (teacher only) |
| GET | `/api/teacher/students/:id/progress` | Student progress (teacher only) |

---

## 🚀 Deployment

- **Frontend** → [Vercel](https://vercel.com)
- **Backend** → [Render](https://render.com)
- **Database** → [MongoDB Atlas](https://www.mongodb.com/atlas)

### Render (Backend)
1. Connect your GitHub repo
2. Set `Build Command`: `npm install`
3. Set `Start Command`: `node server.js`
4. Add all environment variables from `server/.env`

### Vercel (Frontend)
1. Connect your GitHub repo, select `client/` as root directory
2. Add `VITE_API_URL` pointing to your Render backend URL

---

## 🔒 Security

- Passwords hashed with bcryptjs (salt rounds: 12)
- JWT tokens with expiry
- Rate limiting: 100 req/15min globally, 10 req/min on AI endpoints
- Helmet security headers
- CORS restricted to frontend URL
- Zod schema validation on all inputs
- SHA-256 caching to deduplicate AI calls
- Student code treated as untrusted — never executed on server

---

## 📄 License

MIT License — feel free to use for learning and projects.
=======
# codebuddy
