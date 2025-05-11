const ChessPiece = require('./ChessPiece');

class Rook extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
    getMoves(board) {
        let moves = []; // Array to store possible moves
        const directions = [
            { dx: 0, dy: 1 }, // Up
            { dx: 0, dy: -1 }, // Down
            { dx: 1, dy: 0 }, // Right
            { dx: -1, dy: 0 } // Left
        ];
        for  (const {dx, dy} of directions) {
            let x = this.position.x + dx;
            let y = this.position.y + dy;
            console.log("x: ", x, "y: ", y);
            while (board.boundsCheck(x, y)) {
                const piece = board.getPiece(x,y); // Get the piece at the new position
                if(piece === null ){
                    moves.push({ x: x, y: y, capture: false }); // Add the move to the list if the square is empty
                }else{
                    if(piece.color !== this.color){
                        moves.push({ x: x, y: y, capture: true }); // Capture
                    }
                    break; //Stop moving in this direction if a piece is encountered
                }
                x += dx; // Move in the x direction
                y += dy; // Move in the y direction
            }
        }
        return moves; // Return the array of possible moves
    }

}
module.exports = Rook; // Export the Rook class