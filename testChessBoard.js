const ChessBoard = require('./services/chess/board/ChessBoard');

const fenPositions = [
    // 1. Standard starting position
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",

    // 2. Midgame position with active minor pieces
    "r1bqk2r/ppp2ppp/2n2n2/3pp3/3PP3/2N2N2/PPP2PPP/R1BQ1RK1 b kq - 5 10",

    // 3. Endgame: only kings and pawns
    "8/8/5k2/2p5/2P5/5K2/8/8 w - - 0 60",

    // 4. Rooks and pawns
    "8/8/8/2k5/8/8/PP4PP/2KRR3 w - - 0 40",

    // 5. Queen vs. pawn — checkmate threat
    "8/7p/8/8/8/6k1/6P1/6KQ w - - 0 72",

    // 6. White ready to promote pawn
    "8/4k3/8/8/8/8/5P2/4K3 w - - 0 80"
];
let fen = fenPositions[0]; // FEN string for the chess board
const chessBoard = new ChessBoard(fen); // Create a new chess board with the given FEN string
//console.log(chessBoard.board); // Log the board to the console
console.log(chessBoard.activeColor, chessBoard.castlingAvaible, chessBoard.enPassante, chessBoard.halfmove, chessBoard.fullmove)
console.log(chessBoard.isOccupied(0, 0) === true); // Check if the square at (0, 0) is occupied
console.log(chessBoard.isOccupied(2, 2) === false); // Check if the square at (2, 1) is occupied
console.log(chessBoard.fen); // Log the FEN string to the console
console.log(chessBoard.createFen() === chessBoard.fen); // Create a FEN string from the current board state
console.log(chessBoard.getThreatMap('white')); // Log the threat map to the console

