const pool = require('../config/database');

class Response {
  // Create response from authority
  static async create(submissionId, authorityName, responseText) {
    const query = `
      INSERT INTO responses (submission_id, authority_name, response_text, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;
    
    const result = await pool.query(query, [submissionId, authorityName, responseText]);
    return result.rows[0];
  }

  // Get responses for a submission
  static async findBySubmissionId(submissionId) {
    const query = 'SELECT * FROM responses WHERE submission_id = $1 ORDER BY created_at DESC;';
    const result = await pool.query(query, [submissionId]);
    return result.rows;
  }

  // Update response status
  static async updateStatus(responseId, status) {
    const query = `
      UPDATE responses SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [status, responseId]);
    return result.rows[0];
  }
}

module.exports = Response;
