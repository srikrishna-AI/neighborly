# 🚀 Production Deployment Guide: Neighborly

This guide outlines a step-by-step procedure to deploy the **Neighborly** application to a production environment. We will cover:
1. **Database Deployment** (e.g., Managed MySQL)
2. **Backend API Deployment** (e.g., FastAPI on a Cloud VPS / Ubuntu Server or Render)
3. **Frontend Client Deployment** (e.g., React on Vercel, Netlify, or Static Hosting)

---

## 💾 Step 1: Database Deployment (MySQL)

You need a persistent MySQL database. You can use a managed service like **Aiven**, **PlanetScale**, **DigitalOcean Databases**, or install MySQL directly on your Virtual Private Server (VPS).

1. Create a MySQL database instance.
2. Obtain the database URI connection string. It will look like this:
   ```env
   mysql+pymysql://db_user:db_password@db_host:3306/neighborly
   ```
3. Save this connection string safely; you will feed it as an environment variable to your backend.

---

## 🐍 Step 2: Backend API Deployment (FastAPI)

Below are two main paths for deploying the FastAPI backend.

### Option A: Serverless hosting (Render / Railway) — *Easiest*

1. Create a new account on **Render** (or Railway).
2. Click **New +** > **Web Service**.
3. Link your GitHub repository.
4. Set the following build and start configurations:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. In the **Environment variables** section, add:
   - `DATABASE_URL`: `mysql+pymysql://db_user:db_password@db_host:3306/neighborly`
   - `JWT_SECRET_KEY`: *(Generate a secure random string)*
6. Click **Deploy Web Service**.

---

### Option B: Cloud Virtual Private Server (Ubuntu / Debian) — *Recommended for VPS*

If you are using a VPS (DigitalOcean, AWS EC2, Linode):

1. **Access Server**: SSH into your server:
   ```bash
   ssh ubuntu@your-server-ip
   ```

2. **Install System Dependencies**:
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv git nginx -y
   ```

3. **Clone & Set Up Application**:
   ```bash
   git clone https://github.com/your-username/neighborly.git /var/www/neighborly
   cd /var/www/neighborly
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Create a `.env` file in `/var/www/neighborly`:
   ```env
   DATABASE_URL=mysql+pymysql://db_user:db_password@your-db-host:3306/neighborly
   JWT_SECRET_KEY=your_secure_random_key_here
   ```

5. **Run Migrations**:
   ```bash
   alembic upgrade head
   ```

6. **Set up Systemd Service**:
   Create a systemd service file to keep the backend running in the background:
   ```bash
   sudo nano /etc/systemd/system/neighborly-backend.service
   ```
   Paste the following:
   ```ini
   [Unit]
   Description=Gunicorn instance to serve Neighborly API
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/var/www/neighborly
   ExecStart=/var/www/neighborly/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start neighborly-backend
   sudo systemctl enable neighborly-backend
   ```

7. **Set up Nginx Reverse Proxy**:
   Create an Nginx configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/neighborly-api
   ```
   Paste the following configuration:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Activate the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/neighborly-api /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

---

## ⚛️ Step 3: Frontend Client Deployment (React / Vite)

### 1. Update API Endpoint URL
Before deploying, make sure your React client points to your production API server. 
Edit `src/api/axios.js` (or set environment variables) to point to your deployed backend URL:
```javascript
const instance = axios.create({
  baseURL: 'https://api.yourdomain.com' // Your production backend domain
});
```

### 2. Deploying to Vercel (Easiest & Free)
1. Create a **Vercel** account and install the Vercel CLI (or link via GitHub).
2. Run the following command in the project root:
   ```bash
   vercel
   ```
3. Follow the CLI prompt:
   - Link project: `Yes`
   - Framework: `Vite`
   - Output directory: `dist`
4. Deploy to production:
   ```bash
   vercel --prod
   ```

### 3. Deploying to Netlify
1. Create a **Netlify** account.
2. Link your GitHub repo.
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **Deploy site**.

---

## 🔒 Step 4: Configure SSL (HTTPS)
For both backend and frontend, secure the connection with an SSL certificate:
- On **Render/Vercel/Netlify**, SSL is generated automatically for free.
- On a **Cloud VPS**, use **Certbot** to install a free Let's Encrypt certificate:
  ```bash
  sudo apt install certbot python3-certbot-nginx -y
  sudo certbot --nginx -d api.yourdomain.com
  ```
