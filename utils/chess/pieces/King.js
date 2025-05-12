const ChessPiece = require('./ChessPiece');

class King extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
    getMoves(board) {
        return []; // Return an empty array for now, as the move logic is not implemented
    }
    getFen() {
        return this.color === 'white' ? 'K' : 'k'; // Return the FEN representation of the piece
    }
}
module.exports = King; // Export the Rook class