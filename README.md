# Rentalls Backend API

A simple Express.js backend with TypeScript for user registration.

## Setup

### Installation

```bash
npm install
```

### Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000` by default.

---

## POST /register

Register a new user.

**Request Body:**
```json
{
  "email": "string",
  "fullName": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Code:** 200 OK

### Terminal Example (cURL)

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "fullName": "John Doe",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true
}
```

### Axios Example

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
