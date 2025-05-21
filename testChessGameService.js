const ChessGameService = require('./services/chess/ChessGameService');
const ChessBoard = require('./domain/chess/board/ChessBoard');

let service = new ChessGameService('4fbz4964y'); // Create a new instance of ChessGameService with a test game ID
const chessBoard = service.chessBoard; // Get the chess board from the service
const printbd = () => console.log(service.chessBoard.printBoard()); // Log the game ID to the console
testKingMovement();
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

    // 1. White pawn a2 
    console.log("1. ", service.handleAction({
        action:    'move',
        from:      { x: 1, y: 1 },
        to:        { x: 1, y: 3 },
        promoteTo: null
    }));

    // 2. Black pawn dummy move
    console.log("2. ", service.handleAction({
        action:    'move',
        from:      { x: 7, y: 6 },
        to:        { x: 7, y: 4 },
        promoteTo: null
    }));

    // 3. White pawn a4
    console.log("3. ", service.handleAction({
        action:    'move',
        from:      { x: 1, y: 3 },
        to:        { x: 1, y: 4 },
        promoteTo: null
    }));

    // 4. Black pawn set up enpassant
    console.log("4. ", service.handleAction({
        action:    'move',
        from:      { x: 0, y: 6 },
        to:        { x: 0, y: 4 },
        promoteTo: null
    }));

    // 5. White pawn captures en passant 
    console.log("Piece moves: ", chessBoard.getPiece(1, 4).getMoves(chessBoard));
    printbd();
    console.log("5. (en passant):", service.handleAction({
        action:    'move',
        from:      { x: 1, y: 4 },
        to:        { x: 0, y: 5 },
        promoteTo: null
    }));

    // 6. Verify the captured pawn and final board
    console.log("Captured pieces:", chessBoard.capturedPieces);
    printbd();
}

function testKingMovement() {//test this with UI. 
    chessBoard.resetBoard();
    printbd();

    // 1. White plays pawn e2 to e4
    console.log("1. ", service.handleAction({
        action:    'move',
        from:      { x: 4, y: 1 },
        to:        { x: 4, y: 3 },
        promoteTo: null
    }));

    // 2. Black plays pawn e7 to e5
    console.log("2. ", service.handleAction({
        action:    'move',
        from:      { x: 4, y: 6 },
        to:        { x: 4, y: 4 },
        promoteTo: null
    }));

    // 3. White plays bishop f1 to c4
    console.log("3. ", service.handleAction({
        action:    'move',
        from:      { x: 5, y: 0 },
        to:        { x: 2, y: 3 },
        promoteTo: null
    }));
    printbd();
    chessBoard.generateThreatMap('black');
    // 4. Black plays queen d8 to h4 (check)
    console.log("4. white king in check", service.handleAction({
        action:    'move',
        from:      { x: 3, y: 7 },
        to:        { x: 7, y: 3 },
        promoteTo: null
    }));
    printbd();
    chessBoard.generateThreatMap('black');
    // 5. White attempts illegal pawn move d2 to d3 THIS WOULD PUT THE KING IN CHECK
    console.log("5. illegal ", service.handleAction({
        action:    'move',
        from:      { x: 3, y: 1 },
        to:        { x: 3, y: 2 },
        promoteTo: null
    }));
    printbd();
    // 6. black dummy
    console.log("6.  ", service.handleAction({
        action:    'move',
        from:      { x: 0, y: 6 },
        to:        { x: 0, y: 4 },
        promoteTo: null
    }));
    printbd();
    chessBoard.generateThreatMap('black');
    // 7. White attempts illegal pawn move d3 to d4 The king should be in check therfore it must get otu of check
    console.log("7. illegal ", service.handleAction({
        action:    'move',
        from:      { x: 3, y: 2 },
        to:        { x: 3, y: 3 },
        promoteTo: null
    }));
    printbd();
}

