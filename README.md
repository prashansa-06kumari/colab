# CollabSpace - Real-time Collaborative Workspace

A full-stack real-time collaborative workspace built with Node.js, Express, MongoDB, Socket.io, React, and Tailwind CSS.

## 🚀 Features

- **Real-time Chat**: Instant messaging with Socket.io
- **Collaborative Text Editor**: Rich text editing with Quill.js
- **User Authentication**: JWT-based authentication with bcrypt
- **Live User Presence**: See who's online and typing
- **Multi-User Testing**: Tab-isolated sessions for testing multiple users
- **User Switching**: Quick switch between different users for testing
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Real-time Updates**: Live collaboration on documents

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io for live communication
- **API**: RESTful API with proper error handling
- **Security**: CORS, input validation, and authentication middleware

### Frontend (React + Vite)
- **State Management**: React Context for authentication
- **Real-time**: Socket.io client for live updates
- **UI**: Tailwind CSS for responsive design
- **Editor**: Quill.js for rich text editing
- **Routing**: React Router for navigation

## 📁 Project Structure

```
collabspace/
├── server/                 # Backend
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Authentication middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── server.js         # Main server file
│   └── package.json      # Backend dependencies
├── client/               # Frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React Context
│   │   ├── pages/        # Page components
│   │   ├── services/     # API and Socket services
│   │   └── styles/       # CSS styles
│   └── package.json     # Frontend dependencies
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd collabspace
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file with your configuration
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/collabspace
# JWT_SECRET=your_super_secret_jwt_key_here
# FRONTEND_URL=http://localhost:5173

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to client directory (in a new terminal)
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Database Setup

Make sure MongoDB is running:
- **Local MongoDB**: Start MongoDB service
- **MongoDB Atlas**: Use your connection string in `.env`

## 🚀 Running the Application

1. **Start Backend**: `cd server && npm run dev`
2. **Start Frontend**: `cd client && npm run dev`
3. **Open Browser**: Navigate to `http://localhost:5173`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Messages
- `GET /api/messages/:roomId` - Get room messages
- `POST /api/messages` - Send message (protected)
- `DELETE /api/messages/:messageId` - Delete message (protected)

### Board
- `GET /api/board/:roomId` - Get board content
- `PUT /api/board/:roomId` - Update board content (protected)
- `DELETE /api/board/:roomId` - Clear board (protected)

## 🔌 Socket.io Events

### Client → Server
- `joinRoom` - Join a room
- `leaveRoom` - Leave current room
- `sendMessage` - Send chat message
- `textChange` - Send text editor changes
- `draw` - Send drawing changes
- `cursorMove` - Send cursor position
- `typing` - Send typing indicator

### Server → Client
- `newMessage` - New chat message
- `textChanged` - Text editor updated
- `drawingChanged` - Drawing updated
- `userJoined` - User joined room
- `userLeft` - User left room
- `userTyping` - User typing indicator
- `userCursorMove` - User cursor position

## 🎨 Features in Detail

### Real-time Chat
- Instant message delivery
- User presence indicators
- Typing indicators
- Message history
- Auto-scroll to new messages

### Collaborative Editor
- Rich text editing with Quill.js
- Real-time content synchronization
- Live cursor tracking
- Auto-save functionality
- Collaborative formatting

### User Management
- Secure JWT authentication
- Password hashing with bcrypt
- Protected routes
- User session management

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation
- Protected API routes
- Secure socket authentication

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use cloud MongoDB
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🧪 Multi-User Testing

### Testing Real-time Collaboration

CollabSpace now supports easy multi-user testing with tab-isolated sessions:

#### **Method 1: Multiple Browser Tabs**
1. **Open multiple tabs** of `http://localhost:5173`
2. **Each tab has isolated sessions** (using sessionStorage)
3. **Login with different users** in each tab
4. **Test real-time collaboration** between users

#### **Method 2: User Switching**
1. **Use the "Switch User" button** in the navbar
2. **Quick switch between predefined test users**:
   - Alice Johnson (alice@test.com)
   - Bob Smith (bob@test.com)
   - Charlie Brown (charlie@test.com)
   - Diana Prince (diana@test.com)
   - Eve Wilson (eve@test.com)
3. **All test users use password: `password123`**

#### **Method 3: Setup Test Users**
```bash
# Run the setup script to create test users
node setup-test-users.js
```

#### **Testing Features**
- ✅ **Real-time chat** between multiple users
- ✅ **Collaborative text editing** with live updates
- ✅ **User presence** showing who's online
- ✅ **Message CRUD operations** (edit/delete)
- ✅ **Session isolation** between tabs

### Development Mode
- **Dev Mode Indicator** shows in bottom-left corner
- **Session isolation** prevents cross-tab interference
- **Quick user switching** for efficient testing

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string in `.env`

2. **Socket.io Connection Failed**
   - Check CORS configuration
   - Verify frontend URL in backend `.env`

3. **Authentication Issues**
   - Check JWT_SECRET in `.env`
   - Verify token in sessionStorage (not localStorage)

4. **Port Conflicts**
   - Backend runs on port 5000
   - Frontend runs on port 5173
   - Change ports in configuration if needed

5. **Multi-User Testing Issues**
   - Each tab uses sessionStorage for isolation
   - Use "Switch User" button for quick testing
   - Check console logs for user join/leave events

### Getting Help

- Check the console for error messages
- Verify all environment variables are set
- Ensure all dependencies are installed
- Check MongoDB connection status

## 🎯 Future Enhancements

- [ ] File sharing capabilities
- [ ] Video/audio calls
- [ ] Drawing canvas integration
- [ ] Document version history
- [ ] User roles and permissions
- [ ] Multiple rooms support
- [ ] Message reactions
- [ ] Push notifications
- [ ] Mobile app
- [ ] Advanced collaboration features

---

**Happy Collaborating! 🚀**
