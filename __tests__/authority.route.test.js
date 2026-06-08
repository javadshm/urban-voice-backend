const request = require('supertest');
const express = require('express');

jest.mock('../src/models/Submission', () => ({
  findById: jest.fn(),
  findPendingForAuthority: jest.fn(),
  updateStatus: jest.fn()
}));

jest.mock('../src/models/Response', () => ({
  create: jest.fn()
}));

const Submission = require('../src/models/Submission');
const Response = require('../src/models/Response');
const authorityRoutes = require('../src/routes/authority');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/authority', authorityRoutes);
  return app;
};

describe('Authority routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns pending submissions', async () => {
    Submission.findPendingForAuthority.mockResolvedValue([{ id: 1, status: 'processing' }]);

    const response = await request(buildApp())
      .get('/api/authority/pending');

    expect(response.status).toBe(200);
    expect(response.body.submissions).toHaveLength(1);
  });

  it('creates response and marks submission as responded', async () => {
    Submission.findById.mockResolvedValue({ id: 5 });
    Response.create.mockResolvedValue({ id: 9 });
    Submission.updateStatus.mockResolvedValue({ id: 5, status: 'responded' });

    const response = await request(buildApp())
      .post('/api/authority/5/respond')
      .send({ authorityName: 'City', responseText: 'We will fix this today.' });

    expect(response.status).toBe(200);
    expect(Response.create).toHaveBeenCalledWith('5', 'City', 'We will fix this today.');
    expect(Submission.updateStatus).toHaveBeenCalledWith('5', 'responded');
  });

  it('marks a submission handled', async () => {
    Submission.findById.mockResolvedValue({ id: 7 });
    Submission.updateStatus.mockResolvedValue({ id: 7, status: 'responded' });

    const response = await request(buildApp())
      .post('/api/authority/7/mark-handled')
      .send({ authorityName: 'City' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Submission marked as handled');
    expect(Submission.updateStatus).toHaveBeenCalledWith('7', 'responded');
  });
});
