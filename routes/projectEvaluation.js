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

    // --- CHECKLIST LOGIC START ---
    let updatedChecklist = [];
    if (evaluation) {
      // Start with the current checklist
      updatedChecklist = evaluation.evaluationChecklist.map(item => ({
        _id: item._id ? item._id.toString() : undefined,
        name: item.name,
        checked: item.checked
      }));
    }

    if (Array.isArray(updateData.checklist)) {
      // Create a map for quick lookup
      const checklistMap = new Map(updatedChecklist.map(item => [item._id, item]));
      // Process each change
      updateData.checklist.forEach(change => {
        if (change.remove) {
          // Remove item by _id
          checklistMap.delete(change._id);
        } else if (checklistMap.has(change._id)) {
          // Update checked state
          const item = checklistMap.get(change._id);
          if (typeof change.checked === 'boolean') item.checked = change.checked;
          if (typeof change.name === 'string') item.name = change.name;
        } else {
          // Add new item
          checklistMap.set(change._id, {
            _id: change._id,
            name: change.name || '',
            checked: !!change.checked
          });
        }
      });
      // Convert back to array
      updatedChecklist = Array.from(checklistMap.values());
    }
    // --- CHECKLIST LOGIC END ---

    if (evaluation) {
      console.log('📝 Updating existing evaluation...');
      // Prepare update operations
      const updateOperations = {
        $set: {
          lastUpdated: new Date()
        }
      };
      // Handle round notes updates separately
      if (updateData.roundNotes) {
        Object.keys(updateData.roundNotes).forEach(round => {
          if (Array.isArray(updateData.roundNotes[round])) {
            // Add each note to the array using $push
            updateData.roundNotes[round].forEach(note => {
              if (!updateOperations.$push) {
                updateOperations.$push = {};
              }
              if (!updateOperations.$push[`roundNotes.${round}`]) {
                updateOperations.$push[`roundNotes.${round}`] = {
                  $each: []
                };
              }
              updateOperations.$push[`roundNotes.${round}`].$each.push({
                text: note.text,
                timestamp: note.timestamp || new Date()
              });
            });
          }
        });
        // Remove roundNotes from updateData as we're handling it separately
        delete updateData.roundNotes;
      }
      // Add other fields to $set
      Object.keys(updateData).forEach(key => {
        if (key !== 'roundNotes' && key !== 'checklist') {
          updateOperations.$set[key] = updateData[key];
        }
      });
      // Always update the checklist if present
      if (Array.isArray(updateData.checklist)) {
        updateOperations.$set.evaluationChecklist = updatedChecklist;
      }
      console.log('📝 Update operations:', updateOperations);
      // Update existing evaluation with new data
      const updatedEvaluation = await ProjectEvaluation.findOneAndUpdate(
        { projectId },
        updateOperations,
        { 
          new: true, // Return the updated document
          runValidators: true
        }
      );
      console.log('✅ Evaluation updated successfully');
      evaluation = updatedEvaluation; // Use the returned updated document
    } else {
      console.log('📝 Creating new evaluation...');
      // If creating, use the checklist if provided
      const newEvalData = {
        projectId,
        ...updateData
      };
      if (Array.isArray(updateData.checklist)) {
        newEvalData.evaluationChecklist = updatedChecklist;
        delete newEvalData.checklist;
      }
      evaluation = new ProjectEvaluation(newEvalData);
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