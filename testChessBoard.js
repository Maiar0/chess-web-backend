const ChessBoard = require('./utils/chess/board/ChessBoard');

const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const chessBoard = new ChessBoard(fen); // Create a new chess board with the given FEN string
console.log(chessBoard.board); // Log the board to the console

