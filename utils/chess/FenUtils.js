const ChessPieceFactory = require('../../domain/chess/pieces/ChessPieceFactory');
const ApiError = require('../ApiError');
class FenUtils{
    /**
     * Parses a FEN (Forsyth-Edwards Notation) string and returns a 2D array representing the chess board.
     * Each element in the array is either `null` or a chess piece object created by `ChessPieceFactory`.
     *
     * @param {string} fen - The FEN string representing the chess board position.
     * @returns {Array<Array<Object|null>>} An 8x8 array representing the chess board, where each cell contains either a piece object or null.
     */
    static parseFen(fen){
        const board = Array.from({ length: 8 }, () => Array(8).fill(null));
        let rows = fen.split(' ')[0].split('/'); // Split the FEN string into rows
        for (let i = 0; i < rows.length; i++){
            let row = rows[i];
            let x = 0; // Board file index

            for(let o = 0; o < row.length; o++){
                const pieceChar = row[o];

                if(isNaN(pieceChar)){
                    const piece = ChessPieceFactory.createPiece(pieceChar); // Create a piece using the factory
                    piece.position = {x: x, y: 7-i }; // Set the position of the piece
                    board[x][7-i] = piece; // Place the piece on the board
                    x++; // Move to the next file
                }else x += parseInt(pieceChar, 10); // If the character is a number, skip that many squares
                
            }
        }
        return board; // Return the created board 
    }

    /**
     * Generates a FEN (Forsyth-Edwards Notation) string representation of a chess board.
     *
     * @param {Array<Array<Object|null>>} board - An 8x8 array representing the chess board. Each element is either a piece object (with a getFen() method) or null for empty squares.
     * @param {string} activeColor - The color to move next, either 'w' (white) or 'b' (black).
     * @param {string} castlingAvaible - A string indicating castling availability (e.g., 'KQkq' or '-').
     * @param {string|Object} enPassant - The en passant target square in algebraic notation or '-' if not available.
     * @param {number} halfMove - The halfmove clock (number of halfmoves since the last capture or pawn advance).
     * @param {number} fullMove - The fullmove number (starts at 1 and increments after Black's move).
     * @returns {string} The FEN string representing the current board state.
     */
    static parseBoard(board, activeColor, castlingAvaible, enPassant, halfMove, fullMove){
        let fenArray = [];
        for(let i = 0; i < 8; i++){
            fenArray[i] = '';
            let count = 0; // Counter for empty squares
            for(let o = 0; o < 8; o++){
                const piece = board[o][i]; // Get the piece at the current position
                if (piece === null){
                    count++;
                }else{
                    if(count > 0){
                        fenArray[i] += count; // Add the number of empty squares to the FEN string
                        count = 0; // Reset the counter
                    }
                    fenArray[i] += piece.getFen(); // Get the FEN representation of the piece
                }
            }
            if(count > 0){
                fenArray[i] += count; // Add the number of empty squares to the FEN string
                count = 0; // Reset the counter
            }
        }
        let fen = '';
        for(let i = fenArray.length - 1; i >= 0; i--){
            fen += fenArray[i]; // Concatenate the rows to form the FEN string
            if(i > 0) fen += '/'; // Add a slash between rows
        }
        fen += ' ' + activeColor + ' '; // Add the active color
        fen += castlingAvaible + ' '; // Add castling availability 
        fen += enPassant !== '-' ? this.toAlgebraic(enPassant) : '-'; // Add en passant target square
        fen += ' ' + halfMove + ' '; // Add halfmove clock
        fen += fullMove; // Add fullmove number

        return fen; // Return the FEN string representation of the board
    }
    
    /**
     * Parses a string representing captured chess pieces and returns an array of piece objects.
     *
     * @param {string} capturedStr - A string where each character represents a captured chess piece.
     * @returns {Array<Object>} An array of chess piece objects created from the input string.
     * @throws {ApiError} Throws an error if an invalid piece character is encountered.
     */
    static parseCaptureString(capturedStr){
        let pieces = [];
        for(let i = 0; i < capturedStr.length; ++i){
            const piece = ChessPieceFactory.createPiece(capturedStr[i]);
            if(!piece) throw new ApiError("Invalid capture Piece: " + capturedStr[i], 400);
            pieces.push(piece);
            
        }
        return pieces;
    }

    /**
     * Converts an array of captured piece objects into a FEN string representation.
     *
     * @param {Array<Object>} captured - An array of captured piece objects, each expected to have a `getFen()` method.
     * @returns {string} A string representing the captured pieces in FEN notation, or an empty string if none.
     */
    static parseCapturedPiece(captured){
        if(captured.length > 0){
            let s = '';
            for(let i = 0; i< captured.length; ++i){
                s += captured[i].getFen();
            }
            return s;
        }
        return '';
    }

    /**
     * Converts a board position from numeric coordinates to algebraic chess notation.
     *
     * @param {number[]} pos - An array with two elements: [x, y], where x is the file (0-7) and y is the rank (0-7).
     * @returns {string} The algebraic notation (e.g., 'e4') corresponding to the given position.
     */
    static toAlgebraic(pos) {//convert to readable format
        const x = parseInt(pos[0], 10);   
        const y = parseInt(pos[1], 10);   
        const letter = String.fromCharCode(97 + x);
        const number = String(y + 1);              
        return letter + number;
    }

    
    /**
     * Converts an algebraic chess coordinate (e.g., "e4") to a coordinate format string (e.g., "43").
     *
     * @param {string} coord - The algebraic chess coordinate to convert (e.g., "e4").
     * @returns {string} The converted coordinate as a string in the format "xy", where x and y are zero-based indices.
     * @throws {ApiError} If the input is not a valid algebraic coordinate or is out of bounds.
     */
    static fromAlgebraic(coord) {//convert to coordinate format
        if (typeof coord !== 'string' || coord.length !== 2) {
            throw new ApiError(`Invalid input "${coord}"`, 500);
        }
        const letter = coord[0].toLowerCase();
        const number = coord[1];
        const x = letter.charCodeAt(0) - 97;
        const y = parseInt(number, 10) -1;
        if(!this.boundsCheck(x,y)) throw new ApiError("pos not in bounds", 400);
        return x.toString()+ y.toString();
    }

    /**
     * Checks if the given coordinates (x, y) are within the bounds of a standard 8x8 chessboard.
     *
     * @param {number} x - The x-coordinate (column index), expected to be between 0 and 7 inclusive.
     * @param {number} y - The y-coordinate (row index), expected to be between 0 and 7 inclusive.
     * @returns {boolean} Returns true if both coordinates are within bounds, otherwise false.
     */
    static boundsCheck(x, y) {//TODO:: Remove this from ChessBoard.js? Put this in a different Util?
        // Check if the coordinates are within the bounds of the board
        if(x < 0 || x > 7 || y < 0 || y > 7){
            return false; 
        }
        return true;
    }
}
module.exports = FenUtils;