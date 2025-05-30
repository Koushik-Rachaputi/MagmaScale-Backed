const express = require('express');
const router = express.Router();
const ProjectEvaluation = require('../models/ProjectEvaluation');
const FormSubmission = require('../models/FormSubmission');

// GET evaluation by project ID
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const evaluation = await ProjectEvaluation.findOne({ projectId })
      .populate('projectId', 'startupName fullName emailAddress');
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'No evaluation found for this project'
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
router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    // Verify that the project exists
    const formSubmission = await FormSubmission.findOne({ projectId });
    if (!formSubmission) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find existing evaluation or create new one
    let evaluation = await ProjectEvaluation.findOne({ projectId });

    if (evaluation) {
      // Update existing evaluation
      evaluation = await ProjectEvaluation.findOneAndUpdate(
        { projectId },
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
        projectId,
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
      .populate('projectId', 'startupName fullName emailAddress')
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