@echo off
cd server
set PORT=5000
set MONGO_URI=mongodb://localhost:27017/collabspace
set JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
set FRONTEND_URL=http://localhost:5173
node server.js
pause
