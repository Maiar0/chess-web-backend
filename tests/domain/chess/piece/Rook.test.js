const ChessBoard = require('../../../../domain/chess/board/ChessBoard');
describe('Rook tests', () => {
    test('test getMoves start posiiton',()=>{ 
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const board = new ChessBoard(fen);
        const piece = board.getPiece(0,0);
        expect(piece.constructor.name).toBe('Rook');
        const moves = piece.getMoves(board);
        expect(moves.length).toBe(0);
    }); 
});