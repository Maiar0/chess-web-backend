const ChessBoard = require('../../../../domain/chess/board/ChessBoard');
describe('Knight tests', () => {
    test('test getMoves start rank',()=>{ 
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        let board = new ChessBoard(fen);
        let piece = board.getPiece(1, 0); // Get the knight at b1
        expect(piece.color).toBe('white');
        expect(piece.constructor.name).toBe('Knight');
        let moves = piece.getMoves(board);
        expect(moves.length).toBe(2); // Knight at start rank should have 2 possible moves
        expect(moves).toEqual([
            { x: 2, y: 2, capture: false }, // a3
            { x: 0, y: 2, capture: false }  // c3
        ]);
        piece = board.getPiece(1, 7); // Get the knight at b8
        expect(piece.color).toBe('black');
        expect(piece.constructor.name).toBe('Knight');
        moves = piece.getMoves(board);
        expect(moves.length).toBe(2); // Knight at start rank should have 2 possible moves
        expect(moves).toEqual([
            { x: 2, y: 5, capture: false }, // a6
            { x: 0, y: 5, capture: false }  // c6
        ]);
    });
    test('test getMoves full Set',()=>{
        const fen = 'r1bqkbnr/pppppppp/8/2N5/3n4/8/PPPPPPPP/R1BQKBNR w KQkq - 5 3';
        let board = new ChessBoard(fen);
        let piece = board.getPiece(2, 4); // Get the knight at c5
        expect(piece.color).toBe('white');
        expect(piece.constructor.name).toBe('Knight');
        let moves = piece.getMoves(board);
        expect(moves.length).toBe(8); // Knight should have 8 possible moves
        let expectedMoves = [
            { x: 0, y: 5, capture: false }, 
            { x: 0, y: 3, capture: false }, 
            { x: 4, y: 5, capture: false }, 
            { x: 4, y: 3, capture: false },
            { x: 1, y: 2, capture: false }, 
            { x: 3, y: 2, capture: false }, 
            { x: 1, y: 6, capture: true }, 
            { x: 3, y: 6, capture: true }  
        ]
        expectedMoves.forEach(move => {
            expect(moves).toContainEqual(move);
        });

    });
});