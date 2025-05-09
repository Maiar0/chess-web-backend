const ChessPiece = require('./ChessPiece');

class Bishop extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
}
module.exports = Bishop; // Export the Rook class