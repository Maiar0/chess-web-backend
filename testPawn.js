const ChessBoard = require('./services/chess/board/ChessBoard');
const Pawn = require('./utils/chess/pieces/Pawn');

let chessBoard = new ChessBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq c3 0 1");
//console.log(chessBoard.board); // Log the board to the console
let piece = chessBoard.getPiece(0, 1); // Get the piece at (0, 1)
console.log(piece.constructor.name, piece.color, piece.position); // Get the piece at (0, 0)
console.log(piece.getMoves(chessBoard)); // Get the moves for the piece at (0, 2)