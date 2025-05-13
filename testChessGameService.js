const ChessGameService = require('./utils/chess/ChessGameService');
const ChessBoard = require('./utils/chess/board/ChessBoard');

const service = new ChessGameService('v974ayhrg'); // Create a new instance of ChessGameService with a test game ID
const printbd = () => console.log(service.chessBoard.printBoard()); // Log the game ID to the console
printbd(); // Print the initial board state
console.log("Request Move:", service.requestMove({x: 0, y: 1}, {x: 0, y: 3})); // Move a pawn from (0, 1) to (0, 3)
console.log("Save fen:", service.saveFen());
printbd(); // Print the board state after the move