const ChessBoard = require('../../domain/chess/board/ChessBoard');
const MoveUtils = require('../../utils/chess/MoveUtils');
const FenUtils = require('../../utils/chess/FenUtils');
const {getBestMove} = require('../../utils/chess/StockFishUtil');
const ChessDbManager = require('../../db/ChessDbManager');
const ApiError = require('../../utils/ApiError');

class ChessGameService{
    constructor(gameId, log){
        this.log = log; // Initialize the log session
        this.db = new ChessDbManager(); //init DB
        if(gameId === undefined || gameId === null || gameId === '') {
            this.gameId = this.createGameId();
            this.db.createGame(this.gameId);
        }else{
            this.gameId = gameId;
        }
        this.capturedString = this.db.getGameCaptures(this.gameId);
        this.chessBoard = new ChessBoard(this.db.getGameFen(this.gameId), {captures : this.capturedString}); // Create a new chess board using the FEN string
        
        this.CheckMate = false; //TODO:: we should be able to remove this
        this.isAi =this.db.getPlayer(gameId, 'black') === 'ai'; // Flag to indicate if the game is against AI
        this.status = ''; // Status of the game, can be used for additional information
    }
    /**
     * Generates a random 9-character game ID consisting of lowercase letters and digits.
     * Logs the event of creating a game.
     *
     * @returns {string} A randomly generated game ID.
     */
    createGameId(){// Generate a random game ID
        this.log.addEvent('creating game')
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 9; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    /**
     * Initializes a new chess game. If `isAi` is true, sets the black player as an AI and logs the event.
     *
     * @param {boolean} [isAi=false] - Indicates whether the game should be set up with an AI opponent as black.
     * @returns {boolean} Returns true when the game is successfully initialized.
     */
    newGame(isAi = false){
        if(isAi){
            this.db.setPlayer(this.gameId, 'black', 'ai');
            let player = this.db.getPlayer(this.gameId, 'black');
            this.log.addEvent('This is AI Game');
        }
        return true;
    }
    /**
     * Retrieves information about the game for a specific player.
     *
     * @param {string|number} playerId - The unique identifier of the player.
     * @returns {boolean} Always returns true.
     */
    infoGame(playerId){
        return true;
    };
    /**
     * Assigns a color ('white' or 'black') to a player for the current chess game.
     * Handles AI games, prevents duplicate assignments, and manages color conflicts.
     *
     * @param {string} playerId - The unique identifier of the player choosing a color.
     * @param {'white'|'black'} color - The color the player wants to choose.
     * @returns {string} A message indicating the result of the color assignment.
     * @throws {ApiError} If the color is invalid or the player already has a color assigned.
     */
    chooseColor(playerId, color){// Choose a color for the game
        if(color !== 'white' && color !== 'black'){
            console.log('Invalid color choice:', color);
            throw new ApiError('Invalid color choice. Choose either "white" or "black".', 400);
        }
        const choicePlayer = this.db.getPlayer(this.gameId, color);
        const otherColor = color === 'white' ? 'black' : 'white';
        const otherPlayer = this.db.getPlayer(this.gameId, otherColor);
        if(this.db.getPlayer(this.gameId, 'black') === 'ai'){//player already has a color
            this.db.setPlayer(this.gameId, 'white', playerId);
            return 'AI game, your color is white.';
        }
        if(playerId === choicePlayer || playerId === otherPlayer){//player already has a color
            throw new ApiError('Player ' + playerId + ' already has a color assigned.', 403);
        }
        if(choicePlayer === ''){//choice availble 
            this.log.addEvent('Player ' + playerId + ' chose color: ' + color);
            this.db.setPlayer(this.gameId, color, playerId);
            return 'Successfully set color to ' + color;
        }else{
            this.db.setPlayer(this.gameId, otherColor, playerId);//set other color
            return 'Color taken color set to ' + otherColor;
        }
        
    }
    /**
     * Requests a move from the user and processes it if valid.
     *
     * @param {{x: number, y: number}} from - The starting coordinates of the piece to move.
     * @param {{x: number, y: number}} to - The destination coordinates for the move.
     * @param {string} [promoteTo] - Optional. The piece type to promote to (if applicable, e.g., pawn promotion).
     * @param {string|number} playerId - The ID of the player making the move.
     * @throws {ApiError} If it is not the player's turn.
     * @returns {boolean} Returns true if the move request was processed.
     */
    requestMove(from, to, promoteTo, playerId){// Request a move from the user
        if(!this.isPlayersTurn(playerId)){
            throw new ApiError('Not your turn.', 403);
        }

        if(this.validateMove(from,to)){//Check if piece can move
            const piece = this.chessBoard.getPiece(from.x, from.y);
            if(this.chessBoard.move(from, to, promoteTo)){//move is completed
                this.log.addEvent('END TURN SHOULD TRIGGER NOW');
                this.endTurn();//end turn
                this.log.addEvent('Move successful From:' + JSON.stringify(from) +'To:' +  JSON.stringify(to) + 'promoteChar:' + JSON.stringify(promoteTo));
            }
        }
        return true;
    }
    /**
     * Handles a draw request in the chess game.
     * If the fifty-move rule is met (i.e., at least 50 moves without a pawn move or capture),
     * the method returns true to indicate a draw can be claimed.
     * Otherwise, it should initiate a process to ask both players if they agree to a draw.
     *
     * @returns {boolean} True if a draw can be claimed by the fifty-move rule, otherwise false.
     */
    requestDraw(){
        if(parseInt(this.chessBoard.fen.split(' ')[4], 10)  >= 50){
            return true;
        }else{
            //ask both parties if they want to agree to draw
        }

        return false;
    }
    /**
     * Determines if it is the specified player's turn to move.
     *
     * Checks if the given playerId matches the current active player based on the board's active color.
     * If not, checks if it is the AI's turn to move.
     *
     * @param {string} playerId - The unique identifier of the player to check.
     * @returns {boolean} Returns true if it is the player's or AI's turn to move, otherwise false.
     */
    isPlayersTurn(playerId){
        const color = this.chessBoard.activeColor === 'w' ? 'white': 'black';
        const currentPlayer =this.db.getPlayer(this.gameId, color)
        if(playerId === currentPlayer){
            console.log('***Player can Move***');
            return true; // Player is allowed to make a move 
        }else{
            if(this.isAisTurn()){
                console.log('***AI can Move***');
                return true; // AI is allowed to make a move
            }
            console.log('***Not Players turn***');
            return false; // Player is not allowed to make a move
        }
    }
    /**
     * Determines if it is currently the AI's turn to play.
     *
     * Checks the current board state using the FEN string to see if it's black's turn,
     * and verifies if the AI is set to play as black.
     *
     * @returns {boolean} Returns true if it is the AI's turn, otherwise false.
     */
    isAisTurn(){
        if(this.chessBoard.fen.split(' ')[1] ==='b'){
            if(this.isAi){
                return true; // AI's turn
            }
        }
        return false; // Not AI's turn
    }
            
    /**
     * Validates a chess move from one position to another.
     *
     * Checks if the move is legal according to chess rules, including:
     * - There is a piece at the source position.
     * - The piece belongs to the player whose turn it is.
     * - The move does not leave the king in check.
     * - Castling is handled as a special case.
     * - The move is valid for the piece type.
     *
     * @param {{x: number, y: number}} from - The starting position of the piece.
     * @param {{x: number, y: number}} to - The target position for the move.
     * @throws {ApiError} If the move is invalid for any reason.
     * @returns {boolean} Returns true if the move is valid.
     */
    validateMove(from, to){// Validate the move requested by the user
        let piece = this.chessBoard.getPiece(from.x,from.y);
        let board = this.chessBoard;
        if(piece === null) // Check if there is a piece at the from position
            {throw new ApiError("validateMove: No piece at from position", 400);}; 

        if(piece.color.charAt(0).toLowerCase() !== this.chessBoard.activeColor.charAt(0).toLowerCase()) // Check if the piece is the correct color
            {throw new ApiError("validateMove: Invalid piece color", 403);}; 

        if(MoveUtils.simulationKingCheck(this.chessBoard.fen ,from, to)){//TODO:: Set better error messages
            throw new ApiError('King is in Check.', 403);
        }
        if(MoveUtils.castlingPossible(this.chessBoard.fen , from, to)){
            return true;//we shouldnt check isValidMove, it is not a valid normal move.
        }
        if(!MoveUtils.isValidMove(board, piece, to)) {
            this.log.addEvent('ERROR : Invalid move FROM ' + JSON.stringify(from) + ' = valid, TO ' + JSON.stringify(to) + ' = invalid');//add fen
            throw new ApiError('validateMove: Invalid move FROM = valid, TO = invalid', 403);
        }
    
        return true;
    }
    /**
     * Ends the current player's turn, updates the game state, and checks for checkmate.
     *
     * - Increments the full move counter if it's black's turn.
     * - Switches the active color to the next player.
     * - Saves the current FEN string to the database.
     * - Logs whether the king is in check.
     * - Simulates and logs checkmate detection.
     * - If checkmate is detected, removes the king from the board, logs the event, and updates the captured pieces.
     * - Saves the final FEN state if checkmate occurs.
     * - Evaluates and updates the current game status.
     *
     * @async
     * @returns {Promise<void>}
     */
    async endTurn(){
        //Full move counter
        if(this.chessBoard.activeColor === 'b') this.chessBoard.fullmove =  (parseInt(this.chessBoard.fullmove,10) + 1).toString();
        this.chessBoard.activeColor = this.chessBoard.activeColor === 'w' ? 'b' : 'w';//switch active color
        this.saveFen(); // Save the current FEN string to the database
        this.log.addEvent('End Turn: isKinginCheck ' + MoveUtils.isKingInCheck(this.chessBoard.fen));
        const checkMateResult = MoveUtils.simulationKingCheckMate(this.chessBoard.fen);
        this.log.addEvent('Check Mate Result: ' + checkMateResult);
        if(MoveUtils.simulationKingCheckMate(this.chessBoard.fen)){
            this.log.addEvent('Check Mate detected');
            this.CheckMate = true;
            let pieces = this.chessBoard.getPieces(this.chessBoard.activeColor === 'w' ? 'white' : 'black');
            for(let i = 0; i < pieces.length; ++i){
                let p = pieces[i];
                if(p.constructor.name === 'King'){
                    let kPos = p.position;
                    this.log.addEvent('Capture King:' + JSON.stringify(p));
                    p.position = null; 
                    this.chessBoard.board[kPos.x][kPos.y] = null; // Remove the king from the board
                    this.chessBoard.capturedPieces.push(p);
                    this.saveFen();//finalize in DB before return we can also use this as a trigger instead of sending checkMate
                }
            }
        }
        this.status = this.evaluateStatus(); // Evaluate the status of the game
    }
    /**
     * Evaluates and returns the current status of the chess game.
     *
     * The method checks for various endgame conditions in the following order:
     * 1. If the status is already set, it returns the existing status.
     * 2. Checks for checkmate, stalemate, material draw, and 50-move rule draw.
     * 3. Returns 'Active' if none of the above conditions are met.
     *
     * @returns {string} The current status of the game. Possible values are:
     *   - 'checkmate': The game is over due to checkmate.
     *   - 'stalemate': The game is over due to stalemate.
     *   - 'materialdraw': The game is a draw due to insufficient material.
     *   - 'claimdraw': The game can be claimed as a draw (e.g., 50-move rule).
     *   - 'Active': The game is still ongoing.
     */
    evaluateStatus(){
        if(this.status !== '') return this.status;//Never override
        const fen = this.chessBoard.fen;
        const materialDraw = MoveUtils.evaluateMaterialsDraw(fen);
        const stalemate = MoveUtils.evaluateStalemate(fen);
        if(this.CheckMate){
            return 'checkmate';
        }else if(stalemate){
            return 'stalemate';
        }else if(materialDraw){
            return 'materialdraw';
        }else if(this.chessBoard.fen.split(' ')[4] >= 50){
            return 'claimdraw';
        }else{
            return 'Active';
        }
    }
    /**
     * Processes the AI's move in the chess game.
     * 
     * Retrieves the best move from the AI engine, parses the move into coordinates,
     * and requests the move to be made on the chess board. Handles promotion if present.
     * Throws an ApiError if any error occurs during the process.
     * 
     * @async
     * @returns {Promise<*>} The result of the move request.
     * @throws {ApiError} If an error occurs during the AI move processing.
     */
    async processAiMove(){
        console.log('*****************START AI Turn*****************');
        try{
            //get Move from AI
            const move = await getBestMove(this.chessBoard.fen);

            //preapare move
            let from = move.slice(0, 2);
            let to = move.slice(2, 4); 
            const promotionChar = move.length === 5 ? move[4] : '';
            from = FenUtils.fromAlgebraic(from);
            to = FenUtils.fromAlgebraic(to);
            from = {x: parseInt(from[0], 10), y: parseInt(from[1], 10)};
            to = {x: parseInt(to[0], 10), y: parseInt(to[1], 10)};

            //move
            return this.requestMove(from, to, promotionChar);
        }catch(err){
            throw new ApiError('ERROR During AI move: ' + err.message, 500);
        }
        

        
        
        console.log('*****************END AI Turn*****************');
    }
    /**
     * Generates and saves the current FEN (Forsyth-Edwards Notation) string for the chess board,
     * updates it in the database, and also saves the captured pieces string.
     *
     * @returns {boolean} Returns true if both the FEN and captured pieces were successfully saved to the database, otherwise false.
     */
    saveFen(){
        //generate and save fen
        this.chessBoard.fen = this.chessBoard.createFen(); //update fen in service
        //set fen in DB
        let result = false;
        if(this.db.setGameFen(this.gameId, this.chessBoard.fen) === 1){
            result = true;
        }else{
            return false;
        }
        //Set captured string in DB
        if(this.db.setGameCaptures(this.gameId, FenUtils.parseCapturedPiece(this.chessBoard.capturedPieces)) === 1){
            result = true;
        }else{
            return false;
        }

        return result; // succesfully completed
    }
}
module.exports = ChessGameService;