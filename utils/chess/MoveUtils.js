const ChessBoard = require('../../domain/chess/board/ChessBoard.js');
const ApiError = require('../ApiError.js');

class MoveUtils{
    //simulates a move and returns if King is in CHECK
    static simulationKingCheck(fen, from, to){//TODO:: Create Error codes to explain why kingInCheck
        console.log('*************START SIMULATION*************');
        const dummyBoard = new ChessBoard(fen);//fen
        let piece = dummyBoard.getPiece(from.x,from.y);//get piece at from
        dummyBoard.board[to.x][to.y] = piece;//move piece
        piece.position = {x: to.x, y: to.y};
        dummyBoard.board[from.x][from.y] = null;//clear last space
        dummyBoard.generateThreatMap(dummyBoard.activeColor === 'w' ? 'black': 'white');//generate map
        console.log("*************STOP SIMULATION*************")
        return dummyBoard.kingInCheck;//return if king is in check?
    }
    //Checks if provided fen king is in check mate and returns result
    static simulationKingCheckMate(fen){
        const dummyBoard = new ChessBoard(fen);
        const pieces = dummyBoard.getPieces(dummyBoard.activeColor === 'w' ? 'white': 'black');//get all pieces to test
        const king = pieces.find(p => p.constructor.name === 'King');//get King
        if(!king) throw new ApiError('No king found on board.', 400);
        if (king.getMoves(dummyBoard).length > 0) return false;
        for(let i = 0; i < pieces.length; ++i){
            const piece = pieces[i];
            const moves = piece.getMoves(dummyBoard);
            for(let o = 0; o < moves.length; ++o){
                const to = moves[o];
                const from = piece.position;
                if(!this.simulationKingCheck(fen, from, to)){
                    console.log("We found a move!", from, to);
                    return false;//We have a move
                }
            }
        }
        return true;//CHECK MATE
    }
    
    static isKingInCheck(fen){
        const dummyBoard = new ChessBoard(fen);
        return dummyBoard.kingInCheck;
    }
    static castlingPossible(fen, from, to){
        console.log('*************START CASTLING CHECK*************');
        const dummyBoard = new ChessBoard(fen);
        if(dummyBoard.kingInCheck) return false; // King is in check, castling not possible

        //verifies we requested a castling move
        const king = dummyBoard.getPiece(from.x, from.y);
        if(!this.isCastlingMove(king, from, to)) return false;

        //Check FEN
        let fenIndicator = dummyBoard.activeColor === 'w' ? 'KQ' : 'kq'; // Determine the castling indicator based on active color
        fenIndicator = to.x === 6 ? fenIndicator.charAt(0) : fenIndicator.charAt(1); // Determine the castling indicator based on the target position
        if(!dummyBoard.castlingAvaible.includes(fenIndicator)) throw new ApiError('Castling not availble', 403); // castling not available
        
        // check if possible castling move
        const color = dummyBoard.activeColor === 'w' ? 'white' : 'black';
        const finalPos = {x: to.x === 6 ? 5 : 3, y: from.y}; // Final position of the rook after castling
        const startPos = {x: to.x === 6 ? 7 : 0, y: from.y}; // Starting position of the rook
        const rook = dummyBoard.getPiece(startPos.x, startPos.y);
        if(rook !== null && rook.constructor.name !== 'Rook') throw new ApiError('Castling not possible, Rook is not in correct position', 403); // Rook is not in correct position
        //check if path unblocked check threat
        if(this.isValidMove(dummyBoard, rook, finalPos) && dummyBoard.getPiece(finalPos.x, finalPos.y ) === null){
            //Check if squares are threatened
            if(!dummyBoard.isThreatened(to.x,to.y) && !dummyBoard.isThreatened(finalPos.x, finalPos.y)){
                console.log('*****Castling squares are not threatened, castling is possible******');
                return true; // Castling is possible
            }
        }
        console.log('*****Castling squares are threatened or not valid, castling is not possible******');
        return false; // Castling not possible
    }
    //evaluares if this is a castling move
    static isCastlingMove(piece, from, to){
        if(piece !== null && piece.constructor.name === 'King' && Math.abs(to.x - from.x) === 2){
            console.log('Castling move detected from', from, 'to', to);
            return true;
        }
        console.log('Not a castling move from', from, 'to', to);
        return false; 
    }
    //validates if a piece can move to a position
    static isValidMove(board, piece, to) {
        let possibleMoves = piece.getMoves(board);
        for(let i = 0; i < possibleMoves.length; ++i){
            const element = possibleMoves[i];
            if (element.x === to.x && element.y === to.y){
                return true; // Move is valid
            }
        }
        return false;
    }
}
module.exports = MoveUtils;