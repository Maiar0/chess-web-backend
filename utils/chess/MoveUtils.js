const ChessBoard = require('../../domain/chess/board/ChessBoard.js');
const ApiError = require('../ApiError.js');
const { logOneOff } = require('../logging/logOneOff');

class MoveUtils{
    
    /**
     * Simulates moving a piece from one position to another on a chess board and checks if the king is in check after the move.
     *
     * @param {string} fen - The FEN string representing the current state of the chess board.
     * @param {{x: number, y: number}} from - The coordinates of the piece to move.
     * @param {{x: number, y: number}} to - The coordinates to move the piece to.
     * @returns {boolean} Returns true if the king is in check after the simulated move, otherwise false.
     */
    static simulationKingCheck(fen, from, to){//TODO:: Create Error messages to explain why kingInCheck
        const dummyBoard = new ChessBoard(fen);//fen
        let piece = dummyBoard.getPiece(from.x,from.y);//get piece at from
        dummyBoard.board[to.x][to.y] = piece;//move piece
        piece.position = {x: to.x, y: to.y};
        dummyBoard.board[from.x][from.y] = null;//clear last space
        dummyBoard.generateThreatMap(dummyBoard.activeColor === 'w' ? 'black': 'white');//generate map
        return dummyBoard.kingInCheck;//return if king is in check?
    }
    /**
     * Determines if the king is in checkmate for the given FEN position.
     * Simulates all possible moves for the active color and checks if any move can prevent checkmate.
     *
     * @param {string} fen - The FEN string representing the current board state.
     * @returns {boolean} Returns true if the king is in checkmate, otherwise false.
     * @throws {ApiError} Throws an error if no king is found on the board.
     */
    static simulationKingCheckMate(fen){
        logOneOff('simulationKingCheckMate', `Checking if king is in checkmate for FEN: ${fen}`);
        const dummyBoard = new ChessBoard(fen);
        const pieces = dummyBoard.getPieces(dummyBoard.activeColor === 'w' ? 'white': 'black');//get all pieces to test
        const king = pieces.find(p => p.constructor.name === 'King');//get King
        if(!king) throw new ApiError('No king found on board.', 400);
        
        for(let i = 0; i < pieces.length; ++i){
            const piece = pieces[i];
            const moves = piece.getMoves(dummyBoard);
            for(let o = 0; o < moves.length; ++o){
                const to = moves[o];
                const from = piece.position;
                if(!this.simulationKingCheck(fen, from, to)){
                    logOneOff("Not Check Mate:" + JSON.stringify(from) + JSON.stringify(to));
                    return false;//We have a move
                }
            }
        }
        logOneOff("Check Mate:" + JSON.stringify(king));
        return true;//CHECK MATE
    }
    
    /**
     * Determines if the king is in check for the given FEN position.
     *
     * @param {string} fen - The FEN string representing the chess board state.
     * @returns {boolean} True if the king is in check, otherwise false.
     */
    static isKingInCheck(fen){
        const dummyBoard = new ChessBoard(fen);
        return dummyBoard.kingInCheck;
    }
    /**
     * Determines if castling is possible given the current FEN, the king's starting position, and the target position.
     *
     * This method checks several conditions for castling:
     * - The king is not currently in check.
     * - The move requested is a valid castling move for the king.
     * - The FEN string indicates castling rights are available.
     * - The rook is in the correct position and is indeed a rook.
     * - The path between the king and rook is unblocked and not threatened.
     * - The squares the king passes through (including the destination) are not under attack.
     *
     * @param {string} fen - The FEN string representing the current board state.
     * @param {{x: number, y: number}} from - The starting position of the king.
     * @param {{x: number, y: number}} to - The target position of the king (castling destination).
     * @returns {boolean} True if castling is possible, false otherwise.
     * @throws {ApiError} If castling is not available according to the FEN or if the rook is not in the correct position.
     */
    static castlingPossible(fen, from, to){
        console.log('*************START CASTLING CHECK*************');
        const dummyBoard = new ChessBoard(fen);
        if(dummyBoard.kingInCheck) return false; // King is in check, castling not possible

        //verifies we requested a castling move
        const king = dummyBoard.getPiece(from.x, from.y);
        if(!this.isCastlingMove(king, from, to)) return false;

        //Check FEN
        let fenIndicator = dummyBoard.activeColor === 'w' ? 'KQ' : 'kq'; // Determine the castling indicator based on active color
        fenIndicator = to.x === 6 ? fenIndicator.charAt(0) : fenIndicator.charAt(1); // Determine the castling indicator based on the target position
        if(!dummyBoard.castlingAvaible.includes(fenIndicator)) throw new ApiError('Castling not availble', 403); // castling not available
        
        // check if possible castling move
        const color = dummyBoard.activeColor === 'w' ? 'white' : 'black';
        const finalPos = {x: to.x === 6 ? 5 : 3, y: from.y}; // Final position of the rook after castling
        const startPos = {x: to.x === 6 ? 7 : 0, y: from.y}; // Starting position of the rook
        const rook = dummyBoard.getPiece(startPos.x, startPos.y);
        if(rook !== null && rook.constructor.name !== 'Rook') throw new ApiError('Castling not possible, Rook is not in correct position', 403); // Rook is not in correct position
        //check if path unblocked check threat
        if(this.isValidMove(dummyBoard, rook, finalPos) && dummyBoard.getPiece(finalPos.x, finalPos.y ) === null){
            //Check if squares are threatened
            if(!dummyBoard.isThreatened(to.x,to.y) && !dummyBoard.isThreatened(finalPos.x, finalPos.y)){
                console.log('*****Castling squares are not threatened, castling is possible******');
                return true; // Castling is possible
            }
        }
        console.log('*****Castling squares are threatened or not valid, castling is not possible******');
        return false; // Castling not possible
    }
    
    /**
     * Determines if a move is a castling move in chess.
     *
     * @param {Object} piece - The chess piece being moved. Expected to have a constructor with name 'King' for castling.
     * @param {Object} from - The starting position of the piece, with an 'x' property.
     * @param {Object} to - The ending position of the piece, with an 'x' property.
     * @returns {boolean} Returns true if the move is a castling move, otherwise false.
     */
    static isCastlingMove(piece, from, to){
        if(piece !== null && piece.constructor.name === 'King' && Math.abs(to.x - from.x) === 2){
            console.log('Castling move detected from', from, 'to', to);
            return true;
        }
        console.log('Not a castling move from', from, 'to', to);
        return false; 
    }
    
    /**
     * Checks if a move to the specified position is valid for the given piece on the current board.
     *
     * @param {Object} board - The current state of the chess board.
     * @param {Object} piece - The chess piece to move. Must have a getMoves(board) method returning possible moves.
     * @param {Object} to - The target position to move to, with properties {x, y}.
     * @returns {boolean} True if the move is valid, false otherwise.
     */
    static isValidMove(board, piece, to) {
        let possibleMoves = piece.getMoves(board);
        for(let i = 0; i < possibleMoves.length; ++i){
            const element = possibleMoves[i];
            if (element.x === to.x && element.y === to.y){
                return true; // Move is valid
            }
        }
        return false;
    }
    /**
     * Evaluates whether the current board position, given in FEN notation, is a stalemate.
     * A stalemate occurs when the player whose turn it is has no legal moves and is not in check.
     *
     * @param {string} fen - The FEN string representing the current board state.
     * @returns {boolean} Returns true if the position is a stalemate, otherwise false.
     */
    static evaluateStalemate(fen){
        const dummyBoard = new ChessBoard(fen);
        const pieces = dummyBoard.getPieces(dummyBoard.activeColor === 'w' ? 'white' : 'black');
        for(let i = 0; i< pieces.length; ++i){
            if(pieces[i].getMoves(dummyBoard).length != 0){
                console.log('Stalemate FALSE');
                return false;
            }
        }
        console.log('Stalemate FALSE');
        return true;//game is stalemate  
    }
    /**
     * Evaluates whether the given FEN position is a draw due to insufficient material.
     *
     * This function checks if the position described by the FEN string has only pieces
     * that cannot possibly checkmate (e.g., king vs king, king and bishop vs king, etc.).
     * If queens, rooks, or pawns are present, it immediately returns false.
     *
     * @param {string} fen - The FEN string representing the chess position.
     * @returns {boolean} True if the position is a draw by insufficient material, false otherwise.
     */
    static evaluateMaterialsDraw(fen){
        const parts = fen.split(' ');
        if(parts[0].toLowerCase().includes('q') || parts[0].toLowerCase().includes('r') || parts[0].toLowerCase().includes('p') ){
            return false;// Materials draw not avaible
        }
        const insufficientMaterialSets = [//possible draw piece conditions
            "kK",   "kKN",  "kKn",
            "kKB",  "kKb",  "kKBb",
            "kKNN", "kKnn"
        ];
        const dummyBoard = new ChessBoard(fen);
        const piecesStr = [//get our pieces
        ...dummyBoard.getPieces('white'),
        ...dummyBoard.getPieces('black')
        ]
        .map(piece => piece.getFen())
        .join('');
        //normalize
        const sortedPieces   = piecesStr.split('').sort().join('')
        const sortedSignatures = insufficientMaterialSets.map(sig => sig.split('').sort().join(''));
        //return if materials compisiton is true
        return sortedSignatures.includes(sortedPieces);
    }
}
module.exports = MoveUtils;