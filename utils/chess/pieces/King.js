const ChessPiece = require('./ChessPiece');

class King extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
    getFen() {
        return this.color === 'white' ? 'K' : 'k'; // Return the FEN representation of the piece
    }
}
module.exports = King; // Export the Rook class