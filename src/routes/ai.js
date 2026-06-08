const express = require('express');
const Submission = require('../models/Submission');
const { asyncHandler } = require('../middleware/errorHandler');
const { processAudio } = require('../services/aiProcessing');

const router = express.Router();

// Process a submission using mock AI services.
router.post('/process-submission/:submissionId', asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const aiResult = await processAudio(submission.voice_file_path, submission.language);
  const updatedSubmission = await Submission.updateAiResults(
    submission.id,
    aiResult.transcription,
    aiResult.translatedText,
    aiResult.detectedLanguage,
    aiResult.category
  );

  res.json({
    message: 'Submission processed successfully',
    submission: updatedSubmission
  });
}));

module.exports = router;
