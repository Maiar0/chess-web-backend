const ChessBoard = require('../../domain/chess/board/ChessBoard');
const { getGameDB, createGameDB, getGameFen, setGameFen } = require('../../db/dbManager');
const { response } = require('express');

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
        if(this.validateMove(from, to)){// TODO:: Clean up if statement
            let piece = this.chessBoard.getPiece(from.x,from.y);
            let promotionRank = 'white' === piece.color ? 7 : 0;//promotion rank for pawn
            if(piece.constructor.name === 'Pawn' && to.y === promotionRank){//Can we promote
                this.requestMove(from,to); //lets move it to make sure we follow Move/capture logic
                this.chessBoard.promotePiece(to, promoteTo);//Lets promote
                return true;
            }else throw new Error("requestPromotion: Invalid promotion request"); // Invalid promotion request
        }
    }
    validateMove(from, to){// Validate the move requested by the user
        let piece = this.chessBoard.getPiece(from.x,from.y);
        if(piece.color.charAt(0).toLowerCase() !== this.chessBoard.activeColor.charAt(0).toLowerCase()) {throw new Error("validateMove: Invalid piece color")}; // Check if the piece is the correct color
        if(piece === null) throw new Error("validateMove: No piece at from position"); // Check if there is a piece at the from position
        let possibleMoves = piece.getMoves(this.chessBoard);
        let result = false;
        possibleMoves.forEach(element => {
            if (element.x === to.x && element.y === to.y){
                result = true; // Move is valid
            }
        });
        if(!result) throw new Error("validateMove: Invalid move FROM = valid, TO = invalid"); // Move is invalid
        return result; // Return the result of the validation
    }
    validateCheck(color){// Validate if the king is in check
        if(this.chessBoard.activeColor !== color) this.chessBoard.generateThreatMap(color); // TODO:: This may cause an issues not able to test yet.
        let king = this.chessBoard.getPieces(color, 'King')[0]; // Get the king of the specified color
        let kingPosition = king.position; // Get the position of the king
        if(this.chessBoard.isThreatened(kingPosition.x, kingPosition.y, color)){ // Check if the king is threatened
            return true; // The king is in check
        }
        else false; // The king is not in check
    }
    saveFen(){
        //Save Fen back to database
        this.chessBoard.fen = this.chessBoard.createFen(); // TODO:: This is dumb
        return setGameFen(this.gameId, this.chessBoard.fen); // Save the current FEN string to the database
    }
}
module.exports = ChessGameService;