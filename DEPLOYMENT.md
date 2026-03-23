# 🌐 Deployment Guide

## Local Deployment (Development)

### Windows
```bash
cd StudyTracker
npm install
npm start
```
Open: `http://localhost:5000`

### Mac/Linux
```bash
cd StudyTracker
npm install
npm start
```
Open: `http://localhost:5000`

---

## Cloud Deployment

### 1. Heroku (Free tier available)

**Prerequisites**: Heroku CLI installed

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variable
heroku config:set JWT_SECRET=your-secret-key

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

**Access**: `https://your-app-name.herokuapp.com`

---

### 2. Railway (Recommended - Easy)

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub repository
5. Railway auto-detects Node.js
6. Add environment variables:
   - `JWT_SECRET`: your-secret-key
   - `NODE_ENV`: production
7. Deploy automatically

**Access**: Railway provides a public URL

---

### 3. Render (Free tier available)

1. Go to [render.com](https://render.com)
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub repository
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add environment variables
7. Deploy

**Access**: Render provides a public URL

---

### 4. Vercel (Frontend only)

For frontend-only deployment (requires separate backend):

1. Go to [vercel.com](https://vercel.com)
2. Import project
3. Deploy

---

### 5. AWS (EC2)

1. Launch EC2 instance (Ubuntu)
2. SSH into instance
3. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Clone repository
5. Install dependencies: `npm install`
6. Install PM2: `npm install -g pm2`
7. Start app: `pm2 start server.js`
8. Configure security groups for port 5000

---

### 6. DigitalOcean (App Platform)

1. Go to DigitalOcean
2. Create new App
3. Connect GitHub repository
4. Select Node.js runtime
5. Add environment variables
6. Deploy

---

## Production Checklist

- [ ] Change `JWT_SECRET` in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Configure domain name
- [ ] Enable CORS properly
- [ ] Add input validation

---

## Environment Variables for Production

```
PORT=5000
JWT_SECRET=your-very-secure-random-key-here
NODE_ENV=production
DATABASE_URL=your-database-url (if using cloud DB)
```

---

## Database Migration (Optional)

For production, consider using PostgreSQL instead of SQLite:

1. Install PostgreSQL driver:
   ```bash
   npm install pg
   ```

2. Update database connection in `server.js`

3. Migrate data if needed

---

## Monitoring & Logs

### Heroku
```bash
heroku logs --tail
```

### Railway
Dashboard shows real-time logs

### Render
Dashboard shows deployment logs

### PM2 (Local/VPS)
```bash
pm2 logs
pm2 monit
```

---

## Troubleshooting Deployment

**App crashes on startup**
- Check logs for errors
- Verify environment variables
- Check Node.js version compatibility

**Database connection fails**
- Verify database URL
- Check credentials
- Ensure database is running

**Port already in use**
- Change PORT in environment variables
- Kill process using port

**CORS errors**
- Update CORS settings in server.js
- Add frontend URL to allowed origins

---

## Performance Tips

1. Enable gzip compression
2. Use CDN for static files
3. Implement caching
4. Optimize database queries
5. Use connection pooling
6. Monitor memory usage

---

## Backup Strategy

1. Regular database backups
2. Version control with Git
3. Environment variable backups
4. User data exports

---

## Support

For deployment issues, check:
- Platform documentation
- Server logs
- Browser console (F12)
- Network tab in DevTools
