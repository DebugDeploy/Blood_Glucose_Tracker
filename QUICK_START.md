# ⚡ Quick Start - Sweety App

## 🚀 First Time? Start Here!

### 1️⃣ Check PostgreSQL
```powershell
npm run check
```

**If it says PostgreSQL is not found:**
→ See [SETUP_GUIDE.md](./SETUP_GUIDE.md) to install PostgreSQL

**If PostgreSQL is running:**
→ Continue to step 2 ✅

---

### 2️⃣ Install & Configure
```powershell
# Install dependencies
npm install

# Copy environment file
Copy-Item .env.example .env

# Edit .env file - Update your PostgreSQL password!
# Look for DATABASE_URL and change 'postgres' to your password
```

---

### 3️⃣ Setup Database
```powershell
# Create database (one-time only)
# Option A: Using psql
psql -U postgres -c "CREATE DATABASE sweety;"

# Option B: Using pgAdmin GUI
# Right-click Databases → Create → Name: sweety
```

```powershell
# Initialize tables
npm run db:init -w server

# Add demo data (recommended)
npm run seed -w server
```

---

### 4️⃣ Start the App
```powershell
npm run dev
```

**Open:** http://localhost:5173

**Demo Login:**
- Email: `demo@example.com`
- Password: `Password123!`

---

## 🆘 Problems?

### ❌ "ECONNREFUSED" error
PostgreSQL is not running.
```powershell
# Check service
Get-Service postgresql*

# Start service
Start-Service postgresql-x64-14
```

### ❌ "password authentication failed"
Wrong password in `.env` file.
1. Open `.env`
2. Update password in `DATABASE_URL`
3. Restart: `npm run dev`

### ❌ "database does not exist"
Database not created.
```powershell
psql -U postgres -c "CREATE DATABASE sweety;"
```

### ❌ "relation users does not exist"
Tables not initialized.
```powershell
npm run db:init -w server
```

---

## 📚 More Help

- **Detailed Setup:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Full Docs:** [README.md](./README.md)
- **Validation:** [VALIDATION_REPORT.md](./VALIDATION_REPORT.md)
- **Theme Info:** [THEME_UPDATE.md](./THEME_UPDATE.md)
- **Complete Guide:** [FINAL_SUMMARY.md](./FINAL_SUMMARY.md)

---

## ✅ Quick Test

After starting, test these:

1. ✅ Register new account
2. ✅ Login with demo account
3. ✅ Add a reading
4. ✅ View reports update
5. ✅ See monthly chart
6. ✅ Edit a reading
7. ✅ Delete a reading

---

## 🎨 What's New?

- 🌙 **Dark Theme** - Modern and vibrant
- 💜 **Purple Gradients** - Beautiful accents
- 💚 **Emerald Charts** - Easy to read
- ✨ **Smooth Animations** - Professional feel
- 🔧 **Health Check Tool** - `npm run check`

---

**That's it! You're ready to go!** 🎉
