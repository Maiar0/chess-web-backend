const ApiError = require('../../../utils/ApiError');

class ChessPiece{
    constructor(color, position) {
        this.color = color; // 'white' or 'black'
        this.position = position; // { x: 0-7, y: 0-7 }
    }
    getPosition() {
        return this.position; // { x: 0-7, y: 0-7 }
    }
    getPositionAlpha() {
        let pos = String.fromCharCode(this.position.x + 97) + (this.position.y + 1); // Convert x to letter (0-7 to a-h), adjust y +1
        return pos; // { a-h, 0-7 }
    }
    setPosition(position) {
        this.position = position; // { x: 0-7, y: 0-7 }
    }
    getColor() {
        return this.color; // 'white' or 'black'
    }
    setColor(color) {
        this.color = color; // 'white' or 'black'
    }
    getMoves(board) {
        // Creates a list of possible moves for the piece
        // Board is an object representing the current state of the chessboard
        // This method should be overridden by subclasses
        throw new ApiError('getMoves() must be implemented in subclasses', 500);
    }
    getPieceType() {
        // Return the type of the piece (e.g., 'pawn', 'rook', etc.)
        // This method should be overridden by subclasses
        throw new ApiError('getPieceType() must be implemented in subclasses', 500);
    }
    getFen() {
        // Return the FEN representation of the piece
        // This method should be overridden by subclasses
        throw new ApiError('getFen() must be implemented in subclasses', 500);
    }
}
module.exports = ChessPiece; // Export the ChessPiece class