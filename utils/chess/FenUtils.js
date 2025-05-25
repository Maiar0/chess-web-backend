const ChessPieceFactory = require('../../domain/chess/pieces/ChessPieceFactory');
class FenUtils{
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
    
    static parseCaptureString(capturedStr){
        let pieces = [];
        for(let i = 0; i < capturedStr.length; ++i){
            const piece = ChessPieceFactory.createPiece(capturedStr[i]);
            console.log(piece)
            if(!piece) throw new Error("Invalide capture Piece: " + capturedStr[i]);
            pieces.push(piece);
            
        }
        return pieces;
    }

    static toAlgebraic(pos) {//convert to readable format
        const x = parseInt(pos[0], 10);   //  "0" → 0
        const y = parseInt(pos[1], 10);   //  "5" → 5
        const letter = String.fromCharCode(97 + x);
        const number = String(y + 1);              
        return letter + number;
    }

    
    static fromAlgebraic(coord) {//convert to coordinate format
        if (typeof coord !== 'string' || coord.length !== 2) {
            throw new ApiError(`Invalid input "${coord}"`, 431);
        }
        const letter = coord[0].toLowerCase();
        const number = coord[1];
        const x = letter.charCodeAt(0) - 97;
        const y = parseInt(number, 10) -1;
        if(!this.boundsCheck(x,y)) throw new Error("from Algebraic: pos not in bounds");
        return x.toString()+ y.toString();
    }

    static boundsCheck(x, y) {//TODO:: Remove this from ChessBoard.js? Put this in a different Util?
        // Check if the coordinates are within the bounds of the board
        if(x < 0 || x > 7 || y < 0 || y > 7){
            return false; 
        }
        return true;
    }
}
module.exports = FenUtils;