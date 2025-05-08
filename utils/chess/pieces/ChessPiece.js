class ChessPiece{
    constructor(color, position) {
        this.color = color; // 'white' or 'black'
        this.position = position; // { file: a-h, Rank: 1-8 }
    }
    getPosition() {
        return this.position; // { file: a-h, rank: 1-8 }
    }
    setPosition(position) {
        this.position = position; // { file: a-h, rank: 1-8 }
    }
    getColor() {
        return this.color; // 'white' or 'black'
    }
    setColor(color) {
        this.color = color; // 'white' or 'black'
    }
    getMoves(board) {
        // Creates a list of possible moves for the piece
        // Board is an object representing the current state of the chessboard
        // This method should be overridden by subclasses
        throw new Error('getMoves() must be implemented in subclasses');
    }
    getPieceType() {
        // Return the type of the piece (e.g., 'pawn', 'rook', etc.)
        // This method should be overridden by subclasses
        throw new Error('getPieceType() must be implemented in subclasses');
    }
}