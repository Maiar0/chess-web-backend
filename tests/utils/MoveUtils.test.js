// __tests__/utils/chess/MoveUtils.test.js
jest.mock('../../domain/chess/board/ChessBoard.js');
jest.mock('../../utils/logging/logOneOff.js', () => ({
    logOneOff: jest.fn()
}));

const ChessBoard = require('../../domain/chess/board/ChessBoard.js');
const MoveUtils = require('../../utils/chess/MoveUtils.js');
const ApiError = require('../../utils/ApiError');

describe('MoveUtils', () => {
    beforeEach(() => {
        ChessBoard.mockReset();
    });

    describe('isCastlingMove', () => {
        test('returns false if piece is null', () => {
            const result = MoveUtils.isCastlingMove(null, { x: 4, y: 0 }, { x: 6, y: 0 });
            expect(result).toBe(false);
        });

        test('returns false if piece is not a King', () => {
            const notKing = { constructor: { name: 'Queen' } };
            const result = MoveUtils.isCastlingMove(notKing, { x: 4, y: 0 }, { x: 6, y: 0 });
            expect(result).toBe(false);
        });

        test('returns false if move distance is not 2', () => {
            const king = { constructor: { name: 'King' } };
            const result = MoveUtils.isCastlingMove(king, { x: 4, y: 0 }, { x: 5, y: 0 });
            expect(result).toBe(false);
        });

        test('returns true for valid castling move', () => {
            const king = { constructor: { name: 'King' } };
            const result = MoveUtils.isCastlingMove(king, { x: 4, y: 0 }, { x: 6, y: 0 });
            expect(result).toBe(true);
        });
    });

    describe('isValidMove', () => {
        test('returns true if target is in piece.getMoves()', () => {
            const board = {}; // irrelevant in this test
            const piece = {
                getMoves: () => [{ x: 3, y: 3 }, { x: 4, y: 4 }]
            };
            const result = MoveUtils.isValidMove(board, piece, { x: 4, y: 4 });
            expect(result).toBe(true);
        });

        test('returns false if target is not in piece.getMoves()', () => {
            const board = {};
            const piece = {
                getMoves: () => [{ x: 1, y: 1 }, { x: 2, y: 2 }]
            };
            const result = MoveUtils.isValidMove(board, piece, { x: 0, y: 0 });
            expect(result).toBe(false);
        });
    });

    describe('isKingInCheck', () => {
        test('returns dummyBoard.kingInCheck', () => {
            // Mock ChessBoard so that kingInCheck = true
            ChessBoard.mockImplementation(() => ({
                kingInCheck: true
            }));
            const resultTrue = MoveUtils.isKingInCheck('someFen');
            expect(resultTrue).toBe(true);

            // Mock ChessBoard so that kingInCheck = false
            ChessBoard.mockImplementation(() => ({
                kingInCheck: false
            }));
            const resultFalse = MoveUtils.isKingInCheck('anotherFen');
            expect(resultFalse).toBe(false);
        });
    });

    describe('simulationKingCheck', () => {
        test('returns dummyBoard.kingInCheck after simulation', () => {
            // Simulate generateThreatMap setting kingInCheck = true
            ChessBoard.mockImplementation(() => {
                return {
                    activeColor: 'w',
                    board: Array.from({ length: 8 }, () => Array(8).fill(null)),
                    getPiece: jest.fn(() => ({ position: null })), // piece object
                    generateThreatMap: function (oppColor) {
                        this.kingInCheck = true;
                    },
                    kingInCheck: false
                };
            });
            const result = MoveUtils.simulationKingCheck('fen', { x: 0, y: 1 }, { x: 0, y: 2 });
            expect(result).toBe(true);
        });

        test('handles when kingInCheck is false', () => {
            ChessBoard.mockImplementation(() => {
                return {
                    activeColor: 'b',
                    board: Array.from({ length: 8 }, () => Array(8).fill(null)),
                    getPiece: jest.fn(() => ({ position: null })),
                    generateThreatMap: function (oppColor) {
                        this.kingInCheck = false;
                    },
                    kingInCheck: false
                };
            });
            const result = MoveUtils.simulationKingCheck('fen', { x: 1, y: 0 }, { x: 2, y: 0 });
            expect(result).toBe(false);
        });
    });

    describe('simulationKingCheckMate', () => {
        test('throws ApiError if no king found', () => {
            // Mock ChessBoard to return empty pieces array
            ChessBoard.mockImplementation(() => ({
                activeColor: 'w',
                getPieces: () => []
            }));
            expect(() => MoveUtils.simulationKingCheckMate('fen')).toThrow(ApiError);
        });

        test('returns false if king has at least one move', () => {
            const mockKing = {
                constructor: { name: 'King' },
                position: { x: 4, y: 0 },
                getMoves: () => [{ x: 4, y: 1 }]
            };
            ChessBoard.mockImplementation(() => ({
                activeColor: 'w',
                getPieces: () => [mockKing]
            }));
            const result = MoveUtils.simulationKingCheckMate('fen');
            expect(result).toBe(false);
        });

        test('returns true if only king with no moves', () => {
            const mockKing = {
                constructor: { name: 'King' },
                position: { x: 4, y: 0 },
                getMoves: () => []
            };
            ChessBoard.mockImplementation(() => ({
                activeColor: 'b',
                getPieces: () => [mockKing]
            }));
            const result = MoveUtils.simulationKingCheckMate('fen');
            expect(result).toBe(true);
        });

        test('returns false if any piece has legal escape move', () => {
            const mockKing = {
                constructor: { name: 'King' },
                position: { x: 4, y: 0 },
                getMoves: () => []
            };
            const mockRook = {
                constructor: { name: 'Rook' },
                position: { x: 0, y: 0 },
                getMoves: () => [{ x: 0, y: 1 }],
            };
            // simulationKingCheck: first test returns true, second returns false
            let callCount = 0;
            ChessBoard.mockImplementation(() => ({
                activeColor: 'w',
                getPieces: () => [mockKing, mockRook]
            }));
            // Override simulationKingCheck to return false on first Rook move
            const originalSim = MoveUtils.simulationKingCheck;
            MoveUtils.simulationKingCheck = jest.fn(() => false);

            const result = MoveUtils.simulationKingCheckMate('fen');
            expect(result).toBe(false);

            // Restore
            MoveUtils.simulationKingCheck = originalSim;
        });
    });

    describe('castlingPossible', () => {
        const from = { x: 4, y: 0 };
        const toKingSide = { x: 6, y: 0 };
        const toQueenSide = { x: 2, y: 0 };

        test('returns false if kingInCheck is true', () => {
            ChessBoard.mockImplementation(() => ({
                kingInCheck: true
            }));
            const result = MoveUtils.castlingPossible('fen', from, toKingSide);
            expect(result).toBe(false);
        });

        test('returns false if not a castling move', () => {
            const king = { constructor: { name: 'King' } };
            ChessBoard.mockImplementation(() => ({
                kingInCheck: false,
                getPiece: () => king,
                activeColor: 'w',
                castlingAvaible: 'KQ',
                isThreatened: () => false
            }));
            // to.x != from.x ± 2
            const result = MoveUtils.castlingPossible('fen', from, { x: 5, y: 0 });
            expect(result).toBe(false);
        });

        test('throws if castling indicator not in castlingAvaible', () => {
            const king = { constructor: { name: 'King' } };
            ChessBoard.mockImplementation(() => ({
                kingInCheck: false,
                getPiece: () => king,
                activeColor: 'b',
                castlingAvaible: '', // no castling rights
                isThreatened: () => false
            }));
            expect(() => MoveUtils.castlingPossible('fen', from, toKingSide)).toThrow(ApiError);
        });

        test('throws if rook not in correct position', () => {
            const king = { constructor: { name: 'King' } };
            ChessBoard.mockImplementation(() => ({
                kingInCheck: false,
                getPiece: (x, y) => {
                    if (x === 4 && y === 0) return king;
                    // Return a non‐Rook at rook start
                    return { constructor: { name: 'Queen' } };
                },
                activeColor: 'w',
                castlingAvaible: 'KQ',
                isThreatened: () => false
            }));
            expect(() => MoveUtils.castlingPossible('fen', from, toKingSide)).toThrow(ApiError);
        });

        test('returns true if all castling conditions satisfied (king side)', () => {
            const king = { constructor: { name: 'King' } };
            const rook = {
                constructor: { name: 'Rook' },
                getMoves: () => [{ x: 5, y: 0 }]
            };
            ChessBoard.mockImplementation(() => ({
                kingInCheck: false,
                getPiece: (x, y) => {
                    if (x === 4 && y === 0) return king;
                    if (x === 7 && y === 0) return rook;
                    return null;
                },
                activeColor: 'w',
                castlingAvaible: 'KQ',
                isThreatened: (x, y) => false
            }));
            const result = MoveUtils.castlingPossible('fen', from, toKingSide);
            expect(result).toBe(true);
        });

        test('returns true if all castling conditions satisfied (queen side)', () => {
            const king = { constructor: { name: 'King' } };
            const rook = {
                constructor: { name: 'Rook' },
                getMoves: () => [{ x: 3, y: 0 }]
            };
            ChessBoard.mockImplementation(() => ({
                kingInCheck: false,
                getPiece: (x, y) => {
                    if (x === 4 && y === 0) return king;
                    if (x === 0 && y === 0) return rook;
                    return null;
                },
                activeColor: 'w',
                castlingAvaible: 'KQ',
                isThreatened: (x, y) => false
            }));
            const result = MoveUtils.castlingPossible('fen', from, toQueenSide);
            expect(result).toBe(true);
        });

        test('returns false if path is threatened', () => {
            const king = { constructor: { name: 'King' } };
            const rook = {
                constructor: { name: 'Rook' },
                getMoves: () => [{ x: 5, y: 0 }]
            };
            ChessBoard.mockImplementation(() => ({
                kingInCheck: false,
                getPiece: (x, y) => {
                    if (x === 4 && y === 0) return king;
                    if (x === 7 && y === 0) return rook;
                    return null;
                },
                activeColor: 'w',
                castlingAvaible: 'KQ',
                isThreatened: (x, y) => (x === 5 && y === 0) // path square threatened
            }));
            const result = MoveUtils.castlingPossible('fen', from, toKingSide);
            expect(result).toBe(false);
        });
    });
});
