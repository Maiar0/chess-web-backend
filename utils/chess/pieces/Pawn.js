const ChessPiece = require('./ChessPiece');

class Pawn extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
    getMoves(board){
        const moves = []; // Array to store possible moves
        const direction = this.color === 'white' ? -1 : 1; // Determine the direction of movement based on color
        const startRank = this.color === 'white' ? 6 : 1; // Starting rank for pawns    
    }
}
module.exports = Pawn; // Export the Pawn class