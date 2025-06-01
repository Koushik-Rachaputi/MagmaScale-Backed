const express = require('express');
const router = express.Router();
const ProjectEvaluation = require('../models/ProjectEvaluation');
const FormSubmission = require('../models/FormSubmission');

// GET evaluation by project ID
router.get('/:projectId', async (req, res) => {
  console.log('=== GET Evaluation by Project ID Request ===');
  console.log('Project ID:', req.params.projectId);
  const startTime = new Date();

  try {
    const { projectId } = req.params;
    
    // First find the form submission
    console.log('🔍 Searching for form submission...');
    const formSubmission = await FormSubmission.findOne({ projectId });
    if (!formSubmission) {
      console.log('❌ Form submission not found');
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    console.log('✅ Form submission found:', {
      startupName: formSubmission.startupName,
      emailAddress: formSubmission.emailAddress
    });

    // Then find the evaluation
    console.log('🔍 Searching for evaluation...');
    const evaluation = await ProjectEvaluation.findOne({ projectId });
    if (!evaluation) {
      console.log('❌ Evaluation not found');
      return res.status(404).json({
        success: false,
        message: 'No evaluation found for this project'
      });
    }
    console.log('✅ Evaluation found:', {
      projectStatus: evaluation.projectStatus,
      lastUpdated: evaluation.lastUpdated
    });

    // Combine the data
    const responseData = {
      ...evaluation.toObject(),
      projectDetails: {
        startupName: formSubmission.startupName,
        fullName: formSubmission.fullName,
        emailAddress: formSubmission.emailAddress
      }
    };

    const endTime = new Date();
    const duration = endTime - startTime;
    console.log('✅ Request completed successfully');
    console.log('⏱️ Duration:', duration, 'ms');

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    const endTime = new Date();
    const duration = endTime - startTime;
    console.error('❌ Error in GET evaluation:', error);
    console.error('⏱️ Failed after:', duration, 'ms');
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluation',
      error: error.message
    });
  }
});

// POST/PUT endpoint for creating or updating evaluation
router.post('/:projectId', async (req, res) => {
  console.log('=== POST/PUT Evaluation Request ===');
  console.log('Project ID:', req.params.projectId);
  console.log('Update Data:', req.body);
  const startTime = new Date();

  try {
    const { projectId } = req.params;
    const updateData = req.body;

    // Handle status field mapping
    if (updateData.status) {
      updateData.projectStatus = updateData.status;
      delete updateData.status;
    }

    // Verify that the project exists
    console.log('🔍 Verifying project existence...');
    const formSubmission = await FormSubmission.findOne({ projectId });
    if (!formSubmission) {
      console.log('❌ Project not found');
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    console.log('✅ Project verified:', {
      startupName: formSubmission.startupName,
      emailAddress: formSubmission.emailAddress
    });

    // Find existing evaluation or create new one
    console.log('🔍 Checking for existing evaluation...');
    let evaluation = await ProjectEvaluation.findOne({ projectId });

    if (evaluation) {
      console.log('📝 Updating existing evaluation...');
      // Update existing evaluation with new data
      const updatedEvaluation = await ProjectEvaluation.findOneAndUpdate(
        { projectId },
        { 
          $set: {
            ...updateData,
            lastUpdated: new Date()
          }
        },
        { 
          new: true, // Return the updated document
          runValidators: true
        }
      );
      console.log('✅ Evaluation updated successfully');
      evaluation = updatedEvaluation; // Use the returned updated document
    } else {
      console.log('📝 Creating new evaluation...');
      evaluation = new ProjectEvaluation({
        projectId,
        ...updateData
      });
      await evaluation.save();
      console.log('✅ New evaluation created successfully');
    }

    // Combine with form submission data for complete response
    const responseData = {
      ...evaluation.toObject(),
      projectDetails: {
        startupName: formSubmission.startupName,
        fullName: formSubmission.fullName,
        emailAddress: formSubmission.emailAddress
      }
    };

    const endTime = new Date();
    const duration = endTime - startTime;
    console.log('✅ Request completed successfully');
    console.log('⏱️ Duration:', duration, 'ms');
    console.log('📤 Sending response data:', responseData);

    res.status(200).json({
      success: true,
      message: 'Evaluation updated successfully',
      data: responseData
    });
  } catch (error) {
    const endTime = new Date();
    const duration = endTime - startTime;
    console.error('❌ Error in POST/PUT evaluation:', error);
    console.error('⏱️ Failed after:', duration, 'ms');
    res.status(500).json({
      success: false,
      message: 'Error updating evaluation',
      error: error.message
    });
  }
});

// GET all evaluations
router.get('/', async (req, res) => {
  console.log('=== GET All Evaluations Request ===');
  const startTime = new Date();

  try {
    // Get all evaluations
    console.log('🔍 Fetching all evaluations...');
    const evaluations = await ProjectEvaluation.find()
      .sort({ lastUpdated: -1 });
    console.log(`✅ Found ${evaluations.length} evaluations`);

    // Get all form submissions for these evaluations
    const projectIds = evaluations.map(eval => eval.projectId);
    console.log('🔍 Fetching form submissions for', projectIds.length, 'projects...');
    const formSubmissions = await FormSubmission.find({ projectId: { $in: projectIds } });
    console.log(`✅ Found ${formSubmissions.length} form submissions`);

    // Create a map of form submissions for easy lookup
    const formSubmissionMap = formSubmissions.reduce((map, submission) => {
      map[submission.projectId] = submission;
      return map;
    }, {});

    // Combine the data
    console.log('🔄 Combining evaluation and form submission data...');
    const combinedData = evaluations.map(evaluation => ({
      ...evaluation.toObject(),
      projectDetails: formSubmissionMap[evaluation.projectId] ? {
        startupName: formSubmissionMap[evaluation.projectId].startupName,
        fullName: formSubmissionMap[evaluation.projectId].fullName,
        emailAddress: formSubmissionMap[evaluation.projectId].emailAddress
      } : null
    }));

    const endTime = new Date();
    const duration = endTime - startTime;
    console.log('✅ Request completed successfully');
    console.log('⏱️ Duration:', duration, 'ms');

    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: combinedData
    });
  } catch (error) {
    const endTime = new Date();
    const duration = endTime - startTime;
    console.error('❌ Error in GET all evaluations:', error);
    console.error('⏱️ Failed after:', duration, 'ms');
    res.status(500).json({
      success: false,
      message: 'Error fetching evaluations',
      error: error.message
    });
  }
});

module.exports = router; 