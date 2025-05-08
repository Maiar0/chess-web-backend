const { ChessPiece } = require('./ChessPiece');

class Pawn extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
    getMoves(board){
        
    }
}