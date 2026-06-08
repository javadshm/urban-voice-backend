const request = require('supertest');
const express = require('express');

jest.mock('../src/models/Submission', () => ({
  findById: jest.fn(),
  updateAiResults: jest.fn()
}));

jest.mock('../src/services/aiProcessing', () => ({
  processAudio: jest.fn()
}));

const Submission = require('../src/models/Submission');
const { processAudio } = require('../src/services/aiProcessing');
const aiRoutes = require('../src/routes/ai');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', aiRoutes);
  return app;
};

describe('AI routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when submission does not exist', async () => {
    Submission.findById.mockResolvedValue(null);

    const response = await request(buildApp())
      .post('/api/process-submission/1');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Submission not found');
  });

  it('processes submission and updates AI fields', async () => {
    Submission.findById.mockResolvedValue({
      id: 2,
      voice_file_path: '/uploads/demo.wav',
      language: 'en'
    });

    processAudio.mockResolvedValue({
      transcription: 'Broken street light reported',
      translatedText: 'DE: Broken street light reported',
      detectedLanguage: 'en',
      category: 'lighting'
    });

    Submission.updateAiResults.mockResolvedValue({
      id: 2,
      status: 'transcribed',
      issue_category: 'lighting'
    });

    const response = await request(buildApp())
      .post('/api/process-submission/2');

    expect(response.status).toBe(200);
    expect(processAudio).toHaveBeenCalledWith('/uploads/demo.wav', 'en');
    expect(Submission.updateAiResults).toHaveBeenCalledWith(
      2,
      'Broken street light reported',
      'DE: Broken street light reported',
      'en',
      'lighting'
    );
    expect(response.body.submission.status).toBe('transcribed');
  });
});
