# Rentalls Backend API

A simple Express.js backend with TypeScript for user registration and authentication using Firebase Admin SDK.

## Setup

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following Firebase configuration:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Firebase Web API Key (for login authentication)
FIREBASE_WEB_API_KEY=your-web-api-key

# Optional: Email verification redirect URL
EMAIL_VERIFICATION_REDIRECT_URL=http://localhost:3000/email-verified

# Server Configuration
PORT=3000
NODE_ENV=development
```

**How to get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Extract the following values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)
7. Go to Project Settings → General tab
8. Scroll down to "Your apps" section and find the "Web API Key" → `FIREBASE_WEB_API_KEY`

**Important:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

### Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000` by default.

---

## API Endpoints

### POST /register

Register a new user with Firebase Authentication.

#### Request Body

```json
{
  "email": "string",
  "fullName": "string",
  "password": "string"
}
```

**Validation Rules:**
- Email must be in valid format
- Password must be at least 6 characters long
- All fields (email, fullName, password) are required

#### Responses

**Success (201 Created):**
```json
{
  "success": true,
  "userId": "firebase-uid",
  "emailVerified": false,
  "message": "User registered successfully. Please check your email for verification."
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

**Error (409 Conflict):**
```json
{
  "success": false,
  "message": "User with email user@example.com already exists"
}
```

#### Terminal Usage

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "fullName": "John Doe",
    "password": "password123"
  }'
```

#### Axios Usage

```javascript
import axios from 'axios';

async function registerUser(email, fullName, password) {
  try {
    const response = await axios.post('http://localhost:3000/register', {
      email: email,
      fullName: fullName,
      password: password
    });
    
    if (response.data.success) {
      console.log('Registration successful!');
      return response.data;
    }
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
  }
}

// Usage
registerUser('user@example.com', 'John Doe', 'password123');
```

---

### POST /login

Login with email and password.

#### Request Body

```json
{
  "email": "string",
  "password": "string"
}
```

**Validation Rules:**
- Email must be in valid format
- Email and password are required

#### Responses

**Success (200 OK):**
```json
{
  "success": true,
  "userId": "firebase-uid",
  "emailVerified": true,
  "token": "firebase-id-token"
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "Email address has not been verified"
}
```

#### Terminal Usage

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Axios Usage

```javascript
import axios from 'axios';

async function loginUser(email, password) {
  try {
    const response = await axios.post('http://localhost:3000/login', {
      email: email,
      password: password
    });
    
    if (response.data.success) {
      console.log('Login successful!');
      console.log('Token:', response.data.token);
      return response.data;
    }
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
  }
}

// Usage
loginUser('user@example.com', 'password123');
```

---

### POST /verify-email

Verify a user's email address by UID.

#### Request Body

```json
{
  "uid": "firebase-user-uid"
}
```

#### Responses

**Success (200 OK):**
```json
{
  "success": true,
  "emailVerified": true,
  "message": "Email verified successfully"
}
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found: uid"
}
```

#### Terminal Usage

```bash
curl -X POST http://localhost:3000/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "abc123xyz"
  }'
```

#### Axios Usage

```javascript
import axios from 'axios';

async function verifyEmail(uid) {
  try {
    const response = await axios.post('http://localhost:3000/verify-email', {
      uid: uid
    });
    
    if (response.data.success) {
      console.log('Email verified successfully!');
      return response.data;
    }
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
  }
}

// Usage
verifyEmail('abc123xyz');
```
