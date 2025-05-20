const ChessGameService = require('./services/chess/ChessGameService');
const ChessBoard = require('./domain/chess/board/ChessBoard');

const service = new ChessGameService(''); // Create a new instance of ChessGameService with a test game ID
const chessBoard = service.chessBoard; // Get the chess board from the service
const printbd = () => console.log(service.chessBoard.printBoard()); // Log the game ID to the console
testEnPassant();
function testCapture(){
    chessBoard.resetBoard(); // Reset the chess board to the initial state
    printbd(); // Print the initial board state
    console.log("Request Move:", service.handleAction({action: 'move', from: {x: 0, y: 1}, to: {x: 0, y: 3}, promoteTo: null})); // Move a pawn from (0, 1) to (0, 3)
    console.log("Request Move:", service.handleAction({action: 'move', from: {x: 1, y: 6}, to: {x: 1, y: 4}, promoteTo: null})); // Move a pawn from (0, 1) to (0, 3)
    console.log("Request Capture:", service.handleAction({action: 'move', from: {x: 0, y: 3}, to: {x: 1, y: 4}, promoteTo: null})); // Move a pawn from (0, 1) to (0, 3)
    console.log('captured: ', chessBoard.capturedPieces);
    printbd(); // Print the board state after the move
}

// Test promotion by driving a white pawn from its start all the way to rank 8 and then promoting it
function testPromotion() {
    chessBoard.resetBoard();   // Reset to the standard starting position
    printbd();                 // Show initial board

    //White pawn 1
    console.log("Move 1:", service.handleAction({
        action: "move",
        from: { x: 0, y: 1 },
        to:   { x: 0, y: 3 }
    }));

    // 2. Black makes a dummy move so it's white's turn again
    console.log("Black move:", service.handleAction({
        action: "move",
        from: { x: 1, y: 6 },
        to:   { x: 1, y: 4 }
    }));

    // 3. White Pawn 2
    console.log("Move 2:", service.handleAction({
        action: "move",
        from: { x: 1, y: 1 },
        to:   { x: 1, y: 3 }
    }));

    // 4. Black takes white pawn 1
    console.log("Black move:", service.handleAction({
        action: "move",
        from: { x: 1, y: 4 },
        to:   { x: 0, y: 3 }
    }));

    // 5. Pawn 2 Forward
    console.log("Move 3:", service.handleAction({
        action: "move",
        from: { x: 1, y: 3 },
        to:   { x: 1, y: 4 }
    }));

    // 6. Black dummy
    console.log("Black move:", service.handleAction({
        action: "move",
        from: { x: 0, y: 3 },
        to:   { x: 0, y: 2 }
    }));

    // 7. Pawn 2F
    console.log("Move 4:", service.handleAction({
        action: "move",
        from: { x: 1, y: 4 },
        to:   { x: 1, y: 5 }
    }));

    // 8. Black dummy
    console.log("Black move:", service.handleAction({
        action: "move",
        from: { x: 0, y: 2 },
        to:   { x: 0, y: 1 }
    }));
    printbd();
    // 7. Pawn 2F
    console.log("Move 5:", service.handleAction({
        action: "move",
        from: { x: 1, y: 5 },
        to:   { x: 1, y: 6 }
    }));
    // 8. Black dummy
    console.log("Black move:", service.handleAction({
        action: "move",
        from: { x: 0, y: 6 },
        to:   { x: 0, y: 4 }
    }));
    // 9. Pawn to a8 (promotion rank)
    console.log("Move 6:", service.handleAction({
        action:     "promote",
        from:       { x: 1, y: 6 },
        to:         { x: 0, y: 7 },
        promoteTo:  "Q"
    }));

    printbd();   // Final board should show a white queen on a8
}

function testEnPassant() {
    // Reset to the standard starting position
    chessBoard.resetBoard();
    printbd();

    // 1. White pawn e2 (4,1) → e4 (4,3)
    console.log("1. e2→e4:", service.handleAction({
        action:    'move',
        from:      { x: 4, y: 1 },
        to:        { x: 4, y: 3 },
        promoteTo: null
    }));

    // 2. Black pawn h7 (7,6) → h5 (7,4)
    console.log("2. h7→h5:", service.handleAction({
        action:    'move',
        from:      { x: 7, y: 6 },
        to:        { x: 7, y: 4 },
        promoteTo: null
    }));

    // 3. White pawn e4 (4,3) → e5 (4,4)
    console.log("3. e4→e5:", service.handleAction({
        action:    'move',
        from:      { x: 4, y: 3 },
        to:        { x: 4, y: 4 },
        promoteTo: null
    }));

    // 4. Black pawn d7 (3,6) → d5 (3,4), sets en passant target at d6 (3,5)
    console.log("4. d7→d5:", service.handleAction({
        action:    'move',
        from:      { x: 3, y: 6 },
        to:        { x: 3, y: 4 },
        promoteTo: null
    }));

    // 5. White pawn e5 (4,4) captures en passant to d6 (3,5)
    console.log("5. e5xd6 (en passant):", service.handleAction({
        action:    'move',
        from:      { x: 4, y: 4 },
        to:        { x: 3, y: 5 },
        promoteTo: null
    }));

    // 6. Verify the captured pawn and final board
    console.log("Captured pieces:", chessBoard.capturedPieces);
    printbd();
}

