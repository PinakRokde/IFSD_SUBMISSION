# Countdown Timer App

A full-stack countdown timer application where users can sign up, log in, and manage personalized event timers with live countdowns.

## Project Structure
```
backend/
  package.json
  server.js
  .env
  config/db.js
  models/User.js
  routes/authRoutes.js
  controllers/authController.js
  middleware/authMiddleware.js
  utils/generateToken.js
frontend/
  package.json
  vite.config.js
  public/index.html
  src/
    main.jsx
    App.jsx
    styles.css
    components/ProtectedRoute.jsx
    pages/{Signup,Login,Home}.jsx
    services/api.js
    context/AuthContext.jsx
```

## Backend Setup
1. Copy `backend/.env` to your own file and add the Mongo connection string you will share:
   ```env
   MONGO_URI=your_mongo_connection_string
   JWT_SECRET=supersecretjwt
   PORT=5000
   ```
2. Install dependencies:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

## Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Vite dev server proxies API calls to the backend (`http://localhost:5000`).

## Features
- Secure JWT-based signup/login with password hashing.
- CRUD operations on countdown timers (create, view, edit, delete).
- Search timers by title or description.
- Real-time countdown display with automatic updates.
- Protected routes via React context and custom `ProtectedRoute` component.

## Additional Notes
- Timers are stored as subdocuments on each user record for simplified ownership.
- Update and delete operations require authentication; tokens are stored in `localStorage` for session persistence.
