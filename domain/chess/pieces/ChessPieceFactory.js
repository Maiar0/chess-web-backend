const ApiError = require('../../../utils/ApiError');
const Pawn = require('./Pawn.js');
const Rook = require('./Rook.js');
const Knight = require('./Knight.js');
const Bishop = require('./Bishop.js');
const Queen = require('./Queen.js');
const King = require('./King.js');
// Factory class to create chess pieces based on the character representation
// of the piece. The character is expected to be in the format used in FEN (Forsyth-Edwards Notation).

class ChessPieceFactory{
    /**
     * Creates a chess piece instance based on the provided character.
     *
     * The character determines both the type and color of the piece:
     * - Uppercase characters represent white pieces.
     * - Lowercase characters represent black pieces.
     * 
     * Supported characters:
     * - 'P' or 'p': Pawn
     * - 'R' or 'r': Rook
     * - 'N' or 'n': Knight
     * - 'B' or 'b': Bishop
     * - 'Q' or 'q': Queen
     * - 'K' or 'k': King
     *
     * @param {string} char - A single character representing the chess piece type and color.
     * @returns {Pawn|Rook|Knight|Bishop|Queen|King} The corresponding chess piece instance.
     * @throws {ApiError} If the character does not represent a valid chess piece.
     */
    static createPiece(char) {
        const color = char === char.toUpperCase() ? 'white' : 'black';
        switch (char.toLowerCase()) {
            case 'p':
                return new Pawn(color);
            case 'r':
                return new Rook(color);
            case 'n':
                return new Knight(color);
            case 'b':
                return new Bishop(color);
            case 'q':
                return new Queen(color);
            case 'k':
                return new King(color);
            default:
                throw new ApiError('Bad Request: Invalid piece type', 400);
        }
    }
}
module.exports = ChessPieceFactory; // Export the ChessPieceFactory class