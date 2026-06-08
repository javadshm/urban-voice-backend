const express = require('express');
const rateLimit = require('express-rate-limit');
const Response = require('../models/Response');
const Submission = require('../models/Submission');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const authorityRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a minute.' }
});

router.use(authorityRateLimit);

// Authority gets pending submissions (simplified - should have proper auth)
router.get('/pending', asyncHandler(async (req, res) => {
  const submissions = await Submission.findPendingForAuthority();
  res.json({ submissions });
}));

// Authority gets one submission details
router.get('/:submissionId', asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  res.json({ submission });
}));

// Authority sends response to submission
router.post('/:submissionId/respond', asyncHandler(async (req, res) => {
  const { authorityName, responseText } = req.body;
  
  if (!authorityName || !responseText) {
    return res.status(400).json({ error: 'Authority name and response text required' });
  }

  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  // Create response
  const response = await Response.create(req.params.submissionId, authorityName, responseText);
  
  // Update submission status
  await Submission.updateStatus(req.params.submissionId, 'responded');

  res.json({
    message: 'Response sent successfully',
    response: response
  });
}));

// Mark submission as handled without sending a detailed text response.
router.post('/:submissionId/mark-handled', asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  await Submission.updateStatus(req.params.submissionId, 'responded');

  res.json({
    message: 'Submission marked as handled'
  });
}));

module.exports = router;
