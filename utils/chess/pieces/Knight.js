const ChessPiece = require('./ChessPiece');

class Knight extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
}
module.exports = Knight; // Export the Rook class