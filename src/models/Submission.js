const pool = require('../config/database');

class Submission {
  // Create new submission
  static async create(userId, voiceFilePath, language, status = 'pending') {
    const query = `
      INSERT INTO submissions (user_id, voice_file_path, language, status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, user_id, voice_file_path, language, status, created_at;
    `;
    
    const result = await pool.query(query, [userId, voiceFilePath, language, status]);
    return result.rows[0];
  }

  // Get submission by ID
  static async findById(id) {
    const query = 'SELECT * FROM submissions WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get all submissions for a user
  static async findByUserId(userId) {
    const query = `
      SELECT s.*, r.response_text, r.authority_name, r.updated_at as response_date
      FROM submissions s
      LEFT JOIN responses r ON s.id = r.submission_id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Update submission status
  static async updateStatus(submissionId, status) {
    const query = `
      UPDATE submissions SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [status, submissionId]);
    return result.rows[0];
  }

  // Update with transcription
  static async updateTranscription(submissionId, originalText, translatedText, detectedLanguage) {
    const query = `
      UPDATE submissions 
      SET transcription = $1, transcription_translated = $2, detected_language = $3, status = 'transcribed', updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
    const result = await pool.query(query, [originalText, translatedText, detectedLanguage, submissionId]);
    return result.rows[0];
  }
}

module.exports = Submission;
