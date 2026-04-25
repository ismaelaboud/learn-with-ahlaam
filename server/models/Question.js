const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  correctAnswer: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  revealedAt: {
    type: Date
  },
  revealAt: {
    type: Date
  },
  timerStatus: {
    type: String,
    enum: ['pending', 'expired'],
    default: 'pending'
  }
});

module.exports = mongoose.model('Question', questionSchema);
