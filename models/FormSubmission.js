const mongoose = require('mongoose');

const FormSubmissionSchema = new mongoose.Schema({
  role: String,
  fullName: String,
  phoneNumber: String,
  emailAddress: String,
  country: String,
  city: String,
  startupName: String,
  websiteURL: String,
  currentState: String,
  lookingFor: String,
  companyLinkedIn: String,
  foundersLinkedIn: String,
  industry: String,
  problemSolved: String,
  startupDescription: String,
  targetMarket: String,
  numberOfCustomers: Number,
  revenueCurrency: String,
  revenueAmount: Number,
  raisedFunding: Boolean,
  fundingCurrency: String,
  fundingAmount: Number,
  heardFrom: String,
  additionalInfo: String,
  pitchDeck: String,
  pdfFileUrl: String,
  submissionDate: {
    type: Date,
    default: Date.now
  },
  uploadLog: {
    success: Boolean,
    fileName: String,
    fileSize: Number,
    fileType: String,
    startTime: Date,
    endTime: Date,
    duration: Number,
    error: String,
    fileUrl: String
  }
}, { timestamps: true });

module.exports = mongoose.model('FormSubmission', FormSubmissionSchema);
