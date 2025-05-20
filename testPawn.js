const ChessBoard = require('./domain/chess/board/ChessBoard');
const Pawn = require('./domain/chess/pieces/Pawn');

let chessBoard = new ChessBoard("rnbqkbnr/p1pppppp/1P6/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
const printbd = () => console.log(chessBoard.printBoard()); // Log the game ID to the console
let piece = chessBoard.getPiece(1, 5); // Get the piece at (0, 1)
console.log(piece.constructor.name, piece.color, piece.position); // Get the piece at (0, 0)
printbd();
console.log(piece.getMoves(chessBoard)); // Get the moves for the piece at (0, 2)
