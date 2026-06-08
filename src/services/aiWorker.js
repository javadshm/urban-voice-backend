const Submission = require('../models/Submission');
const { processAudio } = require('./aiProcessing');

// Very simple background-style processor for demo purposes.
// It can be called with a submission id when you want async-like behavior.
const processSubmissionInBackground = async (submissionId) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }

  const result = await processAudio(submission.voice_file_path, submission.language);
  return Submission.updateAiResults(
    submission.id,
    result.transcription,
    result.translatedText,
    result.detectedLanguage,
    result.category
  );
};

module.exports = { processSubmissionInBackground };
