require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const Question = require('./models/Question');
const Submission = require('./models/Submission');
const Participant = require('./models/Participant');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Make io instance available to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learn-with-ahlaam', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Helper function for fuzzy matching
const fuzzyMatch = (answer1, answer2) => {
  const a1 = answer1.trim().toLowerCase();
  const a2 = answer2.trim().toLowerCase();

  // Exact match
  if (a1 === a2) return true;

  // One contains the other
  if (a1.includes(a2) || a2.includes(a1)) return true;

  // Remove common punctuation and compare
  const clean1 = a1.replace(/[^a-z0-9\s]/g, '').trim();
  const clean2 = a2.replace(/[^a-z0-9\s]/g, '').trim();
  if (clean1 === clean2) return true;
  if (clean1.includes(clean2) || clean2.includes(clean1)) return true;

  // Levenshtein distance for typo tolerance
  const levenshtein = (s1, s2) => {
    const m = s1.length;
    const n = s2.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = s1[i-1] === s2[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
    return dp[m][n];
  };

  const distance = levenshtein(clean1, clean2);
  const maxLen = Math.max(clean1.length, clean2.length);

  // Allow up to 30% character difference
  // e.g. "abubakar" vs "abu bakar" or "abubakr" → correct
  if (maxLen > 0 && distance / maxLen <= 0.3) return true;

  // Word by word matching — if most words match consider correct
  const words1 = clean1.split(/\s+/);
  const words2 = clean2.split(/\s+/);
  const commonWords = words1.filter(w => 
    words2.some(w2 => w === w2 || levenshtein(w, w2) <= 1)
  );
  const matchRatio = commonWords.length / Math.max(words1.length, words2.length);
  if (matchRatio >= 0.7) return true;

  return false;
};

// Background job to auto-close questions and activate scheduled ones
const autoCloseQuestions = async () => {
  try {
    console.log('Checking for questions to auto-close...');
    
    // Find active questions with revealAt <= current time and timerStatus = 'pending'
    const questionsToClose = await Question.find({
      status: 'active',
      revealAt: { $lte: new Date() },
      timerStatus: 'pending'
    });
    
    let hasClosedQuestions = false;
    
    for (const question of questionsToClose) {
      console.log(`Auto-closing question: ${question._id}`);
      
      const submissions = await Submission.find({ questionId: question._id });
      
      // Process each submission
      for (const submission of submissions) {
        const isCorrect = fuzzyMatch(submission.answer, question.correctAnswer);
        submission.isCorrect = isCorrect;
        await submission.save();
        
        // Update participant stats
        const participant = await Participant.findOne({ name: submission.participantName });
        
        if (participant) {
          participant.totalAnswered += 1;
          
          if (isCorrect) {
            participant.totalCorrect += 1;
            participant.currentStreak += 1;
            
            if (participant.currentStreak > participant.bestStreak) {
              participant.bestStreak = participant.currentStreak;
            }
          } else {
            participant.currentStreak = 0;
          }
          
          await participant.save();
        }
      }
      
      // Update question status
      question.status = 'closed';
      question.revealedAt = new Date();
      question.timerStatus = 'expired';
      await question.save();
      
      console.log(`Question ${question._id} auto-closed successfully`);
      hasClosedQuestions = true;
    }
    
    if (questionsToClose.length === 0) {
      console.log('No questions to auto-close');
    }
    
    // Check if there are currently no active questions
    const activeQuestions = await Question.find({ status: 'active' });
    
    // Always check for scheduled questions to activate if there are no active questions
    if (activeQuestions.length === 0) {
      console.log('No active questions found, checking scheduled questions...');
      await activateNextScheduledQuestion();
    } else if (hasClosedQuestions) {
      // Also check after closing questions to maintain flow
      await activateNextScheduledQuestion();
    }
  } catch (error) {
    console.error('Error in auto-close job:', error);
  }
};

// Function to activate the next scheduled question
const activateNextScheduledQuestion = async () => {
  try {
    console.log('Checking for scheduled questions to activate...');
    
    const now = new Date();
    
    // First, check for scheduled questions with scheduledFor <= now
    const readyScheduledQuestions = await Question.find({
      status: 'scheduled',
      scheduledFor: { $lte: now, $ne: null }
    }).sort({ scheduledFor: 1 });
    
    if (readyScheduledQuestions.length > 0) {
      // Activate the earliest ready question
      const questionToActivate = readyScheduledQuestions[0];
      questionToActivate.status = 'active';
      await questionToActivate.save();
      
      console.log(`Activated scheduled question: ${questionToActivate._id}`);
      return;
    }
    
    // If no ready scheduled questions, check for queued ones (scheduledFor is null)
    const queuedQuestions = await Question.find({
      status: 'scheduled',
      scheduledFor: null
    }).sort({ createdAt: 1 });
    
    if (queuedQuestions.length > 0) {
      // Activate the earliest created queued question
      const questionToActivate = queuedQuestions[0];
      questionToActivate.status = 'active';
      await questionToActivate.save();
      
      console.log(`Activated queued question: ${questionToActivate._id}`);
      return;
    }
    
    console.log('No scheduled questions to activate');
  } catch (error) {
    console.error('Error activating scheduled question:', error);
  }
};

// Use setInterval instead of cron for more reliable execution
setInterval(autoCloseQuestions, 60000); // Run every 60 seconds

console.log('Background job started: Auto-close questions every minute');

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', async ({ questionId }) => {
    try {
      socket.join(questionId);
      console.log(`User ${socket.id} joined room ${questionId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  socket.on('sendMessage', async ({ questionId, senderName, text }) => {
    try {
      const message = new Message({
        questionId,
        senderName,
        text
      });
      
      await message.save();
      
      // Broadcast to all clients in the room
      io.to(questionId).emit('newMessage', message);
      
      console.log(`Message sent in room ${questionId} by ${senderName}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('leaveRoom', ({ questionId }) => {
    try {
      socket.leave(questionId);
      console.log(`User ${socket.id} left room ${questionId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Client is deployed separately on Vercel, no static file serving needed

// OG meta tags route for social sharing
app.get('/og/articles/:slug', async (req, res) => {
  try {
    const Article = require('./models/Article')
    const article = await Article.findOne({ 
      slug: req.params.slug,
      status: 'published'
    })

    if (!article) {
      return res.status(404).send('Article not found')
    }

    const excerpt = article.content
      .replace(/[#*>\-\[\]`]/g, '')
      .trim()
      .substring(0, 160)

    const coverImage = article.coverImage || 
      'https://learn-with-ahlaam.vercel.app/og-image.png'

    const articleUrl = `https://learn-with-ahlaam.vercel.app/articles/${article.slug}` 

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${article.title} — Learn with Ahlaam</title>
    <meta name="description" content="${excerpt}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Learn with Ahlaam" />
    <meta property="og:title" content="${article.title}" />
    <meta property="og:description" content="${excerpt}" />
    <meta property="og:url" content="${articleUrl}" />
    <meta property="og:image" content="${coverImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${article.title}" />
    <meta name="twitter:description" content="${excerpt}" />
    <meta name="twitter:image" content="${coverImage}" />
    <meta http-equiv="refresh" content="0;url=${articleUrl}" />
    <script>window.location.href = "${articleUrl}";</script>
  </head>
  <body><p>Redirecting...</p></body>
</html>`

    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    res.status(500).send('Server error')
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler must come AFTER this route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
