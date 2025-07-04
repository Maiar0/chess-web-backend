class ChessRequest{
    /**
     * Creates an instance of ChessRequest.
     * @param {string} action - The action to be performed (e.g., 'move', 'promote', etc.).
     * @param {string} gameId - The ID of the chess game.
     * @param {Object} [payload={}] - Additional data related to the action (e.g., from/to coordinates, promotion piece, etc.).
     */
    constructor(action, gameId, payload = {}){
        this.action = action; // The action to be performed (e.g., 'move', 'promote', etc.)
        this.gameId = gameId; // The ID of the chess game
        this.payload = payload; // Additional data related to the action (e.g., from/to coordinates, promotion piece, etc.)
    }
}
module.exports = ChessRequest; // Export the ChessRequest class for use in other modules