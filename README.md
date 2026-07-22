# 🤝 Neighborly

> A modern community sharing platform designed to connect neighbors for sharing household items, tools, outdoor equipment, and skills. Save money, reduce waste, and build a stronger local community.

---

## ✨ Features

### 📦 Dynamic Item-Level Quantity & Booking
* **Date-Based Availability**: Bookings are validated against overlapping dates.
- **Smart Stock Deductions**: If you list $N$ units of an item, $N$ different neighbors can borrow it simultaneously during overlapping intervals before the system shows it as **"Currently Fully Booked"**.
* **Automatic Restoration**: Items automatically return to the available inventory pool the moment the booking date expires.

### ⚙️ Sleek Advanced Search & Filters
- **Inline Filter Drawer**: Easily filter listings by **Location (📍)**, **Condition (✨)** (*Like New*, *Good*, *Fair*), and **Max Daily Price (💰)** in a single clean row.
- **One-Click Category Navigation**: Filter the entire catalog instantly using interactive category pill tags.

### 📊 Community Stats & Savings Dashboard
* **Estimated Savings**: Automatically calculates how much money the community has saved by borrowing instead of buying!
- **Lending Analytics**: Display total shares, completed borrows, active listings, and bookmarks count at a glance.

### 💖 Bookmarks & Favorites
- Save items or skills you are interested in with a single click.
- Access all bookmarked items instantly under a dedicated **Saved Favorites** tab in the dashboard.

### 🌟 Trust & Review System
- Build community trust by rating and reviewing borrows after completion.
- View average ratings and feedback on listing detail cards and neighbor profiles.

---

## 🛠️ Tech Stack

### Backend
* **FastAPI** — High-performance, production-ready Python API framework.
* **SQLAlchemy** & **Alembic** — Object Relational Mapper with robust database migrations.
* **MySQL** — Relational database for transaction safety and listing tracking.
* **Bcrypt** — Secure cryptography and password hashing.

### Frontend
* **React** (via **Vite**) — Modern component-driven frontend architecture.
* **Vanilla CSS** — Bespoke styling featuring smooth transitions and custom dark-theme variables.
* **Context API** — Lightweight client state management for Auth, Toasts, and Bookmarks.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL Server running locally

---

### 1. Backend Setup & Run

1. Navigate to the project root directory:
   ```bash
   cd project
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the MySQL Database connection string. (Set up your local credentials or use default connection parameters in `app/core/database.py`):
   ```python
   # Connection string template
   SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:root@localhost:3306/neighborly"
   ```

5. Run database migrations to construct the database schema:
   ```bash
   alembic upgrade head
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000) and Swagger docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

---

### 2. Frontend Setup & Run

1. Ensure you are in the project root directory, then install frontend dependencies:
   ```bash
   npm install
   ```

2. Start the Vite React client:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:5173/](http://localhost:5173/) to launch the web application.*

---

## 🧪 Running Tests
Run backend tests to verify database, quantity checks, and authentication logic:
```bash
pytest -o pythonpath=.
```

---

## 📂 Project Architecture

```
├── app/                  # FastAPI Application Code
│   ├── core/             # DB settings, security configurations
│   ├── models/           # SQLAlchemy DB schema models
│   ├── schemas/          # Pydantic schemas for request/response validation
│   ├── routers/          # API endpoint routes (listings, requests, users, etc.)
│   └── tests/            # Pytest test cases
├── src/                  # React Client Code
│   ├── components/       # Shared UI elements (Navbar, Cards, Skeletons)
│   ├── context/          # State providers (AuthContext, ToastContext)
│   ├── pages/            # View pages (Browse, Dashboard, Details)
│   └── index.css         # Custom global styling rules
└── alembic/              # Database migration tracking folder
```
