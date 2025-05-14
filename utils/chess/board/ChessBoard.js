const ChessPieceFactory = require('../pieces/ChessPieceFactory');

class ChessBoard {
    constructor(fen) {
        this.fen = fen; // FEN string representing the board state
        this.board = this.createBoard(); // Create the board based on the FEN string
        this.capturedPieces = []; // Array to store captured pieces
        this.moveData();
        this.threatMap = Array.from({ length: 8 }, () => Array(8).fill(false)); // Initialize the threat map with false values
        let threatColor = this.activeColor === 'w' ? 'black' : 'white'; // Determine the color of the pieces to be threatened
        this.generateThreatMap(threatColor); // Create the threat map for the opponent's pieces
        
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
    generateThreatMap(color){
        for(let i = 0; i < 8; i++){
            for(let o = 0; o < 8; o++){
                const piece = this.board[i][o]; // Get the piece at the current position
                if(piece !== null && piece.constructor.name !== 'Pawn' && piece.color === color){ // Check if the piece is not null and belongs to the opponent
                    const moves = piece.getMoves(this); // Get the possible moves for the piece
                    for(let move of moves){
                        this.threatMap[move.x][move.y] = true;
                    }
                }
                if(piece !== null && piece.constructor.name === 'Pawn' && piece.color === color){ // Check if the piece is not null and belongs to the opponent
                    const moves = piece.getCaptureMoves(this); // Get the possible moves for the piece
                    for(let move of moves){
                        this.threatMap[move.x][move.y] = true;
                    }
                }
            }
        }
    }
    capturePiece(from, to){
        const attacking = this.board[from.x][from.y]; // Get the piece at the from position
        const captured = this.board[to.x][to.y]; // Get the piece at the to position
        if(attacking !== null && captured !== null){ // Check if the piece is not null
            this.capturedPieces.push(captured); // Add the piece to the captured pieces array
            this.board[to.x][to.y] = attacking; // Remove the piece from the board
            this.board[from.x][from.y] = null;
            attacking.position = {x: to.x, y: to.y}; // Update the position of the piece
            captured.position = null; // Set the position of the captured piece to null
            return true; // Return true to indicate a successful capture
        }
        return false; // Return false if the capture was not successful
    }
    movePiece(from, to){
        const movingPiece = this.board[from.x][from.y]; // Get the piece at the from position
        const empty = this.board[to.x][to.y]; // Get the piece at the to position
        if(movingPiece !== null && empty === null){ // Check if the piece is not null
            this.board[to.x][to.y] = movingPiece; // Move the piece to the new position
            this.board[from.x][from.y] = null; // Set the old position to null
            movingPiece.position = {x: to.x, y: to.y}; // Update the position of the piece
            return true; // Return true to indicate a successful move
        }
        return false;
    }
    promotePiece(from, to, promoteTo){//promoteTo is a char
        if(this.movePiece(from, to)){
            this.board[to.x][to.y] = ChessPieceFactory.createPiece(promoteTo); // Create a new piece using the factory
            return true; // Return true to indicate a successful promotion
        };
        return false; // Return false if the promotion was not successful 
    }
    resetBoard(){
        this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Reset the FEN string to the initial state
        this.board = this.createBoard(); // Reset the board to its initial state
        this.capturedPieces = []; // Clear the captured pieces array
        this.moveData(); // Reset the move data
        this.threatMap = Array.from({ length: 8 }, () => Array(8).fill(false)); // Reinitialize the threat map with false values
        let threatColor = this.activeColor === 'w' ? 'black' : 'white'; // Determine the color of the pieces to be threatened
        this.generateThreatMap(threatColor); // Create the threat map for the opponent's pieces
    }
    isThreatened(x, y, color){
        // Check if the square at (x, y) is threatened by the opponent's pieces
        if(this.threatMap[x][y] === true){
            return true; // The square is threatened
        }else{
            return false; // The square is not threatened
        }
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
    getPieces(color, suit) {
        // Get all pieces of the specified color
        const pieces = [];
        for (let i = 0; i < 8; i++){
            for (let o = 0; o < 8; o++){
                const piece = this.board[i][o]; // Get the piece at the current position
                if(piece !== null && piece.color === color && piece.constructor.name === suit){ // Check if the piece belongs to the specified color
                    pieces.push(piece); // Add the piece to the list
                }
            }
        }
        return pieces; // Return the list of pieces of the specified color
    }
    boundsCheck(x, y) {
        // Check if the coordinates are within the bounds of the board
        if(x < 0 || x > 7 || y < 0 || y > 7){
            //console.log("Out of bounds: ", x, y); 
            return false; 
        }
        return true;
    }
    printBoard(){
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
            console.log(fenArray[i]); // Log the FEN string for each row
        }
        fen += ' ' + this.activeColor + ' '; // Add the active color
        fen += this.castlingAvaible + ' '; // Add castling availability 
        fen += this.enPassante !== '-' ? String.fromCharCode(this.enPassante.x + 97) + (this.enPassante.y + 1) : '-'; // Add en passant target square
        fen += ' ' + this.halfmove + ' '; // Add halfmove clock
        fen += this.fullmove; // Add fullmove number

        return fen; // Return the FEN string representation of the board
    }
}
module.exports = ChessBoard; // Export the ChessBoard class