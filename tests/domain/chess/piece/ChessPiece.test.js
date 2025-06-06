// __tests__/ChessPiece.test.js
const ChessPiece = require('../../../../domain/chess/pieces/ChessPiece');
const ApiError = require('../../../../utils/ApiError');

describe('ChessPiece (abstract base class)', () => {
    const initialColor = 'white';
    const initialPosition = { x: 0, y: 1 }; // corresponds to "a2"
    let piece;

    beforeEach(() => {
        piece = new ChessPiece(initialColor, initialPosition);
    });

    test('constructor should set color and position', () => {
        expect(piece.getColor()).toBe(initialColor);
        expect(piece.getPosition()).toEqual(initialPosition);
    });

    test('getPositionAlpha should convert numeric position to algebraic notation', () => {
        // x=0 → 'a', y=1 → '2'
        expect(piece.getPositionAlpha()).toBe('a2');

        // change position and verify again
        piece.setPosition({ x: 7, y: 7 }); // should be "h8"
        expect(piece.getPositionAlpha()).toBe('h8');
    });

    test('setPosition should update the position', () => {
        const newPos = { x: 3, y: 4 };
        piece.setPosition(newPos);
        expect(piece.getPosition()).toEqual(newPos);
        expect(piece.getPositionAlpha()).toBe('d5'); // x=3 → 'd', y=4 → '5'
    });

    test('setColor should update the color', () => {
        piece.setColor('black');
        expect(piece.getColor()).toBe('black');
    });

    test('getMoves should throw ApiError indicating it must be overridden', () => {
        expect(() => piece.getMoves({})).toThrow(ApiError);
        try {
            piece.getMoves({});
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect(err.message).toBe('getMoves() must be implemented in subclasses');
            expect(err.status).toBe(500);
        }
    });

    test('getPieceType should throw ApiError indicating it must be overridden', () => {
        expect(() => piece.getPieceType()).toThrow(ApiError);
        try {
            piece.getPieceType();
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect(err.message).toBe('getPieceType() must be implemented in subclasses');
            expect(err.status).toBe(500);
        }
    });

    test('getFen should throw ApiError indicating it must be overridden', () => {
        expect(() => piece.getFen()).toThrow(ApiError);
        try {
            piece.getFen();
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            expect(err.message).toBe('getFen() must be implemented in subclasses');
            expect(err.status).toBe(500);
        }
    });
});
