const ChessPieceFactory = require('./utils/chess/pieces/ChessPieceFactory');
const Pawn = require('./utils/chess/pieces/Pawn');
const Rook = require('./utils/chess/pieces/Rook');
const Knight = require('./utils/chess/pieces/Knight');
const Bishop = require('./utils/chess/pieces/Bishop.js');
const Queen = require('./utils/chess/pieces/Queen');
const King = require('./utils/chess/pieces/King');

// Test the ChessPieceFactory to create pieces based on character representation
function testPiece() {
    const testChars = ['P', 'p', 'R', 'r', 'N', 'n', 'B', 'b', 'Q', 'q', 'K', 'k'];
    testChars.forEach(char => {
        const piece = ChessPieceFactory.createPiece(char);
        console.log(`Created ${piece.color} ${piece.constructor.name} from character '${char}'`);
        //console.log(`\tPosition: ${piece.position}`);
        //console.log(`\tMoves: ${piece.getMoves()}`);
        console.log('-----------------------------------');
    });
}
testPiece();
// Test invalid characters
function testPieceInvalid() {
    const testCharsInvalid = ['X', 'Y', 'Z', '1', '2', '3'];    
    testCharsInvalid.forEach(char => {
        try {
            const piece = ChessPieceFactory.createPiece(char);
            console.log(`Created ${piece.color} ${piece.constructor.name} from character '${char}'`);
        } catch (error) {
            console.error(`Error creating piece from character '${char}': ${error.message}`);
        }
    });
}
testPieceInvalid();