const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { Upload } = require('@aws-sdk/lib-storage');
const s3Client = require('../utils/spaces');
const FormSubmission = require('../models/FormSubmission');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
router.post('/', upload.single('pdfFile'), async (req, res) => {
  console.log('=== Form Submission Request Start ===');

  try {
    const {
      role, fullName, phoneNumber, emailAddress, country, city, startupName,
      websiteURL, currentState, lookingFor, companyLinkedIn, foundersLinkedIn,
      industry, problemSolved, startupDescription, targetMarket, numberOfCustomers,
      revenueCurrency, revenueAmount, raisedFunding, fundingCurrency, fundingAmount,
      heardFrom, additionalInfo
    } = req.body;

    let pdfFileUrl = null;

    if (req.file) {
      const fileKey = `pdfs/${uuidv4()}-${req.file.originalname}`;

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.DO_SPACES_BUCKET,
          Key: fileKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: 'public-read',
        },
      });

      await upload.done();

      pdfFileUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileKey}`;
    }

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
      additionalInfo,
      pdfFileUrl
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