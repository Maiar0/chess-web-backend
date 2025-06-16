const ApiError = require('../../../utils/ApiError');

class ChessPiece{//TODO:: Restucture for position?
    /**
     * Creates an instance of a chess piece.
     * @param {'white'|'black'} color - The color of the chess piece.
     * @param {{ x: number, y: number }} position - The position of the piece on the board (0-7 for both x and y).
     */
    constructor(color, position) {
        this.color = color; // 'white' or 'black'
        this.position = position; // { x: 0-7, y: 0-7 }
    }
    /**
     * Returns the current position of the chess piece on the board.
     * @returns {{x: number, y: number}} The position object with x and y coordinates (0-7).
     */
    getPosition() {
        return this.position; // { x: 0-7, y: 0-7 }
    }
    /**
     * Returns the current position of the chess piece in algebraic notation.
     * Converts the x coordinate (0-7) to a letter (a-h) and the y coordinate (0-7) to a number (1-8).
     *
     * @returns {string} The position in algebraic notation (e.g., "e4").
     */
    getPositionAlpha() {
        let pos = String.fromCharCode(this.position.x + 97) + (this.position.y + 1); // Convert x to letter (0-7 to a-h), adjust y +1
        return pos; // { a-h, 0-7 }
    }
   
    /**
     * Generates a list of possible moves for the chess piece.
     * This method should be overridden by subclasses to provide specific move logic.
     *
     * @param {Object} board - The current state of the chessboard.
     * @throws {ApiError} Throws an error if not implemented in a subclass.
     * @returns {Array} An array of possible moves for the piece.
     */
    getMoves(board) {
        // Creates a list of possible moves for the piece
        // Board is an object representing the current state of the chessboard
        // This method should be overridden by subclasses
        throw new ApiError('getMoves() must be implemented in subclasses', 500);
    }
    /**
     * Returns the type of the chess piece (e.g., 'pawn', 'rook', etc.).
     * This method should be overridden by subclasses to provide the specific piece type.
     * @throws {ApiError} If not implemented in a subclass.
     * @returns {string} The type of the chess piece.
     */
    getPieceType() {
        // Return the type of the piece (e.g., 'pawn', 'rook', etc.)
        // This method should be overridden by subclasses
        throw new ApiError('getPieceType() must be implemented in subclasses', 500);
    }
    /**
     * Returns the FEN (Forsyth-Edwards Notation) representation of the chess piece.
     * This method should be implemented by subclasses to provide the correct FEN symbol.
     * 
     * @throws {ApiError} If the method is not implemented in a subclass.
     * @returns {string} The FEN representation of the piece.
     */
    getFen() {
        // Return the FEN representation of the piece
        // This method should be overridden by subclasses
        throw new ApiError('getFen() must be implemented in subclasses', 500);
    }
}
module.exports = ChessPiece; // Export the ChessPiece class