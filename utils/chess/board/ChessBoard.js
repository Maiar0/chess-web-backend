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
            let row = rows[i];
            let x = 0; // Board file index

            for(let o = 0; o < row.length; o++){
                const pieceChar = row[o];

                if(isNaN(pieceChar)){
                    const piece = ChessPieceFactory.createPiece(pieceChar); // Create a piece using the factory
                    piece.position = {x: x, y: 7-i }; // Set the position of the piece
                    board[x][7-i] = piece; // Place the piece on the board
                    x++; // Move to the next file
                }else x += parseInt(pieceChar, 10); // If the character is a number, skip that many squares
                
            }
        }
        return board; // Return the created board 

    }
    createFen(){
        let fenArray = [];
        for(let i = 0; i < 8; i++){
            fenArray[i] = '';
            let count = 0; // Counter for empty squares
            for(let o = 0; o < 8; o++){
                const piece = this.board[o][i]; // Get the piece at the current position
                if (piece === null){
                    count++;
                }else{
                    if(count > 0){
                        fenArray[i] += count; // Add the number of empty squares to the FEN string
                        count = 0; // Reset the counter
                    }
                    fenArray[i] += piece.getFen(); // Get the FEN representation of the piece
                }
            }
            if(count > 0){
                fenArray[i] += count; // Add the number of empty squares to the FEN string
                count = 0; // Reset the counter
            }
        }
        let fen = '';
        for(let i = fenArray.length - 1; i >= 0; i--){
            fen += fenArray[i]; // Concatenate the rows to form the FEN string
            if(i > 0) fen += '/'; // Add a slash between rows
        }
        fen += ' ' + this.activeColor + ' '; // Add the active color
        fen += this.castlingAvaible + ' '; // Add castling availability 
        fen += this.enPassante !== '-' ? String.fromCharCode(this.enPassante.x + 97) + (this.enPassante.y + 1) : '-'; // Add en passant target square
        fen += ' ' + this.halfmove + ' '; // Add halfmove clock
        fen += this.fullmove; // Add fullmove number

        return fen; // Return the FEN string representation of the board
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
    boundsCheck(x, y) {
        // Check if the coordinates are within the bounds of the board
        if(x < 0 || x > 7 || y < 0 || y > 7){
            console.log("Out of bounds: ", x, y); 
            return false; 
        }
        return true;
    }
}
module.exports = ChessBoard; // Export the ChessBoard class