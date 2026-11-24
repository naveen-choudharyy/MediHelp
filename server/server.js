require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketSetup = require('./socket');

// PORT Configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Create HTTP Server
const server = http.createServer(app);

// CORS origin handler supporting localhost and local network devices
const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);

  const configuredClient = (process.env.CLIENT_URL || '').trim().replace(/\/$/, '');
  if (!configuredClient || configuredClient === '*' || origin === configuredClient) {
    return callback(null, true);
  }

  // Allow localhost, loopback, and private network IPs (e.g. 192.168.x.x, 10.x.x.x)
  const isLocalOrLAN = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
  if (isLocalOrLAN || process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }

  return callback(new Error(`CORS blocked Socket.io access from origin ${origin}`));
};

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure signaling and permissions handlers
socketSetup(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
