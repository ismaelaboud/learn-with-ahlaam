# Learn with Ahlaam - Daily Trivia Web App

A beautiful daily trivia platform where an admin posts one question per day with a secret correct answer. Participants access the question via a shared link, submit their name and answer, and the next day the admin closes the question revealing the correct answer and updating scores. A public leaderboard tracks all-time performance.

## Features

- **Daily Questions**: Admin posts one question per day
- **Participant Submissions**: Users submit their name and answer
- **Answer Reveal**: Admin closes questions to reveal correct answers
- **Fuzzy Matching**: Intelligent answer matching (case-insensitive, partial matches)
- **Leaderboard**: Public ranking with streak tracking
- **Question History**: View past questions and results
- **Dark Romantic Theme**: Beautiful UI with deep colors and elegant typography
- **Mobile Responsive**: Works perfectly on all devices

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT-like admin authentication** (simple password-based)

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Custom CSS** with dark romantic theme
- **Google Fonts** (Playfair Display + Inter)

## Project Structure

```
learn-with-ahlaam/
├── server/                 # Express backend
│   ├── models/            # MongoDB models
│   │   ├── Question.js
│   │   ├── Submission.js
│   │   └── Participant.js
│   ├── routes/            # API routes
│   │   ├── public.js      # Public API endpoints
│   │   └── admin.js       # Admin-only endpoints
│   ├── middleware/        # Express middleware
│   │   └── adminAuth.js   # Admin authentication
│   ├── server.js          # Main server file
│   ├── package.json
│   └── .env.example       # Environment variables template
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/         # React components
│   │   │   ├── Home.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── History.jsx
│   │   │   └── Admin.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css      # Dark romantic theme
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### 1. Clone and Setup

```bash
# Navigate to project directory
cd learn-with-ahlaam

# Setup Backend
cd server
npm install
cp .env.example .env

# Setup Frontend
cd ../client
npm install
```

### 2. Configure Environment Variables

Edit `server/.env` with your configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
ADMIN_PASSWORD=your_secret_password
```

For MongoDB, you can use:
- **Local MongoDB**: `mongodb://localhost:27017/learn-with-ahlaam`
- **MongoDB Atlas**: Get your connection string from atlas.mongodb.com

### 3. Run the Application

#### Development Mode

```bash
# Terminal 1 - Start Backend
cd server
npm run dev

# Terminal 2 - Start Frontend
cd client
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

#### Production Mode

```bash
# Build Frontend
cd client
npm run build

# Start Backend (serves frontend build)
cd ../server
npm start
```

The app will be available at http://localhost:5000

## Usage Guide

### For Participants

1. **Visit the Home Page** (`/`) to see today's question
2. **Enter Your Name and Answer** and submit
3. **Check Back Tomorrow** to see if you got it right
4. **View the Leaderboard** (`/leaderboard`) to see rankings
5. **Browse History** (`/history`) to see past questions

### For Admin (Ahlam)

1. **Access Admin Panel** (`/admin`)
2. **Login** with your admin password
3. **Post New Questions** when there's no active question
4. **Monitor Submissions** for the active question
5. **Close Questions** to reveal answers and update scores
6. **View Past Questions** and their statistics

## API Endpoints

### Public Routes
- `GET /api/question/active` - Get active question (no correct answer)
- `GET /api/question/:id/result` - Get closed question with results
- `POST /api/question/:id/submit` - Submit an answer
- `GET /api/leaderboard` - Get participant rankings
- `GET /api/questions/history` - Get paginated question history

### Admin Routes (requires `x-admin-password` header)
- `POST /api/admin/question` - Create new question
- `POST /api/admin/question/:id/close` - Close question and reveal answer
- `GET /api/admin/question/:id/submissions` - View all submissions

## Features Details

### Fuzzy Answer Matching
When closing a question, the system compares submissions using:
- Exact match (case-insensitive, trimmed)
- Partial match (answer contains correct answer or vice versa)

### Scoring System
- **totalCorrect**: Number of correct answers
- **totalAnswered**: Total questions attempted
- **currentStreak**: Current consecutive correct answers
- **bestStreak**: Best streak achieved

### Leaderboard Rankings
- 🥇 Gold highlight for 1st place
- 🥈 Silver highlight for 2nd place  
- 🥉 Bronze highlight for 3rd place
- Sorted by correct answers, then total answered

## Design Theme

The app features a **dark romantic theme**:
- Deep backgrounds (#1a0a0a, #2d1a1a)
- Pink/coral/gold accent colors
- Elegant serif fonts (Playfair Display)
- Smooth animations and transitions
- Mobile-first responsive design

## Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure ADMIN_PASSWORD
4. Deploy to your preferred platform (Heroku, DigitalOcean, etc.)

### Frontend Deployment
The frontend build is served by the backend in production, so no separate deployment needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please:
1. Check this README for setup instructions
2. Verify your environment variables are correct
3. Ensure MongoDB is running and accessible
4. Check browser console for frontend errors
5. Check server logs for backend errors

Enjoy building and using "Learn with Ahlaam"! 🎉
