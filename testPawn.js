const ChessBoard = require('./domain/chess/board/ChessBoard');
const Pawn = require('./domain/chess/pieces/Pawn');
const enPassantFen = "rnbqkbnr/pppppppp/8/pP6/8/8/PPPPPPPP/RNBQKBNR w KQkq a5 0 1";
let chessBoard = new ChessBoard(enPassantFen);
const printbd = () => console.log(chessBoard.printBoard()); // Log the game ID to the console
let piece = chessBoard.getPiece(1, 4); // Get the piece at (0, 1)
console.log(piece.constructor.name, piece.color, piece.position); // Get the piece at (0, 0)
printbd();
console.log(piece.getMoves(chessBoard)); // Get the moves for the piece at (0, 2)
