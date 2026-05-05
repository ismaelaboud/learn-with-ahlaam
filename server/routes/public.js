const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const Participant = require('../models/Participant');
const Message = require('../models/Message');
const Article = require('../models/Article');

// GET /api/question/active - returns active question (WITHOUT correctAnswer field)
router.get('/question/active', async (req, res) => {
  try {
    const activeQuestion = await Question.findOne({ status: 'active' });
    
    if (!activeQuestion) {
      return res.json({
        success: true,
        data: null,
        message: 'No active question'
      });
    }
    
    // Return question without correctAnswer but with revealAt for timer functionality
    const questionData = {
      _id: activeQuestion._id,
      text: activeQuestion.text,
      status: activeQuestion.status,
      createdAt: activeQuestion.createdAt,
      revealAt: activeQuestion.revealAt
    };
    
    res.json({
      success: true,
      data: questionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/question/:id - returns question by ID (WITHOUT correctAnswer field)
router.get('/question/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Return question without correctAnswer but with revealAt for timer functionality
    const questionData = {
      _id: question._id,
      text: question.text,
      status: question.status,
      createdAt: question.createdAt,
      revealAt: question.revealAt
    };
    
    res.json({
      success: true,
      data: questionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/question/:id/result - returns closed question WITH correctAnswer + list of who got it right/wrong
router.get('/question/:id/result', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    if (question.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Question is not closed yet'
      });
    }
    
    const submissions = await Submission.find({ questionId: question._id })
      .populate('participantName')
      .sort({ submittedAt: 1 });
    
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
        correctSubmissions,
        incorrectSubmissions,
        stats: {
          total: submissions.length,
          correct: correctSubmissions.length,
          incorrect: incorrectSubmissions.length
        }
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

// POST /api/question/:id/submit - submit an answer
router.post('/question/:id/submit', async (req, res) => {
  try {
    const { participantName, answer } = req.body;
    
    if (!participantName || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Participant name and answer are required'
      });
    }
    
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
        message: 'Question is closed for submissions'
      });
    }
    
    const normalizedName = participantName.trim().toLowerCase();
    
    // Check if this participant already submitted
    const existingSubmission = await Submission.findOne({
      questionId: question._id,
      participantName: normalizedName
    });
    
    if (existingSubmission) {
      // Update existing submission
      existingSubmission.answer = answer.trim();
      existingSubmission.submittedAt = new Date();
      await existingSubmission.save();
    } else {
      // Create new submission
      const submission = new Submission({
        questionId: question._id,
        participantName: normalizedName,
        answer: answer.trim()
      });
      await submission.save();
      
      // Create or update participant
      let participant = await Participant.findOne({ name: normalizedName });
      
      if (!participant) {
        participant = new Participant({
          name: normalizedName,
          displayName: participantName.trim()
        });
        await participant.save();
      }
    }
    
    res.json({
      success: true,
      message: existingSubmission ? 'Answer updated!' : 'Answer submitted!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/leaderboard - returns all participants sorted by totalCorrect descending
router.get('/leaderboard', async (req, res) => {
  try {
    const participants = await Participant.find()
      .sort({ totalCorrect: -1, totalAnswered: -1 });
    
    res.json({
      success: true,
      data: participants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/questions/history - returns all closed questions (without correctAnswer) paginated
router.get('/questions/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const questions = await Question.find({ status: 'closed' })
      .sort({ revealedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-correctAnswer');
    
    const total = await Question.countDocuments({ status: 'closed' });
    
    // Get submission counts for each question
    const questionsWithStats = await Promise.all(
      questions.map(async (question) => {
        const submissions = await Submission.find({ questionId: question._id });
        const correctCount = submissions.filter(s => s.isCorrect).length;
        
        return {
          ...question.toObject(),
          submissionStats: {
            total: submissions.length,
            correct: correctCount,
            incorrect: submissions.length - correctCount
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        questions: questionsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
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

// GET /api/messages/:questionId - fetch all messages for a question
router.get('/messages/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const messages = await Message.find({ questionId })
      .sort({ createdAt: 1 })
      .select('senderName text createdAt');
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/articles - return all published articles
router.get('/articles', async (req, res) => {
  try {
    const { category, standalone } = req.query;
    
    const query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (standalone === 'true') {
      query.questionId = { $exists: false };
    }
    
    const articles = await Article.find(query)
      .populate('questionId', 'text')
      .sort({ publishedAt: -1 });
    
    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/articles/:slug - return single published article by slug
router.get('/articles/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    })
      .populate('questionId', 'text');
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/articles/question/:questionId - return published article linked to a specific question
router.get('/articles/question/:questionId', async (req, res) => {
  try {
    const article = await Article.findOne({ 
      questionId: req.params.questionId,
      status: 'published'
    })
      .populate('questionId', 'text');
    
    res.json({
      success: true,
      data: article
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
