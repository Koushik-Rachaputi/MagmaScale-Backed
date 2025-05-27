const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { Upload } = require('@aws-sdk/lib-storage');
const s3Client = require('../utils/spaces');
const FormSubmission = require('../models/FormSubmission');

const router = express.Router();
const storage = multer.memoryStorage();

// Configure multer with file size limit and file type filter
const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB in bytes
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.ms-powerpoint' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and PPT files are allowed!'), false);
    }
  }
});

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
  const uploadStartTime = new Date();
  const submissionTimestamp = new Date();

  try {
    const {
      role, fullName, phoneNumber, emailAddress, country, city, startupName,
      websiteURL, currentState, lookingFor, companyLinkedIn, foundersLinkedIn,
      industry, problemSolved, startupDescription, targetMarket, numberOfCustomers,
      revenueCurrency, revenueAmount, raisedFunding, fundingCurrency, fundingAmount,
      heardFrom, additionalInfo, pitchDeck
    } = req.body;

    let pdfFileUrl = null;
    let uploadLog = {
      success: false,
      fileName: req.file ? req.file.originalname : null,
      fileSize: req.file ? req.file.size : null,
      fileType: req.file ? req.file.mimetype : null,
      startTime: uploadStartTime,
      endTime: null,
      duration: null,
      error: null
    };

    if (req.file) {
      // Validate file size
      if (req.file.size > 30 * 1024 * 1024) {
        const error = new Error('File size exceeds 30MB limit');
        uploadLog = {
          ...uploadLog,
          endTime: new Date(),
          duration: new Date() - uploadStartTime,
          error: error.message
        };
        throw error;
      }

      console.log(`📁 Starting file upload for: ${req.file.originalname}`);
      console.log(`📊 File details - Size: ${(req.file.size / (1024 * 1024)).toFixed(2)}MB, Type: ${req.file.mimetype}`);
      
      const fileKey = `pdfs/${uuidv4()}-${req.file.originalname}`;
      console.log(`🔑 Generated file key: ${fileKey}`);

      try {
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
        const uploadEndTime = new Date();
        const uploadDuration = uploadEndTime - uploadStartTime;

        pdfFileUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileKey}`;
        
        uploadLog = {
          ...uploadLog,
          success: true,
          endTime: uploadEndTime,
          duration: uploadDuration,
          fileUrl: pdfFileUrl
        };

        console.log(`✅ File upload successful - Duration: ${uploadDuration}ms`);
        console.log(`🔗 File URL: ${pdfFileUrl}`);
      } catch (uploadError) {
        uploadLog = {
          ...uploadLog,
          endTime: new Date(),
          duration: new Date() - uploadStartTime,
          error: uploadError.message
        };
        
        console.error('❌ File upload failed:', uploadError);
        console.error('📝 Upload details:', uploadLog);
        throw uploadError;
      }
    } else {
      console.log('ℹ️ No file was uploaded with this submission');
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
      pitchDeck,
      pdfFileUrl,
      uploadLog,
      submissionDate: submissionTimestamp
    });

    // Save the form submission
    await newForm.save();
    console.log('✅ Form submission saved successfully');
    console.log('📅 Submission timestamp:', submissionTimestamp.toISOString());
    console.log('📝 Upload log:', uploadLog);

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        ...newForm.toObject(),
        submissionDate: submissionTimestamp,
        createdAt: newForm.createdAt,
        updatedAt: newForm.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error in form submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting form',
      error: error.message
    });
  }
});

module.exports = router;