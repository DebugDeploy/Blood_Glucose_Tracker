# Sweety — Blood Glucose Tracker

A small React and Node.js app for recording blood glucose readings in PostgreSQL. Each user can save readings for four daily time slots, review past readings, and see daily and monthly summaries.

## Requirements

- Node.js 18 or newer and npm
- PostgreSQL running on your computer

## Install

From the project folder, install the dependencies and create your local environment file:

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` and replace `YOUR_POSTGRES_PASSWORD` with the password for your local PostgreSQL user. Replace the example `JWT_SECRET` with a long, random value. Do not commit `.env`; it is ignored by Git.

## Set up the database

Create a PostgreSQL database named `sweety`. For example, in PowerShell or a terminal with PostgreSQL tools installed:

```powershell
createdb -U postgres sweety
```

If `createdb` is unavailable, open `psql` and run:

```sql
CREATE DATABASE sweety;
```

Make sure the database name, PostgreSQL user, password, host, and port in `.env` match your setup. Then create the app's tables:

```powershell
npm run db:init -w server
```

The server also checks and creates missing tables when it starts. The database itself must exist first.

## Add a demo account

Create a demo user and sample readings for the past seven days:

```powershell
npm run seed -w server
```

For a new account, the name, email, and password come from `SEED_USER_NAME`, `SEED_USER_EMAIL`, and `SEED_USER_PASSWORD` in `.env`. The seed script hashes the password before saving it and prints the credentials on first creation. On later runs, it keeps the existing account and adds any missing sample readings; it does not change that account's password.

## Run the app

From the project folder, start both the API and website:

```powershell
npm run dev
```

Open the website at <http://localhost:5173>. The API runs at <http://localhost:4000>; its health check is <http://localhost:4000/api/health>.

To run either part by itself, use separate terminals from the project folder:

```powershell
npm run dev -w server
```

```powershell
npm run dev -w client
```

The website uses `/api` by default, and Vite forwards those local requests to the API. If you use a different API address, set `VITE_API_URL` in `client/.env`.

## Run tests and build

Run the server validation tests:

```powershell
npm test
```

Create a production build of the website:

```powershell
npm run build
```

## Main features

- Register and log in; passwords are stored as bcrypt hashes.
- Add, edit, view, and delete readings. Each reading has a date, one of four time slots, and a glucose value in mg/dl.
- Validate dates and values, prevent duplicate time slots, and limit each user to four readings per day.
- View daily, month-to-date, and previous-month summaries, including high, low, average, and reading count.
- View a line chart of daily averages and paginate the readings API with `GET /api/readings?page=1&limit=20`.

## Notes

**With more time:** I would add database-backed tests for duplicate and daily-limit behavior, tests for report calculations and user data separation, and improve the in-app pagination controls.
