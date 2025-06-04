const express = require('express');
const cors = require('cors');

//websocket support
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//import routes
const chessRoutes = require('./routes/chessRoutes.js');
app.use('/api/chess', chessRoutes); // Use the chess routes for API calls

//server setup

//create an HTTP server to support WebSocket connections
const httpServer = http.createServer(app);
//init socket on the HTTP server
const io = new Server(httpServer, { cors: { origin: '*' } });
const initializeSocketHandlers = require('./controllers/chessSocketController.js');
initializeSocketHandlers(io);


// Start the HTTP server (instead of app.listen)
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`HTTP + Socket.IO server listening on port ${PORT}`);
});

/*const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});*/
