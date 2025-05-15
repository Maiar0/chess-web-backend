const ChessGameService = require('./services/chess/ChessGameService');
const ChessBoard = require('./domain/chess/board/ChessBoard');

const service = new ChessGameService('v974ayhrg'); // Create a new instance of ChessGameService with a test game ID
const chessBoard = service.chessBoard; // Get the chess board from the service
const printbd = () => console.log(service.chessBoard.printBoard()); // Log the game ID to the console
function testCapture(){
    chessBoard.resetBoard(); // Reset the chess board to the initial state
    printbd(); // Print the initial board state
    console.log("Request Move:", service.handleAction({action: 'move', from: {x: 0, y: 1}, to: {x: 0, y: 3}, promoteTo: null})); // Move a pawn from (0, 1) to (0, 3)
    console.log("Request Move:", service.handleAction({action: 'move', from: {x: 1, y: 6}, to: {x: 1, y: 4}, promoteTo: null})); // Move a pawn from (0, 1) to (0, 3)
    console.log("Request Move:", service.handleAction({action: 'move', from: {x: 0, y: 3}, to: {x: 1, y: 4}, promoteTo: null})); // Move a pawn from (0, 1) to (0, 3)
    console.log('captured: ', chessBoard.capturedPieces);
    printbd(); // Print the board state after the move
}
testCapture();