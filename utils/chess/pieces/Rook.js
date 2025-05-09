const ChessPiece = require('./ChessPiece');

class Rook extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
}
module.exports = Rook; // Export the Rook class