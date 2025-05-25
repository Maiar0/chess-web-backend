const ChessBoard = require('../../domain/chess/board/ChessBoard.js')

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
        if(!king) throw new Error('No king found on board.');
        if (king.getMoves(dummyBoard).length > 0) return false;
        for(let i = 0; i < pieces.length; ++i){
            const piece = pieces[i];
            const moves = piece.getMoves(dummyBoard);
            for(let o = 0; o < moves.length; ++o){
                const to = moves[o];
                const from = piece.position;
                if(!this.simulationKingCheck(fen, from, to)){
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
}
module.exports = MoveUtils;