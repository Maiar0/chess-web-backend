const ChessPieceFactory = require('../pieces/ChessPieceFactory');

class ChessBoard {
    constructor(fen) {
        this.fen = fen; // FEN string representing the board state
        this.board = this.createBoard(); // Create the board based on the FEN string
        
    }
    createBoard() {
        // Create an 8x8 board initialized with null values
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));
        let rows = this.fen.split(' ')[0].split('/'); // Split the FEN string into rows
        for (let i = 0; i < rows.length; i++){
            let piece;
            let row = rows[i];
            for(let o = 0; o < row.length; o++){
                let pieceChar = row[o];
                if(isNaN(pieceChar)){
                    piece = ChessPieceFactory.createPiece(pieceChar); // Create a piece using the factory
                    piece.position = {x: i, y: 7-o }; // Set the position of the piece
                    board[i][8-o] = piece; // Place the piece on the board
                }else o += pieceChar -1; // If the character is a number, skip that many squares
                console.log(pieceChar, piece, i, o); // Log the character and piece for debugging
            }
        }
        return board; // Return the created board
    }
}
module.exports = ChessBoard; // Export the ChessBoard class