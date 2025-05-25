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
    
    static simulationKingCheckMate(fen){
        const dummyBoard = new ChessBoard(fen);
        dummyBoard.generateThreatMap(dummyBoard.activeColor === 'w' ? 'white' : 'black')
        dummyBoard.printThreatMap();
        dummyBoard.printBoard();
    }
}
module.exports = MoveUtils;