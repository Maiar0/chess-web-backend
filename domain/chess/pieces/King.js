const ChessPiece = require('./ChessPiece');

class King extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
    getMoves(board) {
        let moves = [];
        const directions = [
            { dx: 0, dy: 1 }, // Up
            { dx: 0, dy: -1 }, // Down
            { dx: 1, dy: 0 }, // Right
            { dx: -1, dy: 0 }, // Left
            { dx: 1, dy: 1 }, // Up Right
            { dx: -1, dy: 1 }, // Up left
            { dx: -1, dy: -1 }, // Down left
            { dx: 1, dy: -1 } // Down Right
        ];
        for( const {dx, dy} of directions) {
            let x = this.position.x + dx;
            let y = this.position.y + dy;
            let threatColor = this.color === 'white' ? 'black' : 'white'; // Determine the color of the opponent
            if (board.boundsCheck(x, y) && !board.isThreatened(x, y, threatColor)) { // Check if the square is within bounds and not threatened
                const piece = board.getPiece(x,y); // Get the piece at the new position
                if(piece === null){
                    moves.push({ x: x, y: y, capture: false }); // Add the move to the list if the square is empty
                }else{
                    if(piece.color !== this.color){
                        moves.push({ x: x, y: y, capture: true }); // Capture
                    }
                }
            }
        }
        return moves; // Return an empty array for now, as the move logic is not implemented
    }
    getFen() {
        return this.color === 'white' ? 'K' : 'k'; // Return the FEN representation of the piece
    }
}
module.exports = King; // Export the Rook class