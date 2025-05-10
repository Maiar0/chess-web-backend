const ChessPieceFactory = require('../pieces/ChessPieceFactory');

class ChessBoard {
    constructor(fen) {
        this.fen = fen; // FEN string representing the board state
        this.board = this.createBoard(); // Create the board based on the FEN string
        this.moveData();
        
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
                    piece.position = {x: o, y: 7-i }; // Set the position of the piece
                    board[o][7-i] = piece; // Place the piece on the board
                }else o += pieceChar -1; // If the character is a number, skip that many squares
            }
        }
        return board; // Return the created board 

    }
    moveData(){
        let fenFields = this.fen.split(' ');
        this.activeColor = fenFields[1];
        this.castlingAvaible = fenFields[2];
        this.enPassante = fenFields[3] !== '-' ? {x: fenFields[3].split('')[0].charCodeAt(0) - 97, y: Number(fenFields[3].split('')[1]) - 1} : '-';
        this.halfmove = fenFields[4];
        this.fullmove = fenFields[5];
    }
    isOccupied(x, y) {
        // Check if the square at (x, y) is occupied by a piece
        return this.board[x][y] !== null;
    }
    getPiece(x, y) {
        if(x < 0 || x > 7 || y < 0 || y > 7) return null; // Check if the coordinates are within bounds
        // Get the piece at the square (x, y)
        if(this.board[x][y] === null) return null; // If the square is empty, return null
        return this.board[x][y];
    }
}
module.exports = ChessBoard; // Export the ChessBoard class