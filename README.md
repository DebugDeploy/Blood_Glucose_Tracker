# Sweety — Blood Glucose Tracker

A blood glucose tracking web application built with React, Express, and PostgreSQL. Users can record up to four glucose readings per day and view comprehensive daily and monthly reports.

> **⚠️ First Time Setup?** See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed step-by-step instructions!

## Requirements

- **Node.js** 20 or later and npm
- **PostgreSQL** 14 or later

## Installation and Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` in the repository root and configure:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - A long, random secret (use a password generator)
- Other variables are optional with sensible defaults

### 3. Create Database
Create a PostgreSQL database (default name: `sweety`):
```bash
createdb sweety
```

Or using PostgreSQL client:
```sql
CREATE DATABASE sweety;
```

### 4. Initialize Database Tables
```bash
npm run db:init -w server
```

This creates the `users` and `readings` tables with proper constraints.

### 5. Seed Demo Data
```bash
npm run seed -w server
```

Creates a demo user with sample readings for the last 7 days:
- **Email:** `demo@example.com`
- **Password:** `Password123!`

You can customize the demo account by setting `SEED_USER_NAME`, `SEED_USER_EMAIL`, and `SEED_USER_PASSWORD` in `.env`.

## How to Run

### Start Both Server and Client (Development)
```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

### Run Server Only
```bash
npm run dev -w server
```
Server runs on http://localhost:4000

### Run Client Only
```bash
npm run dev -w client
```
Client runs on http://localhost:5173

### Build for Production
```bash
npm run build
```

## How to Run Tests

```bash
npm test
```

This runs the validation test suite that verifies all reading validation rules.

## Features Implemented

### Required Features ✅

#### 1. Authentication
- User registration with name, email, and password
- Login with JWT token-based authentication
- Passwords hashed with bcrypt (12 rounds)
- Users can only see their own readings

#### 2. CRUD Operations for Readings
Each reading contains:
- Date (calendar date)
- Time slot: Morning (fasting), After breakfast, After lunch, After dinner
- Glucose value (mg/dl)

Operations:
- **Add** new reading
- **View** all readings (paginated)
- **Edit** existing reading
- **Delete** reading

#### 3. Validation Rules
All validation rules are implemented with clear error messages:

| Rule | Error Message |
|------|---------------|
| Value is required | "Please enter a glucose value." |
| Value must be whole number 40-600 | "Value must be between 40 and 600 mg/dl." |
| Only one reading per slot per day | "You already have an [slot] reading for this date." |
| Maximum 4 readings per day | "You can add only 4 readings per day." |
| Date cannot be in future | "Date cannot be in the future." |

#### 4. Reports
Three report types with highest, lowest, average (1 decimal), and count:

- **Daily Report:** Selected date with list of all readings and slots
- **Month-to-date Report:** 1st of month to selected date
- **Monthly Report:** Full previous month

Empty reports show friendly empty states.

### Bonus Features Implemented ✅

- **Pagination:** `GET /api/readings?page=1&limit=20`
- **Charts:** Monthly line chart showing daily average glucose readings

## API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and receive JWT token

### Readings (Requires Authentication)
- `GET /api/readings?page=1&limit=20` - List readings (paginated)
- `POST /api/readings` - Create reading
- `PUT /api/readings/:id` - Update reading
- `DELETE /api/readings/:id` - Delete reading

### Reports (Requires Authentication)
- `GET /api/reports?date=YYYY-MM-DD` - Get daily, month-to-date, and monthly reports

### Health Check
- `GET /api/health` - Server health status

**Authentication:** Protected routes require `Authorization: Bearer <token>` header.

## Project Structure

```
sweety/
├── client/               # React frontend
│   ├── src/
│   │   ├── App.jsx      # Main application component
│   │   ├── main.jsx     # React entry point
│   │   └── styles.css   # Application styles
│   └── package.json
├── server/              # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   ├── init.js      # Database initialization script
│   │   │   ├── pool.js      # PostgreSQL connection pool
│   │   │   ├── seed.js      # Demo data seeding script
│   │   │   └── store.js     # Database operations
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js      # Authentication routes
│   │   │   ├── readings.js  # Reading CRUD routes
│   │   │   └── reports.js   # Report generation routes
│   │   ├── index.js         # Express server entry point
│   │   ├── validation.js    # Validation logic
│   │   └── validation.test.js # Validation tests
│   └── package.json
├── .env.example         # Environment variable template
├── .gitignore
├── package.json         # Root workspace config
└── README.md
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Readings Table
```sql
CREATE TABLE readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner')),
  value INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, reading_date, slot)
);
```

## Notes

### Assumptions & Design Decisions
- Dates are local calendar dates; both client and server validate future dates using their local date
- The unique constraint on `(user_id, reading_date, slot)` enforces one reading per slot per day at the database level
- Advisory locks prevent race conditions when enforcing the 4-readings-per-day limit
- Validation happens both client-side (immediate feedback) and server-side (security)
- The seed script can be rerun safely; it skips duplicate readings

### What I Would Improve With More Time
- API integration tests against a test PostgreSQL database
- Frontend tests with React Testing Library for the reading form
- Docker Compose setup for PostgreSQL and the application
- Screen recording walkthrough (2-3 minutes) showing all features
- Input accessibility improvements (ARIA labels, keyboard navigation)
- Data export feature (CSV/PDF reports)
- Email notifications for missed readings
