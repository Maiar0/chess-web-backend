const ChessBoard = require('../../../../domain/chess/board/ChessBoard');
describe('Queen tests', () => {
    test('test getMoves start posiiton',()=>{ 
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const board = new ChessBoard(fen);
        const piece = board.getPiece(3,0);
        expect(piece.constructor.name).toBe('Queen');
        const moves = piece.getMoves(board);
        expect(moves.length).toBe(0);
    }); 
});