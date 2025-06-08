const ChessBoard = require('../../domain/chess/board/ChessBoard');
const MoveUtils = require('../../utils/chess/MoveUtils');
const FenUtils = require('../../utils/chess/FenUtils');
const {getBestMove} = require('../../utils/chess/StockFishUtil');
const {createGameDB, getGameFen, setGameFen, setGameCaptures, getGameCaptures, getPlayer, setPlayer } = require('../../db/dbManager');
const ApiError = require('../../utils/ApiError');

class ChessGameService{
    constructor(gameId, log){
        this.log = log; // Initialize the log session
        if(gameId === undefined || gameId === null || gameId === '') {
            this.gameId = this.createGameId();
            createGameDB(this.gameId);
        }else{
            this.gameId = gameId;
        }
        this.capturedString = getGameCaptures(gameId);
        this.chessBoard = new ChessBoard(getGameFen(this.gameId), {captures : this.capturedString}); // Create a new chess board using the FEN string
        this.CheckMate = false; //TODO:: this is a problem
        this.isAi = getPlayer(gameId, 'black') === 'ai'; // Flag to indicate if the game is against AI
    }
    createGameId(){// Generate a random game ID
        this.log.addEvent('creating game')
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 9; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    newGame(isAi = false){
        if(isAi){
            setPlayer(this.gameId, 'black', 'ai');
            let player = getPlayer(this.gameId, 'black');
            this.log.addEvent('This is AI Game');
        }
        return true;
    }
    //TODO:: should set players on first loads of game, White is always set by whoever loads in first, black thereafter.
    infoGame(playerId){
        const color = this.chessBoard.activeColor === 'w' ? 'white': 'black';
        const opponentColor = this.chessBoard.activeColor === 'w' ? 'black': 'white';
        const currentPlayer = getPlayer(this.gameId, color)
        const opponentPlayer = getPlayer(this.gameId, opponentColor)
        if(!currentPlayer && playerId !== opponentPlayer){
            setPlayer(this.gameId, color, playerId);
        }else{
            //TODO:: do nothing?
            //throw new ApiError(`Color "${color}" is already assigned to another player.`, 403);
        }
        return true;
    };
    requestMove(from, to, promoteTo, playerId){// Request a move from the user
        if(!this.isPlayersTurn(playerId)){
            throw new ApiError('Not your turn.', 403);
        }

        if(this.validateMove(from,to)){//Check if piece can move
            const piece = this.chessBoard.getPiece(from.x, from.y);
            if(this.chessBoard.move(from, to, promoteTo)){//move is completed
                this.endTurn();//end turn
                this.log.addEvent('Move successful From:' + JSON.stringify(from) +'To:' +  JSON.stringify(to) + 'promoteChar:' + JSON.stringify(promoteTo));
            }
        }
        return true;
    }
    isPlayersTurn(playerId){
        const color = this.chessBoard.activeColor === 'w' ? 'white': 'black';
        const currentPlayer = getPlayer(this.gameId, color)
        if(playerId === currentPlayer){
            console.log('***Player can Move***');
            return true; // Player is allowed to make a move 
        }else{
            if(this.isAisTurn()){
                console.log('***AI can Move***');
                return true; // AI is allowed to make a move
            }
            //TODO:: to enable multiplayer, throw here.
            console.log('***Not Players turn***');
            return false; // Player is not allowed to make a move
        }
    }
    isAisTurn(){
        if(this.chessBoard.fen.split(' ')[1] ==='b'){
            if(this.isAi){
                return true; // AI's turn
            }
        }
        return false; // Not AI's turn
    }
            
    validateMove(from, to){// Validate the move requested by the user TODO:: Work on order of checks
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
    async endTurn(){
        //Full move counter
        if(this.chessBoard.activeColor === 'b') this.chessBoard.fullmove =  (parseInt(this.chessBoard.fullmove,10) + 1).toString();
        this.chessBoard.activeColor = this.chessBoard.activeColor === 'w' ? 'b' : 'w';//switch active color
        this.saveFen(); // Save the current FEN string to the database
        if(MoveUtils.simulationKingCheckMate(this.chessBoard.fen)){
            console.log("CheckMate")
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
    }
    async processAiMove(){//TODO:: there is something wrong with this, random validation errors
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
    saveFen(){
        //generate and save fen
        this.chessBoard.fen = this.chessBoard.createFen(); //update fen in service
        //set fen in DB
        let result = false;
        if(setGameFen(this.gameId, this.chessBoard.fen) === 1){
            result = true;
        }else{
            return false;
        }
        //Set captured string in DB
        if(setGameCaptures(this.gameId, FenUtils.parseCapturedPiece(this.chessBoard.capturedPieces)) === 1){
            result = true;
        }else{
            return false;
        }

        return result; // succesfully completed
    }
}
module.exports = ChessGameService;