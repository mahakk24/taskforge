# ⚡ TaskForge — Team Task Manager

> A full-stack team task management system with role-based access control, Kanban board view, and real-time project dashboards.

![TaskForge Screenshot](![alt text](image.png))

## 🔗 Links
- **Live App**: [your-app.up.railway.app](https://your-app.up.railway.app)
- **API Docs**: [your-api.up.railway.app/docs](https://your-api.up.railway.app/docs)
- **GitHub**: this repo

---

## 🚀 Features

### Authentication
- JWT-based signup & login
- Passwords hashed with bcrypt
- Role selection at registration (Admin / Member)

### Projects
- Create & manage projects with custom colors
- Invite teammates via email
- Per-project role assignment
- Archive projects when complete

### Tasks (Kanban Board)
- Visual Kanban: **To Do → In Progress → Review → Done**
- Priority levels: Low / Medium / High / Critical
- Due dates with overdue highlighting
- Inline status updates directly on the board
- Task assignment to team members

### Dashboard
- Live stats: total, completed, in-progress, overdue tasks
- Quick project overview cards
- Personalized greeting

### Role-Based Access Control
| Feature | Member | Admin |
|---------|--------|-------|
| View own projects | ✅ | ✅ |
| Create projects | ✅ | ✅ |
| Add members | ❌ | ✅ |
| View all projects | ❌ | ✅ |
| View all users | ❌ | ✅ |

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — async Python API framework
- **PostgreSQL** — relational database with proper foreign keys
- **SQLAlchemy 2.0** — ORM with relationship validation
- **JWT (python-jose)** — stateless authentication
- **bcrypt (passlib)** — password hashing
- **Pydantic v2** — strict request/response validation

### Frontend
- **React 18** — component-based UI
- **Vite** — fast build tooling
- **Zero external UI libraries** — all components hand-crafted
- **DM Sans + Space Mono** — typography pairing

### Infrastructure
- **Railway** — deployment platform
- **PostgreSQL** — Railway managed database

---

## 📦 Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:password@localhost:5432/taskforge"
export SECRET_KEY="your-secret-key"
uvicorn main:app --reload
```
API available at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

### Frontend Setup
```bash
cd frontend
npm install
# Create .env.local:
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```
App available at `http://localhost:5173`

---

## 🚂 Railway Deployment

### Step 1: Create Railway Account
Go to [railway.app](https://railway.app) and sign in with GitHub.

### Step 2: Deploy Backend
1. New Project → Deploy from GitHub Repo → select this repo
2. Set **Root Directory**: `backend`
3. Add environment variables:
   ```
   SECRET_KEY=<generate a random 64-char string>
   ```
4. Add a **PostgreSQL** plugin from Railway dashboard
5. Railway auto-sets `DATABASE_URL`

### Step 3: Deploy Frontend
1. New Service → GitHub → same repo
2. Set **Root Directory**: `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=<your backend railway URL>
   ```

### Step 4: Verify
- Visit your frontend URL
- Create an Admin account
- Create a project, add tasks — it's live!

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Current user info |
| GET | `/api/projects` | ✅ | List my projects |
| POST | `/api/projects` | ✅ | Create project |
| POST | `/api/projects/{id}/members` | ✅ Admin | Add member |
| GET | `/api/projects/{id}/tasks` | ✅ | Project tasks |
| POST | `/api/tasks/project/{id}` | ✅ | Create task |
| PATCH | `/api/tasks/{id}` | ✅ | Update task |
| DELETE | `/api/tasks/{id}` | ✅ | Delete task |
| GET | `/api/tasks/dashboard/stats` | ✅ | Dashboard stats |
| GET | `/api/users` | ✅ | List all users |

Full interactive docs: `/docs` (Swagger UI) or `/redoc`

---

## 🗄️ Database Schema

```
users
  id, name, email, password_hash, role, avatar_color, is_active, created_at

projects
  id, name, description, owner_id → users.id, color, is_archived, created_at

project_members
  id, project_id → projects.id, user_id → users.id, role, joined_at

tasks
  id, title, description, project_id → projects.id,
  assignee_id → users.id, creator_id → users.id,
  status, priority, due_date, created_at, updated_at
```

---

## 👩‍💻 Author
Built with FastAPI + React by Mahak | [GitHub](https://github.com/mahakk24)
