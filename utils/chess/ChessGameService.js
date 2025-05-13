const ChessBoard = require('./board/ChessBoard');
const dbManager = require('../db/dbManager');
const { getGameDB, createGameDB } = require('../../db/dbManager');

class ChessGameService{
    constructor(gameId){
        if(gameId === undefined) this.gameId = this.createGameId;
        this.officialFen = createGameDB(this.gameId);
        this.chessBoard = new ChessBoard(this.officialFen);
    }
    createGameId(){
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 9; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    requestMove(from, to){
        if(this.validateMove(from,to)){//Check if piece can move
            if(this.chessBoard.board[to.x][to.y] !== null){//Check if move is capture
                this.chessBoard.capturePiece(from, to);
            }else{// Not a capture
                this.chessBoard.movePiece(from, to);
            }
        }else{
            //TODO:: terminate?
        }
    }
    requestPromotion(from, to, promoteTo){
        let piece = this.chessBoard.getPiece(from.x,from.y);
        let promotionRank = 'white' === piece.color ? 7 : 0;
        if(piece.constructor.name === 'Pawn' && to.y === promotionRank){
            this.chessBoard.promotePiece(from,to, promoteTo);
        }
    }
    validateMove(from, to){
        let possibleMoves = this.chessBoard.getPiece(from.x,from.y).getMoves(this.chessBoard.board)
        possibleMoves.forEach(element => {
            if (element.x === to.x && element.y === to.y){
                return true;
            }
        });
        return false;
    }
    validateCheck(color){
        if(this.chessBoard.activeColor !== color) this.chessBoard.generateThreatMap(color); // TODO:: This may cause an issues not able to test yet.
        let king = this.chessBoard.getPieces(color, 'King')[0]; // Get the king of the specified color
        let kingPosition = king.position; // Get the position of the king
        if(this.chessBoard.isThreatened(kingPosition.x, kingPosition.y, color)){ // Check if the king is threatened
            return true; // The king is in check
        }
        else false; // The king is not in check
    }
    
}