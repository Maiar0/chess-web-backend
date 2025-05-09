const ChessPiece = require('./ChessPiece');

class Queen extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
}
module.exports = Queen; // Export the Rook class