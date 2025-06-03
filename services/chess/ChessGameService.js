const ChessBoard = require('../../domain/chess/board/ChessBoard');
const MoveUtils = require('../../utils/chess/MoveUtils');
const FenUtils = require('../../utils/chess/FenUtils');
const {getBestMove} = require('../../utils/chess/StockFishUtil');
const {createGameDB, getGameFen, setGameFen, setGameCaptures, getGameCaptures, getPlayer, setPlayer } = require('../../db/dbManager');
const ApiError = require('../../utils/ApiError');

class ChessGameService{
    constructor(gameId){
        if(gameId === undefined || gameId === null || gameId === '') {
            this.gameId = this.createGameId();
            createGameDB(this.gameId);
        }else{
            this.gameId = gameId;
        }
        console.log("gameId:", this.gameId)
        this.capturedString = getGameCaptures(gameId);
        this.officialFen = getGameFen(this.gameId); // Get the FEN string from the database
        this.chessBoard = new ChessBoard(this.officialFen, {captures : this.capturedString}); // Create a new chess board using the FEN string
        this.CheckMate = null;
    }
    createGameId(){// Generate a random game ID
        console.log('creating game')
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 9; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    newGame(isAi = false){
        console.log('NEW GAME:', isAi)
        if(isAi){
            console.log('THIS IS AN AI GAME')
            setPlayer(this.gameId, 'black', 'ai');
            let player = getPlayer(this.gameId, 'black');
            console.log('Should be set to ai', player)
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
            console.log('SetPlayer')
            setPlayer(this.gameId, color, playerId);
        }else{
            //TODO:: do nothing?
            //throw new ApiError(`Color "${color}" is already assigned to another player.`, 403);
        }
        return true;
    };
    requestMove(from, to, promoteTo, playerId){// Request a move from the user
        if(!this.isPlayersTurn(playerId)) throw new ApiError('Not your turn.', 403);
        if(this.validateMove(from,to)){//Check if piece can move
            const piece = this.chessBoard.getPiece(from.x, from.y);
            return this.chessBoard.move(from, to, promoteTo);
        }else{
            console.log('Invalid move from', from, 'to', to, '*************THIS SHOULD NOT PRINT*************');
            return false; // Move is invalid
        }
    }
    isPlayersTurn(playerId){
        const color = this.chessBoard.activeColor === 'w' ? 'white': 'black';
        const currentPlayer = getPlayer(this.gameId, color)
        if(playerId === currentPlayer){
            console.log('***Player can Move***');
        }else{
            //TODO:: to enable multiplayer, throw here.
            console.log('***Not Players turn***');
        }
        return true;
    }
    requestPromotion(from, to, promoteTo){// Request a promotion from the user
        this.chessBoard.promotePiece(from, to, promoteTo);//Lets promote
        return true;
    }//TOOD:: Remove
            
    validateMove(from, to){// Validate the move requested by the user TODO:: Work on order of checks
        let piece = this.chessBoard.getPiece(from.x,from.y);
        let board = this.chessBoard;
        if(piece === null) // Check if there is a piece at the from position
            {throw new ApiError("validateMove: No piece at from position", 400);}; 

        if(piece.color.charAt(0).toLowerCase() !== this.chessBoard.activeColor.charAt(0).toLowerCase()) // Check if the piece is the correct color
            {throw new ApiError("validateMove: Invalid piece color", 403);}; 

        if(MoveUtils.simulationKingCheck(this.officialFen,from, to)){//TODO:: Set better error messages
            throw new ApiError('King is in Check.', 403);
        }
        if(MoveUtils.castlingPossible(this.officialFen, from, to)){
            console.log('Castling move from', from, 'to', to);
            return true;//we shouldnt check isValidMove, it is not a valid normal move.
        }
        if(!MoveUtils.isValidMove(board, piece, to)) {
            throw new ApiError("validateMove: Invalid move FROM = valid, TO = invalid", 403);
        }
    
        return true;
    }
    endTurn(){
        //Full move counter
        if(this.chessBoard.activeColor === 'b') this.chessBoard.fullmove =  (parseInt(this.chessBoard.fullmove,10) + 1).toString();
        this.chessBoard.activeColor = this.chessBoard.activeColor === 'w' ? 'b' : 'w';//switch active color
        this.capturedString = FenUtils.parseCapturedPiece(this.chessBoard.capturedPieces);
        this.saveFen(); // Save the current FEN string to the database
        if(MoveUtils.simulationKingCheckMate(this.officialFen)){
            console.log("CheckMate")
            this.CheckMate = true;
        }else{console.log('move was found.');}
        //Check if AIs turn
        console.log('Official Fen:', this.officialFen);
        if(this.officialFen.split(' ')[1] ==='b'){
            const player = getPlayer(this.gameId, 'black');
            console.log('isBlacks turn- Player:', player);
            //check if AI player
            if(getPlayer(this.gameId, 'black') === 'ai'){
                try{
                    this.processAiMove();
                }catch(error){
                    console.log(error);
                }
            }
        }
        return true;
    }
    async processAiMove(){
        console.log('*****************START AI Turn*****************');
        try{
            const move = await getBestMove(this.officialFen);//get Ai move
            //decode move
            console.log('Move:', move);
            const from = move.slice(0, 2);
            const to = move.slice(2, 4); 
            const promotionChar = move.length === 5 ? move[4] : '';
            this.requestMove(from, to, promotionChar);
            //TODO:: we want to return 2 fens not sure how yet.
        }catch(error){console.log(error)}
        
        
        console.log('*****************END AI Turn*****************');
    }
    saveFen(){
        //Save Fen back to database
        let result = false;
        this.officialFen = this.chessBoard.createFen(); //update fen in service
        if(setGameFen(this.gameId, this.officialFen)){result = true;}else{result =false;}
        if(setGameCaptures(this.gameId, this.capturedString)){result = true;}else{result = false;}
        return ; // Save the current FEN string to the database
    }
}
module.exports = ChessGameService;