const ChessBoard = require('./utils/chess/board/ChessBoard');

const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq c3 0 1";
const chessBoard = new ChessBoard(fen); // Create a new chess board with the given FEN string
console.log(chessBoard.board); // Log the board to the console
console.log(chessBoard.activeColor, chessBoard.castlingAvaible, chessBoard.enPassante, chessBoard.halfmove, chessBoard.fullmove)
console.log(chessBoard.isOccupied(0, 0) === true); // Check if the square at (0, 0) is occupied
console.log(chessBoard.isOccupied(2, 1) === false); // Check if the square at (2, 1) is occupied

