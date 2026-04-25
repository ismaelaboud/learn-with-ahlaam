require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const Question = require('./models/Question');
const Submission = require('./models/Submission');
const Participant = require('./models/Participant');

const app = express();
const PORT = process.env.PORT || 5000;

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
  
  // Partial match - one contains the other
  if (a1.includes(a2) || a2.includes(a1)) return true;
  
  return false;
};

// Background job to auto-close questions
const autoCloseQuestions = async () => {
  try {
    console.log('Checking for questions to auto-close...');
    
    // Find active questions with revealAt <= current time and timerStatus = 'pending'
    const questionsToClose = await Question.find({
      status: 'active',
      revealAt: { $lte: new Date() },
      timerStatus: 'pending'
    });
    
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
    }
    
    if (questionsToClose.length === 0) {
      console.log('No questions to auto-close');
    }
  } catch (error) {
    console.error('Error in auto-close job:', error);
  }
};

// Schedule the job to run every minute
cron.schedule('* * * * *', autoCloseQuestions);

console.log('Background job scheduled: Auto-close questions every minute');

// Client is deployed separately on Vercel, no static file serving needed

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
