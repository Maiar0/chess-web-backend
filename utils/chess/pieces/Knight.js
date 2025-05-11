const ChessPiece = require('./ChessPiece');

class Knight extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
    getMoves(board) {
        let moves = []; // Array to store possible moves
        const directions = [
            { dx: 2, dy: 1 }, // Up Right
            { dx: 2, dy: -1 }, // Down Right
            { dx: -2, dy: 1 }, // Up Left
            { dx: -2, dy: -1 }, // Down Left
            { dx: 1, dy: 2 }, // Up Right
            { dx: 1, dy: -2 }, // Down Right
            { dx: -1, dy: 2 }, // Up Left
            { dx: -1, dy: -2 } // Down Left
        ];
        for (const {dx, dy} of directions) {
            let x = this.position.x + dx;
            let y = this.position.y + dy;
            if (board.boundsCheck(x, y)) {
                const piece = board.getPiece(x,y); // Get the piece at the new position
                if(piece === null ){
                    moves.push({ x: x, y: y, capture: false }); // Add the move to the list if the square is empty
                }else{
                    if(piece.color !== this.color){
                        moves.push({ x: x, y: y, capture: true }); // Capture
                    }
                }
            }
        }
        return moves; // Return the array of possible moves
    }
    
}
module.exports = Knight; // Export the Rook class