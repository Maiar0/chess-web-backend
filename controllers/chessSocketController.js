/**
 * Called from server.js as:
 *    const io = new Server(httpServer, { … });
 *    initializeSocketHandlers(io);
 */
module.exports = function initializeSocketHandlers(io) {
  // Catch every new socket connection (i.e. handshake is complete)
  io.on('connection', (socket) => {
    console.log(`Handshake complete. Client connected with socket.id = ${socket.id}`);

    // Acknowledge the handshake back to the client (optional)
    //    This allows the front end to know “yes, we shook hands.”
    socket.emit('handshakeAck', { success: true });

    //TODO:: register any number of custom events

    // Always remember to handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`socket ${socket.id} disconnected (reason: ${reason})`);
      // …clean up any game state if necessary…
    });
  });
};
