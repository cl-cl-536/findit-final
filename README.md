# FindIt – Cloud-Based Campus Lost and Found Item Management System

A full-stack, cloud-ready Lost and Found web application designed for university campuses. Built with **Python Flask**, **SQLite / SQLAlchemy**, and modern responsive **HTML5/CSS3**.

Developed as a **College Cloud Computing Mini-Project**.

---

## 📌 Project Overview

**FindIt** solves the problem of scattered, unorganized lost property across college campus departments, classrooms, and libraries:

- **Students & Staff:** Register an account, submit lost/found reports with photos and locations, browse catalog items with live search, and track statuses from their personal dashboard.
- **Campus Community:** Easily locate missing belongings, view high-resolution photographs and locations, and contact reporters or campus security directly.
- **Administrators:** Oversee campus reports, change item statuses (**Active**, **Pending**, **Returned**), and remove duplicate or inappropriate entries.

---

## 🛠️ Technology Stack

- **Backend:** Python, Flask 3.x
- **Database:** SQLite (local development) with Flask-SQLAlchemy ORM *(prepared for AWS RDS PostgreSQL/MySQL)*
- **Security:** Werkzeug password hashing (`generate_password_hash`, `check_password_hash`), secure Flask session cookies, input validation, and role-based access decorators (`@login_required`, `@admin_required`)
- **File Uploads:** Local file storage in `static/uploads/` with extension validation & unique secure filenames *(prepared for AWS S3 integration)*
- **Frontend:** Semantic HTML5, custom modern CSS3 (Inter & Plus Jakarta Sans typography, navy/blue/amber color system), Jinja2 template rendering

---

## 📂 Project Structure

```text
findit-final/
├── app.py                  # Main Flask application, routes, access control & seeding
├── models.py               # Database models (User & Item tables with SQLAlchemy)
├── requirements.txt        # Python dependency manifest
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules for database, uploads, and secrets
├── README.md               # Complete project documentation and execution guide
│
├── instance/
│   └── findit.db           # SQLite database (auto-created on first run)
│
├── templates/
│   ├── index.html          # Landing page with dynamic metrics, recent items & guide
│   ├── browse.html         # Search & filter directory (Lost/Found, Category, Status)
│   ├── report-lost.html    # Form to submit a lost report with photo upload & preview
│   ├── report-found.html   # Form to submit a found report with photo upload & preview
│   ├── login.html          # Login page with demo credentials quick-fill
│   ├── register.html       # Campus user registration with validation & password hashing
│   ├── dashboard.html      # User dashboard with personal reports & "Mark Returned"
│   ├── item-details.html   # Full item view, reporter card & contact inquiry modal
│   └── admin.html          # Administration console for status updates & report moderation
│
└── static/
    ├── css/
    │   └── style.css       # Unified design system & responsive layout
    ├── images/
    │   ├── logo.svg        # FindIt campus brand logo
    │   ├── hero-illustration.svg # Belongings vector graphic
    │   └── *.svg           # 8 realistic sample item fallback illustrations
    ├── js/
    │   └── *.js            # Client-side helper scripts
    └── uploads/            # Uploaded photographs storage directory
```

---

## 🚀 How to Install and Run Locally

### 1. Prerequisites
- **Python 3.10+** installed on your system.

### 2. Install Dependencies
Open your terminal in the `findit-final` project directory and run:

```powershell
pip install -r requirements.txt
```

### 3. (Optional) Configure Environment Variables
You can copy `.env.example` to `.env` if you wish to customize ports or credentials:

```powershell
Copy-Item .env.example .env
```

### 4. Run the Flask Server
Execute:

```powershell
python app.py
```

The database (`instance/findit.db`) and realistic sample records are automatically initialized on startup!

### 5. Access the Web Application
Open your browser and navigate to:
```text
http://127.0.0.1:5000
```
*(or `http://localhost:5000`)*

---

## 🔑 Demo Credentials (Faculty Evaluation)

The database is pre-seeded with realistic items and accounts for immediate evaluation:

| Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campus.edu` | `student123` | File lost/found reports, user dashboard, mark belongings returned |
| **Administrator** | `admin@campus.edu` | `admin123` | Full admin console, status management (Active/Returned/Pending), report deletion |

*Tip: On the **Login** page, click either the `student@campus.edu` or `admin@campus.edu` pill buttons to auto-fill the credentials.*

---

## 🧪 Testing Checklist

- [x] **Registration:** Visit `/register`, submit a new user, verify password hashing and automatic session login.
- [x] **Authentication:** Visit `/login`, test valid/invalid credentials, test `/logout`.
- [x] **Protected Routes:** Attempting to visit `/dashboard` or `/report-lost` while logged out safely redirects to `/login`.
- [x] **Report Lost Item:** Fill the form at `/report-lost`, choose an image, and submit. The report is saved to SQLite with initial status **Active** and redirects to its detail view.
- [x] **Report Found Item:** Submit a report at `/report-found` with location and custodian details.
- [x] **Image Uploads:** Uploaded images are safely stored in `static/uploads/` and render seamlessly across item cards and details.
- [x] **Browse Directory:** Visit `/browse` and test live searching by item name or location, plus filtering by **Lost / Found**, **Category**, and **Status**.
- [x] **User Dashboard:** Log in as a student to view only your submitted reports and click **"Mark Returned"** to resolve a case.
- [x] **Admin Moderation:** Log in as `admin@campus.edu`, navigate to `/admin`, change an item's status via the interactive dropdown, or delete inappropriate reports.
- [x] **Admin Protection:** Students are blocked from accessing `/admin` with a clear access denied notification.

---

## ☁️ AWS Cloud Deployment Roadmap (Future Phase)

The codebase has been structured for cloud deployment across AWS services:

1. **Amazon EC2:** Host the Python Flask application using Gunicorn and Nginx reverse proxy.
2. **Amazon RDS (PostgreSQL/MySQL):** Replace local SQLite by updating the `DATABASE_URL` environment variable.
3. **Amazon S3:** Store uploaded item photographs in an S3 bucket instead of local `static/uploads/`.
4. **Amazon VPC:** Isolate database subnets and application servers securely.
5. **Amazon CloudWatch:** Monitor application health, request latencies, and server logs.
