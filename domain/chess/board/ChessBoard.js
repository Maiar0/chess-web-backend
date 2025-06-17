const ChessPieceFactory = require('../pieces/ChessPieceFactory');
const ApiError = require('../../../utils/ApiError');
const FenUtils = require('../../../utils/chess/FenUtils');
//This class contains board state, should be reworked to represent board in a simpler state.

class ChessBoard {
    constructor(fen, extras = {}) {
        this.fen = fen; // FEN string representing the board state
        this.board = FenUtils.parseFen(this.fen); // Create the board based on the FEN string
        this.capturedPieces = FenUtils.parseCaptureString(extras.captures || '');
        this.kingInCheck = false;
        this.fenData();
        let threatColor = this.activeColor === 'w' ? 'black' : 'white'; // Determine the color of the pieces to be threatened
        this.threatMap = Array.from({ length: 8 }, () => Array(8).fill(false)); // Initialize the threat map with false values
        
        this.generateThreatMap(threatColor);
        
    }

    /**
     * Generates the FEN (Forsyth-Edwards Notation) string representation of the current chess board state.
     *
     * @returns {string} The FEN string representing the current board position, active color, castling availability, en passant target square, halfmove clock, and fullmove number.
     */
    createFen(){
        const fen = FenUtils.parseBoard(this.board, this.activeColor,this.castlingAvaible, this.enPassant, this.halfmove, this.fullmove);
        return fen; // Return the FEN string representation of the board
    }

    /**
     * Parses the FEN (Forsyth-Edwards Notation) string stored in `this.fen` and updates
     * the board state properties: activeColor, castlingAvaible, enPassant, halfmove, and fullmove.
     * 
     * @returns {void}
     */
    fenData(){
        let fenFields = this.fen.split(' ');
        this.activeColor = fenFields[1];
        this.castlingAvaible = fenFields[2];
        this.enPassant = fenFields[3].trim() !== '-' ? FenUtils.fromAlgebraic(fenFields[3]): '-';
        this.halfmove = fenFields[4];
        this.fullmove = fenFields[5];
    }
    
    /**
     * Generates a threat map for the given color, marking all squares attacked by that color's pieces.
     * Also determines if the opposing king is in check.
     *
     * @param {string} color - The color of the pieces to generate the threat map for ('white' or 'black').
     * @returns {boolean[][]} An 8x8 matrix where each cell is true if threatened by the given color, false otherwise.
     *
     * @property {boolean[][]} threatMap - The generated threat map.
     * @property {boolean} kingInCheck - True if the opposing king is in check, false otherwise.
     */
    generateThreatMap(color){//this should take a board and color, return map, and kingInCheck
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
        if(!king){
            this.kingInCheck = true; // If no king found, set kingInCheck to true game is over
            return this.threatMap; // If no king found, return the threat map
        }
        if(this.isThreatened(king.position.x, king.position.y)){
            this.kingInCheck = true;
        }else{
            this.kingInCheck = false;

        }
        return this.threatMap;
    }
    
    /**
     * Moves a piece from one position to another on the chess board.
     *
     * @param {{x: number, y: number}} from - The coordinates of the piece to move.
     * @param {{x: number, y: number}} to - The coordinates to move the piece to.
     * @param {string} [promotionChar] - Optional character representing the piece to promote to (e.g., 'q' for queen).
     * @returns {*} The result of the move, as determined by resolveMove.
     */
    move(from, to, promotionChar){
        const fromPiece = this.board[from.x][from.y];// get piece at from
        const toPiece = this.board[to.x][to.y];//get piece at to if exists
        this.board[to.x][to.y] = fromPiece;//move piece
        this.board[from.x][from.y] = null;//null from tile
        return this.resolveMove(from, to, fromPiece, toPiece, promotionChar);
    }

    /**
     * Resolves a chess move on the board, handling special moves such as en passant, pawn promotion, castling, and captures.
     * Updates the board state, captured pieces, halfmove counter, en passant, and castling rights accordingly.
     *
     * @param {{x: number, y: number}} from - The starting position of the piece.
     * @param {{x: number, y: number}} to - The target position of the move.
     * @param {ChessPiece} fromPiece - The piece being moved.
     * @param {ChessPiece|null} toPiece - The piece at the target position, if any.
     * @param {string} [promotionChar=''] - The character representing the piece to promote to (for pawn promotion).
     * @returns {boolean} Returns true if the move was resolved successfully.
     * @throws {ApiError} Throws an error if the promotion character is invalid.
     */
    resolveMove(from, to, fromPiece, toPiece, promotionChar = ''){
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
            console.log('Promotion Char:', promotionChar)
            if(!promotionChar || promotionChar.toLowerCase() === 'k') throw new ApiError("Not valid promotion char.", 403)
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
    /**
     * Resets the chess board to its initial state.
     *
     * - Sets the FEN string to the standard starting position.
     * - Reinitializes the board using the FEN string.
     * - Clears the array of captured pieces.
     * - Resets move-related FEN data.
     * - Reinitializes the threat map for all squares.
     * - Generates the threat map for the opponent's pieces.
     *
     * @returns {boolean} Returns true when the board has been successfully reset.
     */
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

    /**
     * Updates the en passant target square based on the pawn's move.
     * If a pawn moves two squares forward, sets the en passant target square accordingly.
     * Otherwise, resets the en passant target.
     *
     * @param {Object} piece - The chess piece being moved.
     * @param {Object} from - The starting position of the piece, with properties x and y.
     * @param {Object} to - The ending position of the piece, with properties x and y.
     */
    updateEnPassant(piece, from, to){
        if(piece.constructor.name === 'Pawn' && Math.abs(to.y - from.y) === 2) { //pawn and moved 2 forward
                this.setEnPassant(to.x,to.y + (piece.color === 'white' ? -1 : 1)); // Set the en passant target square
        }else{ this.enPassant = '-';}
    }

    /**
     * Sets the en passant target square using the given x and y coordinates.
     * The coordinates are concatenated as strings to form the en passant key.
     * 
     * @param {number} x - The x-coordinate (file) of the en passant target square.
     * @param {number} y - The y-coordinate (rank) of the en passant target square.
     */
    setEnPassant(x,y){
        this.enPassant = x.toString()+y.toString();
    }

    /**
     * Determines if the square at the given coordinates (x, y) is threatened.
     * Uses the current threat map to check if the square is under attack by any piece.
     *
     * @param {number} x - The x-coordinate (column) of the square.
     * @param {number} y - The y-coordinate (row) of the square.
     * @returns {boolean} True if the square is threatened, false otherwise.
     */
    isThreatened(x, y){//Uses current threat map!
        //console.log("isThreatened: " , this.threatMap[x][y], this.getPiece(x,y))
        if(this.threatMap[x][y] === true){
            return true; // The square is threatened
        }else{
            return false; // The square is not threatened
        }
    }
    /**
     * Retrieves the chess piece at the specified board coordinates.
     *
     * @param {number} x - The x-coordinate (column) of the board (0-7).
     * @param {number} y - The y-coordinate (row) of the board (0-7).
     * @returns {?Object} The piece at the given coordinates, or null if the coordinates are out of bounds or the square is empty.
     */
    getPiece(x, y) {
        if(x < 0 || x > 7 || y < 0 || y > 7) return null; // Check if the coordinates are within bounds
        // Get the piece at the square (x, y)
        if(this.board[x][y] === null) return null; // If the square is empty, return null
        return this.board[x][y];
    }
    /**
     * Retrieves all chess pieces of the specified color from the board.
     *
     * @param {string} color - The color of the pieces to retrieve (e.g., 'white' or 'black').
     * @returns {Array<Object>} An array of piece objects belonging to the specified color.
     */
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

    /**
     * Updates the castling rights on the board based on the movement of a king or rook.
     * If a king moves, both castling rights for that color are removed.
     * If a rook moves from its original position, the corresponding castling right is removed.
     * If no castling rights remain, sets the castling rights to '-'.
     *
     * @param {Object} piece - The chess piece that was moved. Should have `constructor.name` and `color` properties.
     * @param {Object} from - The original position of the piece. Should have `x` and `y` properties.
     */
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
    /**
     * Checks if the given coordinates are within the bounds of a standard 8x8 chess board.
     *
     * @param {number} x - The x-coordinate (column index) to check, expected to be between 0 and 7.
     * @param {number} y - The y-coordinate (row index) to check, expected to be between 0 and 7.
     * @returns {boolean} Returns true if both coordinates are within bounds, otherwise false.
     */
    boundsCheck(x, y) {
        // Check if the coordinates are within the bounds of the board
        if(x < 0 || x > 7 || y < 0 || y > 7){
            
            return false; 
        }
        return true;
    }

    /**
     * Prints the current threat map of the chess board to the console.
     * Displays which squares are threatened by the active color.
     * Threatened squares are marked with 'X', and safe squares with '.'.
     * The board is printed from rank 8 to 1, with files labeled a to h.
     */
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
    /**
     * Prints the current state of the chess board to the console in a human-readable format.
     * Displays the board with ranks and files, using FEN notation for pieces and dots for empty squares.
     * Also logs additional game state information such as active color, castling availability,
     * en passant target square, halfmove clock, and fullmove number.
     *
     * @returns {void}
     */
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