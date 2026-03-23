# 📚 Study Tracker - Full Stack Application

A complete full-stack study session tracker with Node.js backend, SQLite database, and modern frontend.

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing

## Project Structure

```
StudyTracker/
├── server.js              # Express server
├── package.json           # Dependencies
├── .env                   # Environment variables
├── study_tracker.db       # SQLite database (auto-created)
└── public/
    ├── index.html         # Frontend HTML
    ├── style.css          # Styling
    └── app.js             # Frontend JavaScript
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Step 1: Install Dependencies
```bash
cd StudyTracker
npm install
```

### Step 2: Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Step 3: Open in Browser
Open your browser and go to:
```
http://localhost:5000
```

## Features

### Authentication
- User registration with password hashing
- Secure login with JWT tokens
- Token-based API authentication
- 7-day token expiration

### Study Sessions
- Add study sessions with subject, duration, and difficulty
- View all sessions or filter by Today/This Week
- Delete individual sessions
- Clear sessions older than 30 days

### Statistics
- Total study hours
- Total number of sessions
- Average session duration

### Data Persistence
- SQLite database stores all user data
- Secure password storage with bcryptjs
- User-specific session isolation

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Sessions (Requires JWT Token)
- `POST /api/sessions` - Add new session
- `GET /api/sessions?filter=all|today|week` - Get sessions
- `DELETE /api/sessions/:id` - Delete session
- `DELETE /api/sessions/clear/old` - Clear old sessions

### Stats (Requires JWT Token)
- `GET /api/stats` - Get user statistics

## Default Credentials

After first run, you can create your own account. The app uses secure JWT authentication.

## Environment Variables

Edit `.env` file to customize:
```
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

## Deployment

### Deploy to Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Deploy to Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Deploy to Render
1. Connect GitHub repository
2. Create new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`

## Security Notes

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Implement rate limiting for production
- Add input validation on backend
- Use environment variables for sensitive data

## Troubleshooting

### "Cannot find module" error
```bash
npm install
```

### Port already in use
Change PORT in `.env` file

### Database locked error
Delete `study_tracker.db` and restart server

### CORS errors
Make sure frontend URL matches API_URL in app.js

## Future Enhancements

- Export data as CSV/PDF
- Study goals and targets
- Subject-wise analytics
- Dark mode
- Mobile app
- Cloud backup
- Study reminders
- Leaderboard

## License

MIT License - Feel free to use this project
