# CollabSpace - Real-time Collaborative Workspace

A full-stack real-time collaborative workspace built with Node.js, Express, MongoDB, Socket.io, React, and Tailwind CSS.

## 🚀 Features

- **Real-time Chat**: Instant messaging with Socket.io
- **Collaborative Text Editor**: Rich text editing with Quill.js
- **Drawing Board**: Real-time collaborative drawing with colorful cursors
- **Room System**: Create and join private collaborative rooms with shareable links
- **User Authentication**: JWT-based authentication with bcrypt
- **Live User Presence**: See who's online and typing in real-time
- **Activity Tracking**: Streak counters and activity calendar
- **Analytics Dashboard**: Track points, activities, and collaboration metrics
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Real-time Updates**: Live collaboration on documents and drawings

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


## 🏠 Room System

### Room Creation & Management
- **Create Rooms**: Set up private or public collaborative spaces with custom names and descriptions
- **Shareable Links**: Generate unique room URLs (e.g., `/room/ABC12345`) for easy sharing
- **Room Settings**: Configure member limits (5-50 users), privacy controls, and access permissions
- **Host Controls**: Room creators can manage members, delete rooms, and update settings

### Real-time Collaboration
- **Live Member Tracking**: See who's online in each room with real-time status updates
- **Room-specific Drawing**: Isolated drawing boards per room with persistent canvas state
- **Member Notifications**: Get notified when users join/leave rooms
- **Persistent Rooms**: Rooms persist across sessions with saved drawing data

### Room Features
- **Member Management**: Add/remove members, track online status, view join history
- **Room Dashboard**: View all your rooms, member counts, and activity status
- **Join Links**: Easy sharing with unique room URLs and copy-to-clipboard functionality
- **Privacy Controls**: Private rooms with member-only access and guest restrictions
- **Activity Tracking**: Track collaboration within each room with detailed analytics

### Room API Endpoints
- `POST /api/rooms` - Create a new room
- `GET /api/rooms` - Get user's rooms
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms/:roomId/join` - Join a room
- `POST /api/rooms/:roomId/leave` - Leave a room
- `DELETE /api/rooms/:roomId` - Delete a room (host only)
- `PUT /api/rooms/:roomId/settings` - Update room settings (host only)

### Socket.io Room Events
- `joinRoomById` - Join a specific room
- `leaveRoomById` - Leave a room
- `getRoomMembers` - Get current room members
- `userJoinedRoom` - Broadcast when user joins
- `userLeftRoom` - Broadcast when user leaves
- `roomError` - Handle room-related errors

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

To test collaboration with multiple users:
1. Open multiple browser tabs or different browsers
2. Create/login with different accounts
3. Join the same room
4. Test real-time chat, text editor, and drawing board

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

---

**Happy Collaborating! 🚀**
