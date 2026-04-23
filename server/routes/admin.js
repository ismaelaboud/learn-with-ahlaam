const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Participant = require('../models/Participant');
const adminAuth = require('../middleware/adminAuth');

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

// POST /api/admin/question - create new question
router.post('/question', adminAuth, async (req, res) => {
  try {
    const { text, correctAnswer } = req.body;
    
    if (!text || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Question text and correct answer are required'
      });
    }
    
    // Check if there's already an active question
    const activeQuestion = await Question.findOne({ status: 'active' });
    
    if (activeQuestion) {
      return res.status(400).json({
        success: false,
        message: 'There is already an active question. Close it first.'
      });
    }
    
    const question = new Question({
      text: text.trim(),
      correctAnswer: correctAnswer.trim()
    });
    
    await question.save();
    
    res.status(201).json({
      success: true,
      data: question,
      message: 'Question created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/admin/question/:id/close - close the active question
router.post('/question/:id/close', adminAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    if (question.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Question is already closed'
      });
    }
    
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
    await question.save();
    
    const correctSubmissions = submissions.filter(s => s.isCorrect);
    const incorrectSubmissions = submissions.filter(s => !s.isCorrect);
    
    res.json({
      success: true,
      data: {
        question: {
          _id: question._id,
          text: question.text,
          correctAnswer: question.correctAnswer,
          status: question.status,
          createdAt: question.createdAt,
          revealedAt: question.revealedAt
        },
        stats: {
          total: submissions.length,
          correct: correctSubmissions.length,
          incorrect: incorrectSubmissions.length
        },
        correctSubmissions,
        incorrectSubmissions
      },
      message: 'Question closed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/admin/question/:id/submissions - view all submissions for a question
router.get('/question/:id/submissions', adminAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    const submissions = await Submission.find({ questionId: question._id })
      .sort({ submittedAt: 1 });
    
    res.json({
      success: true,
      data: {
        question,
        submissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
