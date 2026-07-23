# Neighborly - Full Stack Community Platform

This project is organized into two standalone subdirectories separating the frontend React app and backend FastAPI server:

## 📁 Repository Structure
- **[frontend/](file:///d:/AI_Projects/project/frontend)**: React application powered by Vite, styling config, and UI dependencies.
- **[backend/](file:///d:/AI_Projects/project/backend)**: FastAPI application, Alembic database migrations, and Python dependencies.

---

## 🚀 How to Run the Application

### 1. Run Backend Server
```powershell
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Local API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Run Frontend client
```powershell
cd frontend
npm run dev
```
- **Local Application**: [http://localhost:5173/](http://localhost:5173/)
