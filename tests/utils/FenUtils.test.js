const FenUtils = require('../../utils/chess/FenUtils');
const ApiError = require('../../utils/ApiError');

// Mock ChessPieceFactory.createPiece
jest.mock('../../domain/chess/pieces/ChessPieceFactory', () => ({
    createPiece: jest.fn((char) => {
        // Only letters representing pieces are valid: p, r, n, b, q, k (case‐insensitive)
        if (/[prnbqkPRNBQK]/.test(char)) {
            return {
                position: null,
                getFen: () => char
            };
        }
        return null;
    })
}));
const ChessPieceFactory = require('../../domain/chess/pieces/ChessPieceFactory');

describe('FenUtils.parseFen', () => {
    beforeEach(() => {
        ChessPieceFactory.createPiece.mockClear();
    });

    test('returns empty 8×8 board for FEN with all empty squares', () => {
        const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
        const board = FenUtils.parseFen(fen);

        // The board should be an 8×8 array of nulls
        expect(board.length).toBe(8);
        for (let x = 0; x < 8; x++) {
            expect(board[x].length).toBe(8);
            for (let y = 0; y < 8; y++) {
                expect(board[x][y]).toBeNull();
            }
        }
        // createPiece should never have been called (no piece chars)
        expect(ChessPieceFactory.createPiece).not.toHaveBeenCalled();
    });

    test('places a single pawn at a1 for "8/8/8/8/8/8/8/P7 w - - 0 1"', () => {
        const fen = '8/8/8/8/8/8/8/P7 w - - 0 1';
        const board = FenUtils.parseFen(fen);

        // createPiece should have been called once with 'P'
        expect(ChessPieceFactory.createPiece).toHaveBeenCalledWith('P');

        // Pawn should be at x=0, y=0 (a1)
        const piece = board[0][0];
        expect(piece).not.toBeNull();
        expect(piece.getFen()).toBe('P');
        expect(piece.position).toEqual({ x: 0, y: 0 });

        // All other squares null
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                if (!(x === 0 && y === 0)) {
                    expect(board[x][y]).toBeNull();
                }
            }
        }
    });

    test('correctly places multiple pieces from FEN', () => {
        // Rooks on a8 and h1, knights on b8/g1
        const fen = 'r1n5/8/8/8/8/8/8/6N R w - - 0 1';
        const board = FenUtils.parseFen(fen);

        // Expected calls: 'r', 'n', 'N'
        expect(ChessPieceFactory.createPiece).toHaveBeenCalledWith('r');
        expect(ChessPieceFactory.createPiece).toHaveBeenCalledWith('n');
        expect(ChessPieceFactory.createPiece).toHaveBeenCalledWith('N');

        // Lowercase 'r' at a8 => x=0, y=7
        let p_a8 = board[0][7];
        expect(p_a8).not.toBeNull();
        expect(p_a8.getFen()).toBe('r');
        expect(p_a8.position).toEqual({ x: 0, y: 7 });

        // 'n' at c8 => x=2, y=7
        let p_c8 = board[2][7];
        expect(p_c8).not.toBeNull();
        expect(p_c8.getFen()).toBe('n');
        expect(p_c8.position).toEqual({ x: 2, y: 7 });

        // Uppercase 'N' at g1 => x=6, y=0
        let p_g1 = board[6][0];
        expect(p_g1).not.toBeNull();
        expect(p_g1.getFen()).toBe('N');
        expect(p_g1.position).toEqual({ x: 6, y: 0 });

        // Everything else is null
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                const isRookOrKnight =
                    (x === 0 && y === 7) ||
                    (x === 2 && y === 7) ||
                    (x === 6 && y === 0);
                if (!isRookOrKnight) {
                    expect(board[x][y]).toBeNull();
                }
            }
        }
    });
});

describe('FenUtils.parseBoard', () => {
    test('generates correct FEN string for single piece on a1', () => {
        // Build an empty board
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));

        // Create a fake piece at a1 (x=0,y=0) whose getFen() returns 'P'
        const pawn = { getFen: () => 'P' };
        board[0][0] = pawn;

        const activeColor = 'w';
        const castling = '-';
        const enPassant = '-';
        const halfMove = '0';
        const fullMove = '1';

        const fen = FenUtils.parseBoard(board, activeColor, castling, enPassant, halfMove, fullMove);
        // Expect row8 through row2 to be "8", and row1 to be "P7", then " w - - 0 1"
        const expectedFen = '8/8/8/8/8/8/8/P7 w - - 0 1';
        expect(fen).toBe(expectedFen);
    });

    test('generates correct FEN string with multiple pieces and enPassant target', () => {
        // Empty board
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));
        // Place a rook at d4 (x=3,y=3), getFen = 'r'
        const rook = { getFen: () => 'r' };
        board[3][3] = rook;
        // Place a Knight at a8 (x=0,y=7), getFen = 'N'
        const knight = { getFen: () => 'N' };
        board[0][7] = knight;

        const activeColor = 'b';
        const castling = 'KQkq';
        const enPassant = '34'; // x=3,y=4 => "d5"
        const halfMove = '5';
        const fullMove = '10';

        const fen = FenUtils.parseBoard(board, activeColor, castling, enPassant, halfMove, fullMove);
        // Construct expected:
        // row8: N7
        // row7: 8
        // row6: 8
        // row5: 8
        // row4: 3r4  (three empty, r, four empty)
        // row3: 8
        // row2: 8
        // row1: 8
        // Then " b KQkq d5 5 10"
        const expectedFen =
            'N7/8/8/8/3r4/8/8/8 b KQkq d5 5 10';
        expect(fen).toBe(expectedFen);
    });
});

describe('FenUtils.parseCaptureString & parseCapturedPiece', () => {
    beforeEach(() => {
        ChessPieceFactory.createPiece.mockClear();
    });

    test('parseCaptureString returns array of pieces for valid string', () => {
        // "pRk" => ['p','R','k']
        const capturedStr = 'pRk';
        const pieces = FenUtils.parseCaptureString(capturedStr);

        expect(pieces).toHaveLength(3);
        expect(ChessPieceFactory.createPiece).toHaveBeenCalledTimes(3);
        expect(ChessPieceFactory.createPiece).toHaveBeenNthCalledWith(1, 'p');
        expect(ChessPieceFactory.createPiece).toHaveBeenNthCalledWith(2, 'R');
        expect(ChessPieceFactory.createPiece).toHaveBeenNthCalledWith(3, 'k');

        // Each piece.getFen() should return the original char
        const fens = pieces.map((p) => p.getFen());
        expect(fens).toEqual(['p', 'R', 'k']);
    });

    test('parseCaptureString throws ApiError on invalid character', () => {
        // CreatePiece will return null for 'X'
        const badStr = 'pXk';
        expect(() => FenUtils.parseCaptureString(badStr)).toThrow(ApiError);
        try {
            FenUtils.parseCaptureString(badStr);
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect(err.message).toMatch('Invalid capture Piece: X');
            expect(err.status).toBe(400);
        }
    });

    test('parseCapturedPiece returns concatenated FENs', () => {
        // Build fake pieces
        const pieceA = { getFen: () => 'q' };
        const pieceB = { getFen: () => 'R' };
        const result = FenUtils.parseCapturedPiece([pieceA, pieceB]);
        expect(result).toBe('qR');
    });

    test('parseCapturedPiece returns empty string for empty array', () => {
        expect(FenUtils.parseCapturedPiece([])).toBe('');
    });
});

describe('FenUtils.toAlgebraic, fromAlgebraic, boundsCheck', () => {
    test('toAlgebraic converts "34" → "d5"', () => {
        expect(FenUtils.toAlgebraic('34')).toBe('d5');
    });

    test('fromAlgebraic converts valid input', () => {
        // "a1" → x=0,y=0 → "00"
        expect(FenUtils.fromAlgebraic('a1')).toBe('00');
        // "h8" → x=7,y=7 → "77"
        expect(FenUtils.fromAlgebraic('h8')).toBe('77');
    });

    test('fromAlgebraic throws ApiError on invalid format', () => {
        expect(() => FenUtils.fromAlgebraic('')).toThrow(ApiError);
        expect(() => FenUtils.fromAlgebraic('abc')).toThrow(ApiError);
        try {
            FenUtils.fromAlgebraic('z9u');
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect(err.message).toMatch('Invalid input \"z9u\"');
            expect(err.status).toBe(500);
        }
    });

    test('fromAlgebraic throws ApiError on out-of-bounds', () => {
        expect(() => FenUtils.fromAlgebraic('i5')).toThrow(ApiError);
        expect(() => FenUtils.fromAlgebraic('a0')).toThrow(ApiError);
        try {
            FenUtils.fromAlgebraic('i5');
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect(err.message).toMatch(/pos not in bounds/i);
            expect(err.status).toBe(400);
        }
    });

    test('boundsCheck returns true for in‐range coords and false otherwise', () => {
        expect(FenUtils.boundsCheck(0, 0)).toBe(true);
        expect(FenUtils.boundsCheck(7, 7)).toBe(true);
        expect(FenUtils.boundsCheck(-1, 3)).toBe(false);
        expect(FenUtils.boundsCheck(3, 8)).toBe(false);
        expect(FenUtils.boundsCheck(10, 10)).toBe(false);
    });
});
