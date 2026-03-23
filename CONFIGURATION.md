# ⚙️ Configuration & Customization Guide

## Environment Variables (.env)

### Development
```
PORT=5000
JWT_SECRET=dev-secret-key
NODE_ENV=development
```

### Production
```
PORT=5000
JWT_SECRET=your-very-secure-random-key-here
NODE_ENV=production
```

### Generate Secure JWT Secret
```bash
# On Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString())) | Out-String

# On Mac/Linux
openssl rand -base64 32
```

---

## Server Configuration

### Change Port
Edit `.env`:
```
PORT=3000
```

### Change JWT Expiration
Edit `server.js`, find:
```javascript
jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
```

Change `'7d'` to:
- `'24h'` - 24 hours
- `'30d'` - 30 days
- `'1y'` - 1 year

### Enable HTTPS
```javascript
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('path/to/key.pem'),
    cert: fs.readFileSync('path/to/cert.pem')
};

https.createServer(options, app).listen(PORT);
```

---

## Database Configuration

### Use PostgreSQL Instead of SQLite

1. Install PostgreSQL driver:
```bash
npm install pg
```

2. Update `server.js`:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});
```

3. Add to `.env`:
```
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=study_tracker
```

### Database Backup (SQLite)
```bash
# Copy database file
cp study_tracker.db study_tracker_backup.db
```

---

## Frontend Customization

### Change API URL
Edit `public/app.js`:
```javascript
const API_URL = 'http://localhost:5000/api';
```

For production:
```javascript
const API_URL = 'https://your-domain.com/api';
```

### Change Colors
Edit `public/style.css`:

Primary color (purple):
```css
background: #667eea;
```

Secondary color (pink):
```css
background: #764ba2;
```

Success color (green):
```css
color: #27ae60;
```

Error color (red):
```css
color: #e74c3c;
```

### Change Fonts
Edit `public/style.css`:
```css
font-family: 'Your Font Name', sans-serif;
```

### Change Difficulty Colors
Edit `public/style.css`:
```css
.session-item.easy {
    border-left-color: #2ecc71;  /* Green */
}

.session-item.medium {
    border-left-color: #f39c12;  /* Orange */
}

.session-item.hard {
    border-left-color: #e74c3c;  /* Red */
}
```

---

## Security Customization

### Add Rate Limiting
```bash
npm install express-rate-limit
```

Add to `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Add Input Validation
```bash
npm install joi
```

Add to `server.js`:
```javascript
const Joi = require('joi');

const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required()
});
```

### Add CORS Whitelist
Edit `server.js`:
```javascript
app.use(cors({
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true
}));
```

---

## Performance Optimization

### Enable Compression
```bash
npm install compression
```

Add to `server.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

### Add Caching Headers
```javascript
app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=3600');
    next();
});
```

### Database Connection Pooling
```javascript
const pool = new sqlite3.Database('./study_tracker.db', (err) => {
    if (err) console.error(err);
});

pool.configure('busyTimeout', 5000);
```

---

## Logging Configuration

### Add Winston Logger
```bash
npm install winston
```

Add to `server.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

---

## Email Notifications (Optional)

### Add Email Support
```bash
npm install nodemailer
```

Add to `server.js`:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

---

## API Response Customization

### Change Response Format
Edit `server.js`:
```javascript
// Before
res.json({ token, username: user.username });

// After
res.json({
    success: true,
    data: { token, username: user.username },
    timestamp: new Date()
});
```

### Add API Versioning
```javascript
app.post('/api/v1/register', ...);
app.post('/api/v2/register', ...);
```

---

## Testing Configuration

### Add Jest Testing
```bash
npm install --save-dev jest
```

Create `jest.config.js`:
```javascript
module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/']
};
```

---

## Docker Configuration (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - JWT_SECRET=your-secret
```

Run:
```bash
docker-compose up
```

---

## Environment-Specific Configs

### Development
```
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

### Staging
```
NODE_ENV=staging
DEBUG=false
LOG_LEVEL=info
```

### Production
```
NODE_ENV=production
DEBUG=false
LOG_LEVEL=error
```

---

## Monitoring & Analytics

### Add Sentry Error Tracking
```bash
npm install @sentry/node
```

### Add Google Analytics (Frontend)
Add to `public/index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_ID');
</script>
```

---

## Backup & Recovery

### Automated Backups
```bash
# Create backup script
cp study_tracker.db "backups/study_tracker_$(date +%Y%m%d_%H%M%S).db"
```

### Database Export
```bash
sqlite3 study_tracker.db ".dump" > backup.sql
```

### Database Import
```bash
sqlite3 study_tracker.db < backup.sql
```

---

## Troubleshooting Configuration

### Check Node Version
```bash
node --version
```

### Check Port Usage
```bash
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

### Clear Cache
```bash
rm -rf node_modules
npm install
```

### Reset Database
```bash
rm study_tracker.db
npm start
```

---

**Need help? Check README.md or DEPLOYMENT.md** 📚
