const express = require('express');
const multer = require('multer');
const path = require('path');
const Submission = require('../models/Submission');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadToS3 } = require('../services/storage');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Upload voice submission
router.post('/upload', auth, upload.single('voice'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No voice file provided' });
  }

  const { language } = req.body;
  if (!language) {
    return res.status(400).json({ error: 'Language is required' });
  }

  // Upload to S3
  const safeOriginalName = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `submissions/${req.userId}/${Date.now()}-${safeOriginalName}`;
  const s3Path = await uploadToS3(req.file.buffer, fileName);

  // Create submission in database
  const submission = await Submission.create(req.userId, s3Path, language, 'processing');

  res.status(201).json({
    message: 'Voice submitted successfully',
    submission: submission
  });
}));

// Get submission status
router.get('/:submissionId', auth, asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  // Check authorization
  if (submission.user_id !== req.userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  res.json({ submission });
}));

// Get all submissions for user
router.get('/', auth, asyncHandler(async (req, res) => {
  const submissions = await Submission.findByUserId(req.userId);
  res.json({ submissions });
}));

module.exports = router;
