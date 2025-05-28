const ChessPieceFactory = require('../pieces/ChessPieceFactory');
const ApiError = require('../../../utils/ApiError');
const FenUtils = require('../../../utils/chess/FenUtils');

class ChessBoard {
    constructor(fen, extras = {}) {
        this.fen = fen; // FEN string representing the board state
        this.board = FenUtils.parseFen(this.fen); // Create the board based on the FEN string
        this.capturedPieces = FenUtils.parseCaptureString(extras.captures || '');
        this.kingInCheck = false;
        this.fenData();
        let threatColor = this.activeColor === 'w' ? 'black' : 'white'; // Determine the color of the pieces to be threatened
        this.threatMap = Array.from({ length: 8 }, () => Array(8).fill(false)); // Initialize the threat map with false values
        
        this.generateThreatMap(threatColor); // Create the threat map for the opponent's pieces
        
    }

    createFen(){
        const fen = FenUtils.parseBoard(this.board, this.activeColor,this.castlingAvaible, this.enPassant, this.halfmove, this.fullmove);
        return fen; // Return the FEN string representation of the board
    }

    fenData(){
        let fenFields = this.fen.split(' ');
        this.activeColor = fenFields[1];
        this.castlingAvaible = fenFields[2];
        this.enPassant = fenFields[3].trim() !== '-' ? FenUtils.fromAlgebraic(fenFields[3]): '-';
        this.halfmove = fenFields[4];
        this.fullmove = fenFields[5];
    }
    
    generateThreatMap(color){
        this.threatMap = Array.from({ length: 8 }, () => Array(8).fill(false));
        let king = null;
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
                    const moves = piece.getCaptureMoves(this); // Get the possible moves for the piece//TODO:: we didnt actually need to create new function for this.
                    for(let move of moves){
                        this.threatMap[move.x][move.y] = true;
                    }
                }
                if(piece !== null && piece.constructor.name === 'King' && piece.color !== color){// must be king && activeColor
                    king = piece;
                }
            }
        }
        if(this.isThreatened(king.position.x, king.position.y)){
            this.kingInCheck = true;
        }else{
            this.kingInCheck = false;

        }
        return this.threatMap;
    }
    //Performs piece capture
    capturePiece(from, to){//TODO:: Modularize moving/capture/enpassant/promote/castling
        const attacking = this.board[from.x][from.y]; // Get the piece at the from position
        const captured = this.board[to.x][to.y]; // Get the piece at the to position
        if(captured !== null){ // Check if the piece is not null
            this.capturedPieces.push(captured); // Add the piece to the captured pieces array
            this.board[to.x][to.y] = attacking; // Remove the piece from the board
            this.board[from.x][from.y] = null;
            attacking.position = {x: to.x, y: to.y}; // Update the position of the piece
            captured.position = null; // Set the position of the captured piece to null
            this.resolveMove(attacking, from, to);
            this.halfmove = '0';
            return true; // Return true to indicate a successful capture
        } else throw new ApiError('capturePiece: This is not a capture?', 428); // Throw an error if the capture was invalid
    }
    //Performs Piece Move
    movePiece(from, to){
        const movingPiece = this.board[from.x][from.y]; // Get the piece at the from position
        const empty = this.board[to.x][to.y]; // Get the piece at the to position
        if(empty === null){ // Check if the piece is not null
            this.board[to.x][to.y] = movingPiece; // Move the piece to the new position
            this.board[from.x][from.y] = null; // Set the old position to null
            movingPiece.position = {x: to.x, y: to.y}; // Update the position of the piece
            //resolving chores
            this.resolveMove(movingPiece, from, to);
            if(movingPiece.constructor.name === 'Pawn') {
                this.halfmove = '0';
            }else{
                this.halfmove = (parseInt(this.halfmove,10) + 1).toString()
            }
             // Return true to indicate a successful move
            return true;
        }else throw new ApiError('movePiece: This is a capture?', 429);// Throw an error if the move is invalid
    }
    //move piece TODO:: test and implement
    move(from, to, promotionChar){
        const fromPiece = this.board[from.x][from.y];// get piece at from
        const toPiece = this.board[to.x][to.y];//get piece at to if exists
        this.board[to.x][to.y] = fromPiece;//move piece
        this.board[from.x][from.y] = null;//null from tile
        return this.betaresolveMove(from, to, fromPiece, toPiece, promotionChar);
    }
    //this resolves a Move, captures all logic that needs to happen after a move.
    betaresolveMove(from, to, fromPiece, toPiece, promotionChar){
        let captured = null;
        //enPassant
        if(fromPiece.constructor.name === 'Pawn' && from.x !== to.x && toPiece === null){
            const dir = fromPiece.color === 'white' ? -1 : 1;
            captured = this.board[to.x][to.y +dir];
            console.log('En Passante Move', fromPiece, to, captured);
            this.capturedPieces.push(captured);//add piece to captured array
            this.board[to.x][to.y + dir] = null; //clear board square
            captured.position = null; // set captured piece position to null
        }
        //pawn promotion
        else if(fromPiece.constructor.name === 'Pawn' && (to.y === 0 || to.y === 7)){
            if(!promotionChar || promotionChar.toLowerCase() === 'k') throw new ApiError("Not valid promotion char.", 430)
            let promotePiece  = ChessPieceFactory.createPiece(promotionChar);
            promotePiece.position = to;
            this.board[to.x][to.y] = promotePiece;
            console.log('Pawn promotion:', fromPiece, promotePiece);
        }
        //castling
        else if(fromPiece.constructor.name === 'King' && Math.abs(to.x - from.x) === 2){
            const finalPos = {x: to.x === 6 ? 5 : 3, y: from.y}; // Final position of the rook after castling
            const startPos = {x: to.x === 6 ? 7 : 0, y: from.y}; // Starting position of the rook
            const rook = this.getPiece(startPos.x, startPos.y);
            this.board[finalPos.x][from.y] = rook;//move rook
            this.board[startPos.x][from.y] = null;//null old position
            rook.position = finalPos; //update internal rook
            console.log('Castling Move:', fromPiece, rook);
        }
        //captured
        else if(toPiece !== null){
            console.log('Capture:', fromPiece, toPiece);
            captured = toPiece;
            captured.position = null; //remove position of captured piece
            this.capturedPieces.push(captured);//add piece to captured array
        }
        else{
            console.log('Move:', fromPiece, to);
        }
        //deal with halfmove counter
        if(fromPiece.constructor.name === 'Pawn' || captured !== null){
            this.halfmove  = '0';
        }else{
            this.halfmove = (parseInt(this.halfmove,10) + 1).toString();// update half move if not Capture or Pawn
        }
        fromPiece.position = to;//update position of piece
        this.updateEnPassant(fromPiece, from, to);
        this.updateCastlingRights(fromPiece, from);
        return true;
    }
    //resolves after move/capture/enPassant logic
    resolveMove(piece, from, to){
        this.updateEnPassant(piece, from, to);
        this.updateCastlingRights(piece, from);
    }
    //Performs En Passant Capture
    enPassantCapture(from, to){
        const movingPiece = this.board[from.x][from.y]; // Get the piece at the from position
        const dir = movingPiece.color === 'white' ? -1 : 1
        const captured = this.board[to.x][to.y + dir]; // Get the piece we will capture
        if(captured !== null){ 
            this.capturedPieces.push(captured); // Add the piece to the captured pieces array
            this.board[to.x][to.y] = movingPiece; // Move the piece to the new position
            this.board[to.x][to.y + dir] = null; // Move the piece to the new position
            this.board[from.x][from.y] = null; // Set the old position to null
            movingPiece.position = {x: to.x, y: to.y}; // Update the position of the piece
            this.enPassant = '-'; //set enPassant to none
            return true; // Return true to indicate a successful move
        } 
    }
    //Performs promotion
    promotePiece(from, to, promoteTo){//promoteTo is a char
        if(this.getPiece(to.x, to.y) !== null){
            this.capturePiece(from,to);
        }else{this.movePiece(from, to);}
        if(promoteTo.toLowerCase() === 'k') throw new ApiError("promotePiece: Can't promote to King!",430)
        this.board[to.x][to.y] = ChessPieceFactory.createPiece(promoteTo); // Create a new piece using the factory
    }
    //Performs castling
    castlingMove(from, to){
        const finalPos = {x: to.x === 6 ? 5 : 3, y: from.y}; // Final position of the rook after castling
        const startPos = {x: to.x === 6 ? 7 : 0, y: from.y}; // Starting position of the rook
        const rook = this.getPiece(startPos.x, startPos.y);
        const king = this.getPiece(from.x, from.y);
        this.board[to.x][to.y] = king; // Move the king to the new position
        this.board[from.x][from.y] = null; // Set the old position of the king to null
        this.board[finalPos.x][finalPos.y] = rook; // Move the rook to the new position
        this.board[startPos.x][startPos.y] = null; // Set the old position of the rook to null
        rook.position = finalPos; // Update the position of the rook
        this.resolveMove(king, from, to); // Resolve the move for the king
        this.halfmove = '0'; // Reset the halfmove counter
        return true;
    }
    resetBoard(){
        this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // Reset the FEN string to the initial state
        this.board = FenUtils.parseFen(this.fen); // Reset the board to its initial state
        this.capturedPieces = []; // Clear the captured pieces array
        this.fenData(); // Reset the move data
        this.threatMap = Array.from({ length: 8 }, () => Array(8).fill(false)); // Reinitialize the threat map with false values
        let threatColor = this.activeColor === 'w' ? 'black' : 'white'; // Determine the color of the pieces to be threatened
        this.generateThreatMap(threatColor); // Create the threat map for the opponent's pieces
        
        return true;
    }
    //sets enPassante string after move
    updateEnPassant(piece, from, to){
        if(piece.constructor.name === 'Pawn' && Math.abs(to.y - from.y) === 2) { //pawn and moved 2 forward
                this.setEnPassant(to.x,to.y + (piece.color === 'white' ? -1 : 1)); // Set the en passant target square
        }else{ this.enPassant = '-';}
    }
    //Sets EnPassant String
    setEnPassant(x,y){//TODO:: Eliminate this.
        this.enPassant = x.toString()+y.toString();
    }
    isThreatened(x, y){//Uses current threat map!
        //console.log("isThreatened: " , this.threatMap[x][y], this.getPiece(x,y))
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
    getPieces(color) {
        // Get all pieces of the specified color
        const pieces = [];
        for (let i = 0; i < 8; i++){
            for (let o = 0; o < 8; o++){
                const piece = this.board[i][o]; // Get the piece at the current position
                if(piece !== null && piece.color === color){ // Check if the piece belongs to the specified color
                    pieces.push(piece); // Add the piece to the list
                }
            }
        }
        return pieces; // Return the list of pieces of the specified color
    }
    //this is used to update castling rights if 'piece' moves
    //we can call this on move completion and should update castling right correctly 
    updateCastlingRights(piece, from) 
    {
        if (!piece || !from) return;

        if (piece.constructor.name === 'King') {
            // King moved: remove both castling rights for that color
            if (piece.color === 'white') {
                this.castlingAvaible = this.castlingAvaible.replace('K', '').replace('Q', '');
            } else {
                this.castlingAvaible = this.castlingAvaible.replace('k', '').replace('q', '');
            }
        }

        if (piece.constructor.name === 'Rook') {
            const y = piece.color === 'white' ? 0 : 7;

            if (from.x === 0 && from.y === y) {
                // Queen-side rook moved
                this.castlingAvaible = this.castlingAvaible.replace(piece.color === 'white' ? 'Q' : 'q', '');
            }
            if (from.x === 7 && from.y === y) {
                // King-side rook moved
                this.castlingAvaible = this.castlingAvaible.replace(piece.color === 'white' ? 'K' : 'k', '');
            }
        }

        if (this.castlingAvaible === '') this.castlingAvaible = '-';
    }
    boundsCheck(x, y) {
        // Check if the coordinates are within the bounds of the board
        if(x < 0 || x > 7 || y < 0 || y > 7){
            
            return false; 
        }
        return true;
    }

    printThreatMap() {
    console.log("Threat Map:", this.activeColor);
    console.log("   a b c d e f g h");
        for (let y = 7; y >= 0; y--) {
            let row = (y + 1) + "  ";
            for (let x = 0; x < 8; x++) {
                row += this.threatMap[x][y] ? "X " : ". ";
            }
            console.log(row);
        }
    }
    printBoard() {
    console.log("Board:");
    console.log("   a b c d e f g h");
        for (let y = 7; y >= 0; y--) {
            let row = (y + 1) + "  ";
            for (let x = 0; x < 8; x++) {
                const b = this.board[x][y];
                const p = this.getPiece(x,y);
                row += p ? p.getFen()+' ' : ". ";
            }
            console.log(row);
        }
        console.log("(activeColor:", this.activeColor, ") (Castling:", this.castlingAvaible, ") (En Passant:", this.enPassant, ") (Half move:", this.halfmove, ") (Full move:", this.fullmove,")");
    }
    
}
module.exports = ChessBoard; // Export the ChessBoard class