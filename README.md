# Digital Library Management System

A full-stack Digital Library Management System built with the MVC architectural pattern. Members can search and browse the catalog, borrow books, and view their history. Librarians (admins) manage inventory, authors, and system-wide borrow records through role-based access control.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js |
| **Backend** | Express.js (REST API) |
| **Frontend** | Vanilla HTML, CSS, and JavaScript |
| **Database** | PostgreSQL (via `pg`) |
| **Authentication** | JWT (stored in `localStorage`, sent as `Authorization: Bearer`) |
| **Password Security** | bcrypt hashing |

---

## Architecture

The backend exposes a **JSON REST API** under `/api/*`. The frontend lives in the `views/` folder as static HTML pages that call the API with the native `fetch()` API.

```
Browser (views/*.html + views/js/*.js)
        │
        │  fetch('/api/...')
        ▼
Express Routes → Controllers → Models → PostgreSQL
```

---

## Project Structure

```text
├── app.js                          # Express server, API routes, static file serving
├── database/
│   ├── schema.sql                  # PostgreSQL DDL + seed data
│   └── migrations/
│       └── 001_admin_requests.sql  # Optional migration for existing databases
├── scripts/
│   └── setup-db.js                 # Creates database and applies schema.sql
├── utils/
│   └── pagination.js               # Shared page/limit parsing helpers
├── config/
│   └── db.js                       # PostgreSQL connection pool
├── middleware/
│   └── authMiddleware.js           # JWT verification + RBAC (admin / user)
├── routes/
│   ├── authRoutes.js
│   ├── bookRoutes.js
│   ├── authorRoutes.js
│   └── borrowRoutes.js
├── controllers/
│   ├── authController.js
│   ├── bookController.js
│   ├── authorController.js
│   └── borrowController.js
├── models/
│   ├── userModel.js
│   ├── adminRequestModel.js        # Librarian access approval requests
│   ├── bookModel.js
│   ├── authorModel.js
│   └── borrowModel.js
├── views/                          # Vanilla frontend HTML + page scripts
│   ├── index.html
│   ├── admin/user-requests.html    # Admin approval dashboard
│   ├── js/
│   ├── auth/
│   ├── books/
│   ├── authors/
│   └── borrow/
└── public/                         # Global static assets
    └── css/
        ├── main.css                # Entry point (imports all partials)
        ├── variables.css           # Theme tokens & colors
        ├── base.css                # Reset, typography, links
        ├── layout.css              # Header, nav, grid, tables
        └── components.css          # Buttons, forms, cards, badges, alerts
```

---

## Prerequisites

* **Node.js** v18 or newer
* **PostgreSQL** 14+ (local install or Docker)
* **npm**

---

## Environment Configuration (`.env`)

Create a `.env` file in the project root:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=library_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=strong_secret_for_JWT_signing
SESSION_SECRET=strong_secret_for_express-session
```

> **Note:** PostgreSQL’s default port is `5432`. Adjust `DB_HOST`, `DB_USER`, and `DB_PASSWORD` to match your local or remote PostgreSQL instance.

---

## Installation & Setup

```bash
# Install dependencies
npm install

# Create database, tables, seed sample data, and super admin account
npm run setup-db

# Start the server
npm start
```

For development with auto-reload:

```bash
npm run dev
```

---

## Running the Application

| Resource | URL |
|----------|-----|
| **Home (redirect)** | http://localhost:5000/ |
| **Books catalog** | http://localhost:5000/books/index.html |
| **Login** | http://localhost:5000/auth/login.html |
| **Register** | http://localhost:5000/auth/register.html |
| **Admin access requests** | http://localhost:5000/admin/user-requests.html |
| **API base** | http://localhost:5000/api |

### Default Super Admin (created by `npm run setup-db`)

| Email | Password |
|-------|----------|
| `admin@library.com` | `admin123` |

Use this account to approve or decline librarian access requests from new users.

---

## Database Setup

The PostgreSQL schema is defined in `database/schema.sql`. It creates:

* `users` — accounts with `admin` or `user` roles
* `admin_requests` — pending/approved/rejected librarian access requests
* `authors` — author profiles
* `books` — catalog items linked to authors
* `borrow_records` — checkout and return history

Apply it automatically (creates the database if needed, runs schema, seeds super admin):

```bash
npm run setup-db
```

Or manually with `psql`:

```bash
# Create the database first (if it does not exist)
createdb library_db

# Apply schema and seed data
psql -h 127.0.0.1 -p 5432 -U postgres -d library_db -f database/schema.sql
```

> **Data validation:** Book status is constrained to `available`, `borrowed`, or `reserved`. Borrow status is constrained to `borrowed` or `returned`.

**Upgrading an existing database** without wiping data:

```bash
psql -h 127.0.0.1 -p 5432 -U postgres -d library_db -f database/migrations/001_admin_requests.sql
```

---

## Admin Access Approval Workflow

Users cannot self-assign the `admin` role. The flow works like this:

1. **Register** — If a user selects *Librarian (Admin)*, they are created as a normal `user` and an `admin_requests` row is stored as `pending`.
2. **Sign in** — They can use member features immediately. The UI shows that admin access is still awaiting approval.
3. **Review** — An existing admin opens **Access Requests** and approves or declines each request.
4. **Approve** — The user's role is promoted to `admin` inside a database transaction. They must sign in again to receive an updated JWT.
5. **Decline** — The user stays a member; the UI explains that the request was rejected.

Admins cannot approve their own requests.

---

## REST API Endpoints

All API routes are prefixed with `/api`. Protected routes require a valid JWT in the `Authorization: Bearer <token>` header.

### Pagination

List endpoints accept `?page=` and `?limit=` query parameters. Responses include a `pagination` object with `page`, `limit`, `total`, `totalPages`, `hasPrev`, `hasNext`, `from`, and `to`.

Default page sizes: **6** for books and authors, **10** for borrow records and admin requests.

Paginated routes: `/api/books`, `/api/books/admin-dashboard`, `/api/authors`, `/api/borrow/history`, `/api/borrow/all-records`, `/api/auth/admin-requests`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (`role: admin` creates a pending approval request) |
| POST | `/api/auth/login` | Login — returns JWT, user object, and admin-request status if applicable |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user + latest admin request (auth required) |
| POST | `/api/auth/request-admin` | Submit librarian access request (auth required) |
| GET | `/api/auth/admin-requests` | List pending requests (admin) |
| POST | `/api/auth/admin-requests/:id/approve` | Approve request and promote user (admin) |
| POST | `/api/auth/admin-requests/:id/reject` | Decline request (admin) |

### Books

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | List catalog (supports `?search=` and `?status=`) |
| GET | `/api/books/admin-dashboard` | Admin inventory view (admin) |
| GET | `/api/books/create` | Author list for create form (admin) |
| POST | `/api/books/create` | Create a book (admin) |
| GET | `/api/books/edit/:id` | Book + authors for edit form (admin) |
| POST | `/api/books/edit/:id` | Update a book (admin) |
| POST | `/api/books/delete/:id` | Delete a book (admin) |

### Authors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/authors` | List all authors (auth required) |
| POST | `/api/authors/create` | Create author (admin) |
| GET | `/api/authors/edit/:id` | Get author for edit form (admin) |
| POST | `/api/authors/edit/:id` | Update author (admin) |
| POST | `/api/authors/delete/:id` | Delete author (admin) |

### Borrowing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/borrow/borrow` | Check out a book (auth required) |
| GET | `/api/borrow/history` | User borrow history (auth required) |
| GET | `/api/borrow/all-records` | All borrow records (admin) |
| POST | `/api/borrow/return/:id` | Return a book (auth required) |

---

## Frontend Pages

Static HTML pages in `views/` are served by Express. Each page loads the global stylesheet and its own JavaScript module.

| Resource | Path |
|----------|------|
| **Global CSS** | `/css/main.css` |
| Books catalog | `/books/index.html` |
| Admin dashboard | `/books/admin-dashboard.html` |
| Add / edit book | `/books/create.html`, `/books/edit.html?id=` |
| Authors list | `/authors/index.html` |
| Add / edit author | `/authors/create.html`, `/authors/edit.html?id=` |
| My borrows | `/borrow/history.html` |
| Admin audit logs | `/borrow/admin-records.html` |
| Admin access requests | `/admin/user-requests.html` |

Shared client logic (`views/js/app.js`):

* Stores JWT in `localStorage`
* Attaches `Authorization` header to API requests
* Renders navigation based on login state and role
* Shows toast notifications (top-right popups) for success, error, info, and warning feedback
* Uses confirmation modals instead of browser `alert()` / `confirm()` dialogs
* Redirects unauthenticated or unauthorized users with flash messages
* Displays loading state on form submissions

---

## Security Summary

* **RBAC:** Middleware enforces `admin` vs `user` roles on protected routes.
* **Admin approval:** Librarian privileges require an existing admin to approve the request.
* **Password hashing:** bcrypt with salt rounds before any database write.
* **JWT sessions:** Tokens expire after 1 day; invalid/expired tokens return `401`.
* **Transactional promotions:** User role updates and request status changes happen in a single DB transaction on approval.
* **API separation:** Backend returns JSON only; frontend is decoupled from server rendering.

---

## UX & Features

* **Design system:** Modern Slate + Indigo palette in `public/css/` (loaded globally via `/css/main.css`).
* **Clear feedback:** Toast popups, confirmation modals, form validation, and loading indicators on buttons.
* **Status badges:** Semantic colors for `available`, `borrowed`, and `reserved` states.
* **Pagination:** Server-side paging on all list views with Previous/Next controls and “Showing X–Y of Z” summary.
* **Search:** Catalog search via URL query parameters (`?search=...`), resets to page 1.
* **Seed data:** Sample authors and books included in `schema.sql`.

---

## Course & Student Information

* **Institution/Course:** Web Programming II
* **Student:** Yeabkal Wondwosen — ID: 163/BSC-B6/2023

