const mongoose = require('mongoose');

const ProjectEvaluationSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true,
    ref: 'FormSubmission'
  },
  projectStatus: {
    type: String,
    enum: ['Round 1 Cleared', 'Round 2 Cleared', 'Selected', 'Rejected', 'On Hold'],
    default: 'On Hold'
  },
  roundNotes: {
    firstRound: String,
    secondRound: String,
    thirdRound: String,
    generalNotes: String
  },
  additionalDocuments: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['Document', 'Pitch Material'],
      required: true
    }
  }],
  evaluationChecklist: [{
    name: String,
    checked: Boolean
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ProjectEvaluation', ProjectEvaluationSchema); 