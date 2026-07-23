# Neighborly - Full Stack Community Platform

Neighborly is a community-driven web application designed to help neighbors connect locally to lend/borrow items (e.g., tools, outdoors equipment, electronics) and share or teach skills.

---

## 📁 Repository Structure

The project is organized into two standalone subdirectories separating the frontend React client and backend FastAPI server:

### 1. [frontend/](file:///d:/AI_Projects/project/frontend) (User Interface)
Contains the user interface built with **React** and bundled using **Vite**.
- **`src/`**: React components, pages (Dashboard, Browse catalog, Messaging portal), state context providers, and axios API setup.
- **`public/`**: Static logo and icon vectors used inside the user interface.
- **`vite.config.js` & `package.json`**: Build and dependency configurations for the React application.
- **`index.css`**: Core design system and Vanilla CSS styling rules.

### 2. [backend/](file:///d:/AI_Projects/project/backend) (Server API)
Contains the Python server application built with **FastAPI** to manage database access, business logic, and API requests.
- **`app/`**: Backend routing logic, schemas, SQLAlchemy models, and unit tests.
- **`alembic/` & `alembic.ini`**: Database migration environment configuration used to track and apply database schema changes.
- **`uploads/`**: Directory where user-submitted listing images are saved and served statically.
- **`.env` & `requirements.txt`**: Environment variables (secrets/database links) and Python package dependency declarations.

---

## 🌐 Deployed Application URLs

- **Frontend Client (Vercel)**: [https://neighborly-alpha.vercel.app/](https://neighborly-alpha.vercel.app/)
- **Backend API Server (Render)**: [https://neighborly-1-2tm5.onrender.com/](https://neighborly-1-2tm5.onrender.com/)
- **Interactive Swagger Docs**: [https://neighborly-1-2tm5.onrender.com/docs](https://neighborly-1-2tm5.onrender.com/docs)

---

## 🚀 How to Run Locally

### 1. Run Backend Server
Ensure your environment configurations inside `backend/.env` are set correctly (e.g., your Aiven MySQL database connection string).
```powershell
cd backend

# Activate isolated Python environment
venv\Scripts\activate

# Start the FastAPI server using Uvicorn
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Local API Endpoint**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Local Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Run Frontend Client
Ensure the backend server is running so the frontend can retrieve data.
```powershell
cd frontend

# Boot up Vite development server
npm run dev
```
- **Local Client**: [http://localhost:5173/](http://localhost:5173/)
- **API Target**: Points to the local API endpoint (`http://localhost:8000`) or defined production URL fallback.
