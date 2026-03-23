# 🚀 Quick Start Guide

## 1️⃣ Install Dependencies
```bash
npm install
```

## 2️⃣ Start Server
```bash
npm start
```

You should see:
```
Connected to SQLite database
Server running on http://localhost:5000
```

## 3️⃣ Open Browser
Go to: `http://localhost:5000`

## 4️⃣ Create Account
- Click "Register"
- Enter username and password
- Click Register
- Login with your credentials

## 5️⃣ Start Tracking
- Add study sessions
- View statistics
- Filter by time period
- Delete sessions as needed

## 📁 File Locations

- **Frontend**: `public/` folder
- **Backend**: `server.js`
- **Database**: `study_tracker.db` (auto-created)
- **Config**: `.env` file

## 🔧 Common Commands

```bash
# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Check if port is in use
netstat -ano | findstr :5000
```

## ⚠️ Troubleshooting

**Server won't start?**
- Check if port 5000 is available
- Run: `npm install` again
- Delete `node_modules` and reinstall

**Can't login?**
- Make sure server is running
- Check browser console for errors (F12)
- Try registering a new account

**Database errors?**
- Delete `study_tracker.db`
- Restart server

## 📞 Need Help?

Check the main README.md for detailed documentation
