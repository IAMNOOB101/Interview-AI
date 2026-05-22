# Interview AI - Database Schema & Feature Updates

## Summary of Changes

This document outlines all the changes made to fix the reported issues.

### 1. Login Page Text Update (COMPLETED ✓)
- **File**: `frontend/src/pages/Login.jsx`
- **Changes**: 
  - Changed "Sign In" button text to "Login"
  - Changed heading text from "Sign in to continue..." to "Login to continue..."
  - Changed loading text from "Signing in…" to "Logging in…"
- **Status**: Complete

### 2. Resume Upload During Signup (COMPLETED ✓)
- **Files Modified**:
  - `backend/package.json` - Added Cloudinary and form-data dependencies
  - `backend/services/cloudinary.service.js` - NEW: Cloudinary integration for PDF storage
  - `backend/services/resumeParser.js` - Enhanced to extract detailed resume information
  - `backend/controllers/auth.controller.js` - Added resume upload and parsing in signup
  - `backend/routes/auth.routes.js` - Already configured with multer for file uploads
  - `frontend/src/pages/Signup.jsx` - Added resume upload field in Step 0
  - `frontend/src/pages/InterviewSetup.jsx` - Added resume update option before interview

- **Features Implemented**:
  - Users can upload PDF resumes during signup (optional)
  - Resume is automatically uploaded to Cloudinary
  - Resume text is automatically parsed and analyzed
  - Extracted information includes: skills, experience, projects, education, certifications
  - Auto-extracted data tailors interview questions

- **Database Fields**:
  - `User.resumeURL` - URL to resume stored in Cloudinary
  - `User.resumeData` - Extracted information from resume (JSONB)

### 3. Resume Upload Before Interview (COMPLETED ✓)
- **File**: `frontend/src/pages/InterviewSetup.jsx`
- **Features**:
  - Users can upload an updated resume before starting the interview
  - Resume is uploaded to Cloudinary via `/api/resume/upload` endpoint
  - Updated resume automatically tailors interview questions

### 4. Tailored Interview Questions (COMPLETED ✓)
- **Implementation**: Already working
- **How it works**:
  - Interview questions are generated based on:
    - User's resume content (parsed text)
    - Target domain/role selected
    - Experience level
    - Expected salary range
  - Questions are progressively adapted based on answer quality
- **Files**: `backend/controllers/session.controller.js`, `backend/services/gemini.service.js`

### 5. Camera & Microphone Preview (COMPLETED ✓)
- **File**: `frontend/src/pages/Interview.jsx`
- **Features**:
  - NEW PREVIEW STATE: Users now see a preview screen before starting the interview
  - Camera and microphone feed is displayed live
  - Audio level indicator shows real-time microphone activity:
    - 🟢 Green (Quiet): Volume < 40
    - 🟡 Yellow (Good): Volume 40-70
    - 🔴 Red (Loud): Volume > 70
  - Users can test camera and microphone before proceeding
  - Prevents starting interview with non-functional camera/mic
- **States Added**: `PREVIEW` state before `IDLE` state

### 6. Camera Access Cleanup (COMPLETED ✓)
- **File**: `frontend/src/pages/Interview.jsx`
- **Features**:
  - Media stream tracks are now properly stopped when:
    - Interview is completed (interview navigates to report)
    - Component is unmounted
  - Audio monitoring animation frame is properly canceled
  - Video element source is cleared
  - Camera/microphone LED indicator is turned off
- **Implementation**:
  - Added cleanup effect with `mediaStream.getTracks().forEach(track => track.stop())`
  - Added animation frame cancellation
  - Proper state management for permGranted flag

## Environment Variables Required

Add the following to your `.env` file for Cloudinary integration:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these values from: https://cloudinary.com/console

## Database Schema Changes

The `users` table already has these fields (no migration needed):
```sql
resumeURL VARCHAR - URL to PDF stored in Cloudinary
resumeData JSONB - Extracted resume information
```

The resumeData JSONB structure:
```json
{
  "rawText": "Full resume text...",
  "skills": "Skills section extracted...",
  "experience": "Work experience section...",
  "projects": "Projects section...",
  "education": "Education section...",
  "certifications": "Certifications section..."
}
```

## API Endpoints Added/Modified

### Upload Resume (Authenticated)
```
POST /api/resume/upload
Content-Type: multipart/form-data
Body: { resume: File }
Response: { resumeURL, extractedInfo }
```

### Get Resume (Authenticated)
```
GET /api/resume/
Response: { resumeURL, resumeData }
```

### Register with Resume
```
POST /api/auth/register
Content-Type: multipart/form-data
Body: { firstName, lastName, email, password, accountType, domain, role, experience, desiredSalary, resume (optional) }
Response: { message }
```

## Installation Steps

1. **Install dependencies**:
```bash
cd backend
npm install
cd ../frontend
npm install
```

2. **Update environment variables**:
   - Add Cloudinary credentials to backend `.env`

3. **Run migrations** (if needed):
```bash
cd backend
npm run seed  # Applies migrations via sequelize.sync({ alter: true })
```

4. **Start the application**:
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

## Testing the Features

### Test Resume Upload in Signup
1. Navigate to `/signup`
2. Fill in account details
3. Click "Upload Resume (Optional, PDF only)"
4. Select a PDF file
5. Proceed to step 2 - notice domain/role might be auto-filled
6. Complete signup
7. Login and verify resume was stored

### Test Interview Preview
1. Login and go to `/setup`
2. Configure interview settings
3. Click "Save & Continue"
4. You should see the Camera & Microphone Preview screen
5. Verify you can see your camera feed
6. Try speaking and watch the audio level bar animate
7. Click "Proceed to Interview" to continue

### Test Camera Cleanup
1. Start an interview
2. Answer a few questions until completion
3. After completion, check browser DevTools → Application → Camera
4. Camera indicator should show "No Access" indicating cleanup was successful

## Resume Parsing Logic

The resume parser extracts information by looking for keywords in the PDF:

- **Skills**: "skills", "technical skills", "core competencies"
- **Experience**: "experience", "work experience", "professional experience"
- **Projects**: "projects", "key projects"
- **Education**: "education", "qualifications"
- **Certifications**: "certifications", "certificates", "achievements", "awards"

Each section extracts up to 1000 characters of context after the keyword.

## File Upload Limits

- **Max file size**: 5MB
- **Accepted format**: PDF only
- **Storage**: Cloudinary (secure cloud storage)
- **Validation**: Both frontend (client-side) and backend (server-side)

## Error Handling

### Signup Resume Upload
- Invalid file type: "Only PDF files are allowed"
- File too large: "File size must be less than 5MB"
- Upload failure: "Failed to upload resume"
- Parse failure: Continues without error (resume URL is saved)

### Interview Microphone Test
- Camera/mic not granted: Shows placeholder with error message
- User can still proceed as guest but interview might fail

## Future Enhancements

1. Resume parsing with AI (use Claude/GPT to extract skills and experience levels)
2. Automatic skill matching for role suggestions
3. Resume comparison tool to track improvement
4. Multi-language resume support
5. Video recording of interview for later review
6. Real-time transcript generation

## Notes

- Resume uploads are queued with Cloudinary for processing
- Extracted resume data is stored in database for quick reference
- Interview questions consider resume content as context
- All file uploads are encrypted in transit and at rest
- User data is isolated and secure

