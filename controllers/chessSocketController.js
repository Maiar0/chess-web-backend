const {Server} = require('socket.io');
const { get } = require('../routes/chessRoutes');
/**
 * Called from server.js as:
 *    const io = new Server(httpServer, { … });
 *    initializeSocketHandlers(io);
 */
let ioInstance = null;
const playerToSocket = {};

/**
 * Call this from your server startup (server.js) as:
 *    const io = new Server(httpServer, {  …options…  });
 *    initializeSocketHandlers(io);
 *
 * After that, any module can do:
 *    const { io, playerToSocket } = require('./socketController');
 *    // and use io.to(gameId).emit(...) or inspect playerToSocket[playerId]
 */

function initializeSocketHandlers(io) {
  ioInstance = io; // Store the io instance for later use
  // Catch every new socket connection (i.e. handshake is complete)
  io.on('connection', (socket) => {
    console.log(`Handshake complete. Client connected with socket.id = ${socket.id}`);

    // Acknowledge the handshake back to the client (optional)
    // This allows the front end to know “yes, we shook hands.”
    socket.emit('handshakeAck', { success: true });

    //TODO:: register any number of custom events
    //registers player id with the socket.id
    socket.on('registerPlayer', (playerId) => {
      console.log(`Registering playerId="${playerId}" with socket="${socket.id}"`);
      playerToSocket[playerId] = socket.id;
    });

    //add player to namespace gameId
    socket.on('joinGame', (gameId) => {
      console.log(`Socket "${socket.id}" joining room "${gameId}"`);
      socket.join(gameId);
    });

    // Always remember to handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`socket ${socket.id} disconnected (reason: ${reason})`);
      // …clean up any game state if necessary…
      //removes player from playerToSocket
      for (const [pid, sid] of Object.entries(playerToSocket)) {
        if (sid === socket.id) {
          delete playerToSocket[pid];
        }
      }
    });
  });
};

module.exports = {
  initializeSocketHandlers,
  get io() {
    return ioInstance;
  },
  get playerToSocket() {
    return playerToSocket;
  }
};
