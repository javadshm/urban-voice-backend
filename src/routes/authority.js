const express = require('express');
const Response = require('../models/Response');
const Submission = require('../models/Submission');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Authority gets pending submissions (simplified - should have proper auth)
router.get('/pending', asyncHandler(async (req, res) => {
  // TODO: Implement authority authentication
  // For now, this is a placeholder
  res.json({ message: 'Get pending submissions for authority' });
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

module.exports = router;
