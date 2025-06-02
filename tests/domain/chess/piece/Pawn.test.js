const ChessBoard = require('../../../../domain/chess/board/ChessBoard');
describe('Pawn Tests', () => {
    test('test getMoves start rank',()=>{
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const board = new ChessBoard(fen);
        const piece = board.getPiece(0, 1); // Get the knight at a1
        const moves = piece.getMoves(board);
        expect(moves.length).toBe(2); // pawn is at start rank should have 2 possible moves
        expect(moves).toEqual([
            { x: 0, y: 2, capture: false }, // a3
            { x: 0, y: 3, capture: false }  // a4
        ]);
    })
    test('test getMoves normal move',()=>{
        const fen = 'rnbqkbnr/ppppppp1/8/7p/1P6/8/P1PPPPPP/RNBQKBNR w KQkq h6 0 2';// pawn at b4 alone no possible capture not at start rank
        const board = new ChessBoard(fen);
        const piece = board.getPiece(1, 3); // Get the pawn at b4
        const moves = piece.getMoves(board);
        expect(moves.length).toBe(1); // pawn is not at start rank should have 1 possible move
        expect(moves).toEqual([
            { x: 1, y: 4, capture: false } // b5
        ]);
    })
    test('test getMoves capture move',()=>{
        const fen = 'rnbqkbnr/2ppppp1/8/Pp5p/P7/8/2PPPPPP/RNBQKBNR w KQkq b6 0 4';// a5 is occupied blocking only move black pawn at b5
        const board = new ChessBoard(fen);
        const piece = board.getPiece(0, 3); // Get the pawn at a4
        const moves = piece.getMoves(board);
        expect(moves.length).toBe(1); // pawn not at start rank normal move blocked, capture possible
        expect(moves).toEqual([
            { x: 1, y: 4, capture: true } // capture at b5
        ]);
    })
    test('test getMoves en passant move',()=>{
        let fen = '1nbqkbnr/2ppppp1/r7/Pp5p/P6P/8/2PPPPP1/RNBQKBNR w KQk b6 0 5';// a6 is occupied blocking only move black pawn at b5
        let board = new ChessBoard(fen);
        let piece = board.getPiece(0, 4); // Get the pawn at a5
        let moves = piece.getMoves(board);
        expect(moves.length).toBe(1); // pawn not at start rank normal move blocked, en passant possible, capture not possible
        expect(moves).toEqual([
            { x: 1, y: 5, capture: true } // capture at b5
        ]);
        //ensure en passant only valid to correct pawn
        piece = board.getPiece(7, 3); // Get the pawn at h4
        moves = piece.getMoves(board);
        expect(moves.length).toBe(0); // pawn should have no moves
        //test left en passant
        fen = 'rnbqkbnr/ppppp2p/6p1/5pP1/8/8/PPPPPP1P/RNBQKBNR w KQkq f6 0 3';// g6 is occupied blocking only move black pawn at f5
        board = new ChessBoard(fen);
        piece = board.getPiece(6, 4); // Get the pawn at g5
        moves = piece.getMoves(board);
        expect(moves.length).toBe(1); // pawn not at start rank normal move blocked, en passant possible, capture not possible
        expect(moves).toEqual([
            { x: 5, y: 5, capture: true } // capture at f5
        ]);
        //test color checking
        fen = 'rnbqkbnr/p1pppppp/8/8/1pP4P/1P6/P2PPPP1/RNBQKBNR b KQkq c3 0 3'; // b3 occupied blocking normal move, en passant possible at c3
        board = new ChessBoard(fen);
        piece = board.getPiece(1, 3); // Get the pawn at b4
        moves = piece.getMoves(board);
        expect(moves.length).toBe(1); // pawn not at start rank normal move blocked, en passant possible, capture not possible
        expect(moves).toEqual([
            { x: 2, y: 2, capture: true } // capture at c3
        ]);
    })
})
