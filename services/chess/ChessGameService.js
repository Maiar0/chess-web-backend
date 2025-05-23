const ChessBoard = require('../../domain/chess/board/ChessBoard');
const { getGameDB, createGameDB, getGameFen, setGameFen } = require('../../db/dbManager');
const { response } = require('express');
const ApiError = require('../../utils/ApiError');

class ChessGameService{
    constructor(gameId){
        if(gameId === undefined || gameId === null || gameId === '') {
            this.gameId = this.createGameId();
            createGameDB(this.gameId);
        }else{
            this.gameId = gameId;
        }
        this.officialFen = getGameFen(this.gameId); // Get the FEN string from the database
        this.chessBoard = new ChessBoard(this.officialFen); // Create a new chess board using the FEN string
    }
    createGameId(){// Generate a random game ID
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 9; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    newGame(){
        return true;
    }
    handleAction({action, from, to, promoteTo}){// Handle the action requested by the user
        let result = false;
        switch(action){
            case 'move':
                result = this.requestMove(from,to);
                break;
            case 'promote':
                result = this.requestPromotion(from, to, promoteTo);
                break;
            case 'newGame':
                result = true;
                break;
            case 'info':
                result = true;
                break;
            default: 
                console.log("Action Unknown!?!");
        }
        if(result){
            this.endTurn();
            return true;
        }else{
            console.log("Failed to:", action);
            return false;
        }
    }//TODO:: This needs removed
    endTurn(){
        this.chessBoard.activeColor = this.chessBoard.activeColor === 'w' ? 'b' : 'w';
        this.saveFen(); // Save the current FEN string to the database
        return true;
    }
    requestMove(from, to){// Request a move from the user
        if(this.validateMove(from,to)){//Check if piece can move
            const piece = this.chessBoard.getPiece(from.x, from.y);
            //TODO:: This logic will need to be on front end, Pawn promotion
            if(piece.constructor.name === 'Pawn' && to.y === (piece.color === 'white' ? 7 : 0)){
                return this.requestPromotion(from, to, piece.color === 'white' ? 'Q' : 'q');
            }
            //Check if move is enPassant
            if(parseInt(this.chessBoard.enPassant[0], 10) === to.x && parseInt(this.chessBoard.enPassant[1], 10) === to.y){
                console.log('enPassant move from', from, 'to', to);
                return this.chessBoard.enPassantMove(from, to);
            }
            if(this.chessBoard.board[to.x][to.y] !== null){//Check if move is capture
                console.log('Capturing piece from', from, 'to', to);
                return this.chessBoard.capturePiece(from, to);
            }else{// Not a capture
                console.log('Moving piece from', from, 'to', to);
                return this.chessBoard.movePiece(from, to);
            }
        }else{
            console.log('Invalid move from', from, 'to', to, 'THIS SHOULD NOT PRINT');
            return false; // Move is invalid
        }
    }
    requestPromotion(from, to, promoteTo){// Request a promotion from the user
        this.chessBoard.promotePiece(from, to, promoteTo);//Lets promote
        return true;
    }
            
    validateMove(from, to){// Validate the move requested by the user TODO:: Work on order of checks
        let piece = this.chessBoard.getPiece(from.x,from.y);
        
        if(piece === null) // Check if there is a piece at the from position
            {throw new ApiError("validateMove: No piece at from position", 437);}; 

        if(piece.color.charAt(0).toLowerCase() !== this.chessBoard.activeColor.charAt(0).toLowerCase()) // Check if the piece is the correct color
            {throw new ApiError("validateMove: Invalid piece color", 436);}; 

        if(this.simulateMoveCheck(from, to)){
            throw new ApiError('King is in Check.', 423);
        }
        
        let possibleMoves = piece.getMoves(this.chessBoard);
        let result = false;
        possibleMoves.forEach(element => {
            if (element.x === to.x && element.y === to.y){
                result = true; // Move is valid
            }
        });
        if(!result) throw new ApiError("validateMove: Invalid move FROM = valid, TO = invalid", 437); // Move is invalid
        return result; // Return the result of the validation
    }
    //set up fake scenario to see if non king piece move and return check status
    simulateMoveCheck(from, to){
        console.log('START SIMULATION----------------------');
        const dummyBoard = new ChessBoard(this.officialFen);//fen
        let piece = dummyBoard.getPiece(from.x,from.y);//get piece at from
        dummyBoard.board[to.x][to.y] = piece;//move piece
        piece.position = {x: to.x, y: to.y};
        dummyBoard.board[from.x][from.y] = null;//clear last space
        dummyBoard.generateThreatMap(dummyBoard.activeColor === 'w' ? 'black': 'white');//generate map
        dummyBoard.printThreatMap();
        dummyBoard.printBoard();
        console.log("simulateMoveCheck" , dummyBoard.kingInCheck)
        console.log("STOP SIMULATION-----------------------")
        return dummyBoard.kingInCheck;//return if king is in check?
    }
    saveFen(){
        //Save Fen back to database
        this.chessBoard.fen = this.chessBoard.createFen(); // TODO:: This is dumb
        return setGameFen(this.gameId, this.chessBoard.fen); // Save the current FEN string to the database
    }
}
module.exports = ChessGameService;