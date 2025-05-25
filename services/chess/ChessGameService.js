const ChessBoard = require('../../domain/chess/board/ChessBoard');
const MoveUtils = require('../../utils/chess/MoveUtils');
const FenUtils = require('../../utils/chess/FenUtils');
const {createGameDB, getGameFen, setGameFen, setGameCaptures, getGameCaptures } = require('../../db/dbManager');
const ApiError = require('../../utils/ApiError');

class ChessGameService{
    constructor(gameId){
        if(gameId === undefined || gameId === null || gameId === '') {
            this.gameId = this.createGameId();
            createGameDB(this.gameId);
        }else{
            this.gameId = gameId;
        }
        this.capturedString = getGameCaptures(gameId);
        this.officialFen = getGameFen(this.gameId); // Get the FEN string from the database
        this.chessBoard = new ChessBoard(this.officialFen, {captures : this.capturedString}); // Create a new chess board using the FEN string
        this.CheckMate = false;
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
                return this.chessBoard.enPassantCapture(from, to);
            }
            //Check if move is capture
            if(this.chessBoard.board[to.x][to.y] !== null){
                console.log('Capturing piece from', from, 'to', to);
                return this.chessBoard.capturePiece(from, to);
            }else{// Not a capture
                console.log('Moving piece from', from, 'to', to);
                return this.chessBoard.movePiece(from, to);
            }
        }else{
            console.log('Invalid move from', from, 'to', to, '*************THIS SHOULD NOT PRINT*************');
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

        if(MoveUtils.simulationKingCheck(this.officialFen,from, to)){
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
    endTurn(){
        //Full move counter
        if(this.chessBoard.activeColor === 'b') this.chessBoard.fullmove =  (parseInt(this.chessBoard.fullmove,10) + 1).toString();
        this.chessBoard.activeColor = this.chessBoard.activeColor === 'w' ? 'b' : 'w';//switch active color
        this.capturedString = FenUtils.parseCapturedPiece(this.chessBoard.capturedPieces);
        this.saveFen(); // Save the current FEN string to the database
        if(MoveUtils.simulationKingCheckMate(this.officialFen)){
            console.log("CheckMate")
            this.CheckMate = true;
        }
        return true;
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