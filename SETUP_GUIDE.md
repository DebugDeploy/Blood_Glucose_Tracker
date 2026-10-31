# 🚀 Sweety Setup Guide

## Step 1: Install PostgreSQL

### Windows Installation

1. **Download PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Download the installer (PostgreSQL 14 or later recommended)

2. **Run the Installer:**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the welcome screens
   - Choose installation directory (default is fine)
   - Select components: Keep all defaults checked
   - Choose data directory (default is fine)
   - **Set a password for the `postgres` user** (Remember this!)
   - Port: Keep default `5432`
   - Locale: Default
   - Complete the installation

3. **Verify PostgreSQL is Running:**
   ```powershell
   # Check if service is running
   Get-Service -Name postgresql*
   
   # If not running, start it:
   Start-Service postgresql-x64-14  # Adjust version number if needed
   ```

4. **Test Connection:**
   ```powershell
   # This should open PostgreSQL prompt
   psql -U postgres
   
   # If it works, type \q to quit
   ```

## Step 2: Create Database

### Option A: Using psql (Command Line)
```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sweety;

# Exit
\q
```

### Option B: Using pgAdmin (GUI)
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to PostgreSQL Server (use your postgres password)
3. Right-click "Databases" → Create → Database
4. Name: `sweety`
5. Click "Save"

## Step 3: Configure Environment Variables

1. **Copy the environment template:**
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit `.env` file** and update:
   ```bash
   # IMPORTANT: Update the password here!
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/sweety
   
   # Generate a random JWT secret (use a password generator)
   JWT_SECRET=your-long-random-secret-at-least-32-characters-long
   
   # Leave these as default
   PORT=4000
   CLIENT_ORIGIN=http://localhost:5173
   SEED_USER_NAME=Samarth Demo
   SEED_USER_EMAIL=demo@example.com
   SEED_USER_PASSWORD=Password123!
   ```

   **Replace `YOUR_PASSWORD_HERE`** with the password you set during PostgreSQL installation.

## Step 4: Install Node.js Dependencies

```powershell
# From the project root directory
npm install
```

This will install all dependencies for both server and client.

## Step 5: Initialize Database Tables

```powershell
npm run db:init -w server
```

You should see: `Database tables are ready.`

## Step 6: Seed Demo Data (Optional)

```powershell
npm run seed -w server
```

This creates a demo account with sample readings:
- Email: `demo@example.com`
- Password: `Password123!`

## Step 7: Start the Application

```powershell
npm run dev
```

This starts both:
- API server on http://localhost:4000
- React client on http://localhost:5173

Open your browser to **http://localhost:5173**

---

## 🐛 Troubleshooting

### Error: `ECONNREFUSED ::1:5432`

**Problem:** PostgreSQL is not running.

**Solutions:**
1. Start PostgreSQL service:
   ```powershell
   Start-Service postgresql-x64-14
   ```

2. Check service status:
   ```powershell
   Get-Service -Name postgresql*
   ```

3. If service doesn't exist, PostgreSQL may not be installed correctly.

---

### Error: `password authentication failed`

**Problem:** Wrong password in DATABASE_URL.

**Solution:**
1. Open `.env` file
2. Update the password in `DATABASE_URL`
3. Use the password you set during PostgreSQL installation

---

### Error: `database "sweety" does not exist`

**Problem:** Database hasn't been created yet.

**Solution:**
```powershell
psql -U postgres -c "CREATE DATABASE sweety;"
```

---

### Error: `relation "users" does not exist`

**Problem:** Database tables haven't been created.

**Solution:**
```powershell
npm run db:init -w server
```

---

### Port 4000 or 5173 already in use

**Problem:** Another application is using the port.

**Solutions:**

**Option 1:** Stop the other application

**Option 2:** Change the port in `.env`:
```bash
PORT=4001  # Change server port
```

And update `client/vite.config.js` proxy if needed.

---

### Registration not working in browser

**Checklist:**
1. ✅ PostgreSQL service is running
2. ✅ Database `sweety` exists
3. ✅ Tables created with `npm run db:init -w server`
4. ✅ `.env` file exists with correct DATABASE_URL
5. ✅ Server is running (check terminal for "Sweety API listening...")

**Test the server directly:**
```powershell
# Test health endpoint
curl http://localhost:4000/api/health

# Test registration
$body = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

---

## 📝 Quick Command Reference

```powershell
# Install dependencies
npm install

# Initialize database
npm run db:init -w server

# Seed demo data
npm run seed -w server

# Run dev server (both client & server)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Run server only
npm run dev -w server

# Run client only
npm run dev -w client
```

---

## 🔐 Security Notes

- Never commit `.env` file to git (it's in `.gitignore`)
- Use a strong, random JWT_SECRET in production
- Change the default demo user password
- Use environment-specific DATABASE_URL in production

---

## ✅ Verification Steps

After setup, verify everything works:

1. **Server Health Check:**
   - Open http://localhost:4000/api/health
   - Should return `{"status":"ok"}`

2. **Create Account:**
   - Open http://localhost:5173
   - Click "Create account"
   - Fill in name, email, password
   - Should log you in automatically

3. **Add a Reading:**
   - Click "Add reading" button
   - Select date, time slot, enter glucose value
   - Click "Save reading"
   - Should appear in the list

4. **View Reports:**
   - Check the three report cards update
   - View the monthly chart

---

## 🆘 Still Having Issues?

1. Check terminal output for error messages
2. Check browser console (F12) for errors
3. Verify PostgreSQL is running: `Get-Service postgresql*`
4. Check `.env` file has correct values
5. Try restarting everything:
   ```powershell
   # Stop the dev server (Ctrl+C)
   # Restart PostgreSQL
   Restart-Service postgresql-x64-14
   # Start dev server again
   npm run dev
   ```

---

**Need Help?** Check the error messages carefully - they usually tell you exactly what's wrong!
