const express = require('express');
const router = express.Router();
// const { upload, saveSmallFile, SMALL_FILE_LIMIT } = require('../utils/fileStorage');
const FormSubmission = require('../models/FormSubmission');

// GET endpoint for retrieving form submissions
router.get('/', async (req, res) => {
  try {
    // Get query parameters for column filtering
    const { fields } = req.query;
    
    // If fields parameter is provided, split it into an array
    const selectedFields = fields ? fields.split(',') : null;
    
    // Create projection object for MongoDB
    const projection = selectedFields ? 
      selectedFields.reduce((acc, field) => {
        acc[field.trim()] = 1;
        return acc;
      }, {}) : null;

    // Query the database with optional projection
    const submissions = await FormSubmission.find({}, projection)
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching form submissions',
      error: error.message
    });
  }
});

// POST endpoint for form submission
router.post('/', async (req, res) => {
  console.log('=== Form Submission Request Start ===');
  
  try {
    const {
      role, fullName, phoneNumber, emailAddress, country, city, startupName,
      websiteURL, currentState, lookingFor, companyLinkedIn, foundersLinkedIn,
      industry, problemSolved, startupDescription, targetMarket, numberOfCustomers,
      revenueCurrency, revenueAmount, raisedFunding, fundingCurrency, fundingAmount,
      heardFrom, additionalInfo
    } = req.body;

    // Create new form submission
    const newForm = new FormSubmission({
      role,
      fullName,
      phoneNumber,
      emailAddress,
      country,
      city,
      startupName,
      websiteURL,
      currentState,
      lookingFor,
      companyLinkedIn,
      foundersLinkedIn,
      industry,
      problemSolved,
      startupDescription,
      targetMarket,
      numberOfCustomers,
      revenueCurrency,
      revenueAmount,
      raisedFunding: raisedFunding === 'true',
      fundingCurrency,
      fundingAmount,
      heardFrom,
      additionalInfo
    });

    // Save the form submission
    await newForm.save();
    console.log('Form submission saved successfully');

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: newForm.toObject()
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting form',
      error: error.message
    });
  }
});

module.exports = router; 