const ChessBoard = require('./board/ChessBoard');
const { getGameDB, createGameDB, getGameFen, setGameFen } = require('../../db/dbManager');

class ChessGameService{
    constructor(gameId){
        if(gameId === undefined) {
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
    handleAction({action, from, to, promoteTo}){// Handle the action requested by the user
        let result = false;
        switch(action){
            case 'move':
                result = this.requestMove(from,to);
                break;
            case 'promote':
                result = this.requestPromotion(from, to, promoteTo);
                break;
            default: 
                console.log("Action Unknown!?!");
        }
        if(result){
            this.chessBoard.activeColor = this.chessBoard.activeColor === 'w' ? 'b' : 'w';
            return true;
        }else{
            console.log("Failed to:", action)
            return false;
        }
    }
    requestMove(from, to){// Request a move from the user
        if(this.validateMove(from,to)){//Check if piece can move
            if(this.chessBoard.board[to.x][to.y] !== null){//Check if move is capture
                console.log('Capturing piece from', from, 'to', to);
                return this.chessBoard.capturePiece(from, to);
            }else{// Not a capture
                console.log('Moving piece from', from, 'to', to);
                return this.chessBoard.movePiece(from, to);
            }
        }else{
            console.log('Invalid move from', from, 'to', to);
            return false; //TODO:: terminate?
        }
    }
    requestPromotion(from, to, promoteTo){// Request a promotion from the user
        let piece = this.chessBoard.getPiece(from.x,from.y);
        let promotionRank = 'white' === piece.color ? 7 : 0;
        if(piece.constructor.name === 'Pawn' && to.y === promotionRank){
            return this.chessBoard.promotePiece(from,to, promoteTo);
        }
    }
    validateMove(from, to){// Validate the move requested by the user
        let piece = this.chessBoard.getPiece(from.x,from.y);
        if(piece === null){return false;}
        let possibleMoves = piece.getMoves(this.chessBoard);
        let result = false;
        possibleMoves.forEach(element => {
            if (element.x === to.x && element.y === to.y){
                result = true; // Move is valid
            }
        });
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