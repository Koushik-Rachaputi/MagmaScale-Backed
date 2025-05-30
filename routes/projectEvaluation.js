const express = require('express');
const router = express.Router();
const ProjectEvaluation = require('../models/ProjectEvaluation');
const FormSubmission = require('../models/FormSubmission');

// GET evaluation by form submission ID
router.get('/:formSubmissionId', async (req, res) => {
  try {
    const { formSubmissionId } = req.params;
    
    const evaluation = await ProjectEvaluation.findOne({ formSubmissionId })
      .populate('formSubmissionId', 'startupName fullName emailAddress');
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'No evaluation found for this submission'
      });
    }

    res.status(200).json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluation',
      error: error.message
    });
  }
});

// POST/PUT endpoint for creating or updating evaluation
router.post('/:formSubmissionId', async (req, res) => {
  try {
    const { formSubmissionId } = req.params;
    const updateData = req.body;

    // Verify that the form submission exists
    const formSubmission = await FormSubmission.findById(formSubmissionId);
    if (!formSubmission) {
      return res.status(404).json({
        success: false,
        message: 'Form submission not found'
      });
    }

    // Find existing evaluation or create new one
    let evaluation = await ProjectEvaluation.findOne({ formSubmissionId });

    if (evaluation) {
      // Update existing evaluation
      evaluation = await ProjectEvaluation.findOneAndUpdate(
        { formSubmissionId },
        { 
          $set: {
            ...updateData,
            lastUpdated: new Date()
          }
        },
        { 
          new: true,
          runValidators: true
        }
      );
    } else {
      // Create new evaluation
      evaluation = new ProjectEvaluation({
        formSubmissionId,
        ...updateData
      });
      await evaluation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation updated successfully',
      data: evaluation
    });
  } catch (error) {
    console.error('Error updating evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating evaluation',
      error: error.message
    });
  }
});

// GET all evaluations
router.get('/', async (req, res) => {
  try {
    const evaluations = await ProjectEvaluation.find()
      .populate('formSubmissionId', 'startupName fullName emailAddress')
      .sort({ lastUpdated: -1 });

    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluations',
      error: error.message
    });
  }
});

module.exports = router; 