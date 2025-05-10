const ChessPiece = require('./ChessPiece');
const ChessBoard = require('../board/ChessBoard');

class Pawn extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
    getMoves(board) {
        const moves = []; // Array to store possible moves
        const direction = this.color === 'white' ? 1 : -1; // Determine the direction of movement based on color
        const startRank = this.color === 'white' ? 1 : 6; // Starting rank for pawns

        let evaluateX = this.position.x; // Tile that needs to be evaluated
        let evaluateY = this.position.y + direction; // Tile that needs to be evaluated
        console.log(evaluateX, evaluateY);
        const piece= () => board.getPiece(evaluateX, evaluateY); // Get the piece at the new position
        //Movement Logic
        if(piece() === null) {// Move forward one square
            moves.push({ x: evaluateX, y: evaluateY });
            evaluateY = this.position.y + 2 * direction; 
            if(this.position.y === startRank && piece() === null){ // Check if the pawn is on its starting rank and the square is empty
                moves.push({ x: evaluateX, y: evaluateY }); 
            }
        }

        // Capture Logic
        evaluateX = this.position.x + 1; // Evaluate the Right diagonal square   
        evaluateY = this.position.y + direction; // Evaluate the forward square
        if(piece() !== null && piece().color !== this.color){
            moves.push({ x: evaluateX, y: evaluateY }); // Capture diagonally to the right
        }else if(board.enPassante !== '-'){
            if(board.enPassante.x === evaluateX && board.enPassante.y == this.position.y){
                moves.push({ x: evaluateX, y: evaluateY}); // En passant capture to the right
            }
        }
        evaluateX = this.position.x - 1; // Evaluate the Left diagonal square
        if(piece() !== null && piece().color !== this.color){
            moves.push({ x: evaluateX, y: evaluateY }); // Capture diagonally to the left
        }else if(board.enPassante !== '-'){
            if(board.enPassante.x === evaluateX && board.enPassante.y == this.position.y){
                moves.push({ x: evaluateX, y: evaluateY}); // En passant capture to the Left
            }
        }
        return moves; // Return the array of possible moves
    }
}
module.exports = Pawn; // Export the Pawn class