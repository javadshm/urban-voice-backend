# Urban Voice Backend 🎤

**Civic issue reporting via voice submissions with AI-powered analysis and multilingual support.**

## Overview

This is the backend API for the Urban Voice hackathon project. It handles:
- ✅ User registration & authentication
- ✅ Voice file uploads & storage
- ✅ Submission tracking & status management
- ✅ Authority routing & response management
- ✅ Integration points for AI processing

## Quick Start

### Prerequisites
- Node.js 16+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- AWS S3 credentials (optional for local dev)

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/javadshm/urban-voice-backend.git
   cd urban-voice-backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run with Docker** (Recommended)
   ```bash
   docker-compose up --build
   ```
   - Backend API: http://localhost:5000
   - Database: localhost:5432
   - Frontend app: http://localhost:3000
   - Authority dashboard: http://localhost:3001

4. **Run Locally**
   ```bash
   # Ensure PostgreSQL is running
   npm run migrate  # Run migrations
   npm run dev      # Start dev server
   ```

## API Endpoints

### Authentication
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
GET    /api/auth/me           - Get current user (requires token)
```

### Submissions
```
POST   /api/submissions/upload   - Upload voice submission (requires token)
GET    /api/submissions          - Get all user submissions (requires token)
GET    /api/submissions/:id      - Get submission details (requires token)
```

### Authority
```
GET    /api/authority/pending                    - Get pending submissions
GET    /api/authority/:submissionId              - Get one submission details
POST   /api/authority/:submissionId/respond  - Send response to submission
POST   /api/authority/:submissionId/mark-handled - Mark submission handled
```

### AI Processing (Mock)
```
POST   /api/process-submission/:submissionId - Run mock transcription/translation/category
```

## Database Schema

```
users
  ├─ id (PK)
  ├─ email (UNIQUE)
  ├─ password
  ├─ full_name
  ├─ phone
  └─ native_language

submissions
  ├─ id (PK)
  ├─ user_id (FK)
  ├─ voice_file_path
  ├─ language
  ├─ transcription
  ├─ transcription_translated
  ├─ detected_language
  ├─ status
  ├─ issue_category
  └─ created_at

responses
  ├─ id (PK)
  ├─ submission_id (FK)
  ├─ authority_name
  ├─ response_text
  └─ status
```

## Team Integration

### Frontend Team (Person 1)
- Use `/api/auth/register` and `/api/auth/login`
- Use `/api/submissions/upload` for voice uploads
- Use `/api/submissions` to fetch user's submissions
- Use `/api/submissions/:id` to check status

### AI Team (Person 3)
- Will implement `/src/services/aiProcessing.js`
- Should update submission transcription via `Submission.updateTranscription()`
- Should update status to 'transcribed', 'categorized'

### Authority Integration (Person 4)
- Will use `/api/authority/pending` to fetch submissions
- Will use `/api/authority/:submissionId/respond` to send responses
- Should implement proper authority authentication

### DevOps (Person 5)
- Use `docker-compose.yml` for local deployment
- Configure environment variables in `.env`
- Set up CI/CD pipeline for GitHub
- Deploy to cloud infrastructure (AWS, Heroku, etc.)

## Example Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123",
    "fullName": "Jane Doe",
    "phone": "+43123456789",
    "nativeLanguage": "de"
  }'
```

### Upload Voice Submission
```bash
curl -X POST http://localhost:5000/api/submissions/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "voice=@/path/to/audio.wav" \
  -F "language=de"
```

## Development Notes

- All sensitive data should be in `.env` (never commit!)
- Use `npm run dev` for hot-reload during development
- Check database directly: `psql -h localhost -U postgres -d urban_voice_db`
- Logs are printed to console in development

## Next Steps

1. ✅ Backend scaffold complete
2. ✅ Beginner-friendly frontend included in `frontend/`
3. ✅ Mock AI processing endpoint included in `src/routes/ai.js`
4. ✅ Authority dashboard included in `authority-dashboard/`
5. 🔄 Optional: replace mock AI with real cloud AI services

## Support

Reach out to the Backend Lead (Person 2) for questions!

---

**Made with ❤️ for Urban Voice Hackathon**
