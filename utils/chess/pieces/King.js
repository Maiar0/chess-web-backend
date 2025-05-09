const ChessPiece = require('./ChessPiece');

class King extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
}
module.exports = King; // Export the Rook class