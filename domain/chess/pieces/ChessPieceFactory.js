const Pawn = require('./Pawn.js');
const Rook = require('./Rook.js');
const Knight = require('./Knight.js');
const Bishop = require('./Bishop.js');
const Queen = require('./Queen.js');
const King = require('./King.js');
// Factory class to create chess pieces based on the character representation
// of the piece. The character is expected to be in the format used in FEN (Forsyth-Edwards Notation).

class ChessPieceFactory{
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
                throw new Error('Invalid piece type');
        }
    }
}
module.exports = ChessPieceFactory; // Export the ChessPieceFactory class