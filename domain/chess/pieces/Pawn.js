const ChessPiece = require('./ChessPiece');
const ChessBoard = require('../board/ChessBoard');

class Pawn extends ChessPiece {
    constructor(color, position) {
        super(color, position); // Call the constructor of the parent class (ChessPiece)
    }
    getMoves(board) {
        //y will need to be normalized with direction
        const directions = [
            { dx: 0, dy: 1, type: 'normal' }, // Up 
            { dx: 0, dy: 2, type: 'start' }, // Up 
            { dx: 1, dy: 1, type: 'capture' }, // Up Right
            { dx: -1, dy: 1, type: 'capture' }, // Up left
            { dx: 1, dy: 1, type: 'enPassante' }, // Up Right
            { dx: -1, dy: 1, type: 'enPassante' } // Up left
        ];
        const moves = []; // Array to store possible moves
        const direction = this.color === 'white' ? 1 : -1; // Determine the direction of movement based on color
        const startRank = this.color === 'white' ? 1 : 6; // Starting rank for pawns

        let evaluateX = this.position.x; // Tile that needs to be evaluated
        let evaluateY = this.position.y + direction; // Tile that needs to be evaluated
        const piece= () => board.getPiece(evaluateX, evaluateY); // Get the piece at the new position
        //Movement Logic
        moves.push(...this.getNormalMoves(board));
        moves.push(...this.getCaptureMoves(board));
        
        return moves; // Return the array of possible moves
    }
    getNormalMoves(board){
        let moves = [];
        const direction = this.color === 'white' ? 1 : -1; // Determine the direction of movement based on color
        const startRank = this.color === 'white' ? 1 : 6; // Starting rank for pawns

        let evaluateX = this.position.x; // Tile that needs to be evaluated
        let evaluateY = this.position.y + direction; // Tile that needs to be evaluated
        const piece= () => board.getPiece(evaluateX, evaluateY); // Get the piece at the new position
        //Movement Logic
        if(piece() === null) {// Move forward one square
            moves.push({ x: evaluateX, y: evaluateY, capture: false }); // Add the move to the array
            evaluateY = this.position.y + 2 * direction; 
            if(this.position.y === startRank && piece() === null){ // Check if the pawn is on its starting rank and the square is empty
                moves.push({ x: evaluateX, y: evaluateY, capture: false }); 
            }
        }

        return moves;
    }
    getCaptureMoves(board) {
        const moves = []; // Array to store possible moves
        const direction = this.color === 'white' ? 1 : -1; // Determine the direction of movement based on color

        let evaluateX = this.position.x; // Tile that needs to be evaluated
        let evaluateY = this.position.y + direction; // Tile that needs to be evaluated
        const piece= () => board.getPiece(evaluateX, evaluateY); // Get the piece at the new position
        // Capture Logic
        evaluateX = this.position.x + 1; // Evaluate the Right diagonal square   
        evaluateY = this.position.y + direction; // Evaluate the forward square
        if(piece() !== null && piece().color !== this.color){
            moves.push({ x: evaluateX, y: evaluateY, capture: true }); // Capture diagonally to the right
        }
        evaluateX = this.position.x - 1; // Evaluate the Left diagonal square
        if(piece() !== null && piece().color !== this.color){
            moves.push({ x: evaluateX, y: evaluateY, capture: true }); // Capture diagonally to the left
        }
        return moves;
    }
    getFen() {
        return this.color === 'white' ? 'P' : 'p'; // Return the FEN representation of the piece
    }
    getEnPassanteMoves(board){//TODO:: Finish this
        moves = [];
        if(board.enPassante !== '-'){
            moves.push({x: parseInt(board.enPassante[0], 10), y: parseInt(board.enPassante[1], 10)})
        }
        return moves;
    }
}
module.exports = Pawn; // Export the Pawn class