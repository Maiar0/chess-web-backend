const ChessBoard = require('../../domain/chess/board/ChessBoard');
const MoveUtils = require('../../utils/chess/MoveUtils');
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
    handleAction({action, from, to, promoteTo}){// Handle the action requested by the user //TODO:: This needs removed
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
    }
    endTurn(){
        //Full move counter
        if(this.chessBoard.activeColor === 'b') this.chessBoard.fullmove =  (parseInt(this.chessBoard.fullmove,10) + 1).toString();
        this.chessBoard.activeColor = this.chessBoard.activeColor === 'w' ? 'b' : 'w';//switch active color
        this.capturedString = this.parseCapturedPiece(this.chessBoard.capturedPieces);
        console.log(this.capturedString);
        this.saveFen(); // Save the current FEN string to the database
        return true;
    }
    parseCapturedPiece(captured){
        if(captured.length > 0){
            let s = '';
            for(let i = 0; i< captured.length; ++i){
                s += captured[i].getFen();
            }
            return s;
        }
        return '';
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
        this.chessBoard.printThreatMap();
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
    //simulate threat map to achieve Check Mate validation
    simulateCheckMate(){
        const dummyBoard = new ChessBoard(this.officialFen);
        dummyBoard.generateThreatMap(dummyBoard.activeColor === 'w' ? 'white' : 'black')
        dummyBoard.printThreatMap();
        dummyBoard.printBoard();
    }
    saveFen(){
        //Save Fen back to database
        let result = false;
        this.chessBoard.fen = this.chessBoard.createFen(); // TODO:: This is dumb
        if(setGameFen(this.gameId, this.chessBoard.fen)){result = true;}else{result =false;}
        if(setGameCaptures(this.gameId, this.capturedString)){result = true;}else{result = false;}
        return ; // Save the current FEN string to the database
    }
}
module.exports = ChessGameService;