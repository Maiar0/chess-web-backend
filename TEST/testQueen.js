const ChessBoard = require('./utils/chess/board/ChessBoard');

let chessBoard = new ChessBoard("rnbqkbnr/pppppppp/8/8/3Q4/8/PPPPPPPP/RNBQKBNR w KQkq c3 0 1");
console.log(chessBoard.board); // Log the board to the console
let piece = chessBoard.getPiece(3, 3); // Get the piece at (0, 1)
if (piece === null) {
    console.log("No piece found");
    return 1;
}
console.log(piece.constructor.name, piece.color, piece.position); // Get the piece at (0, 0)
console.log(piece.getMoves(chessBoard)); // Get the moves for the piece at (0, 2)
