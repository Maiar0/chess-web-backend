const ChessBoard = require('../../../../domain/chess/board/ChessBoard');
describe('ChessBoard', () => {

    let board; // Scoped to the describe block
    let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    beforeEach(() => {
        board = new ChessBoard(fen);
    });

    test('init Chessboard', () =>{

        //expect values to be set correctly.
        expect(board.fen).toBe(fen);
        expect(board.activeColor).toBe('w');
        expect(board.castlingAvaible).toBe('KQkq');
        expect(board.enPassant).toBe('-');
        expect(board.halfmove).toBe('0');
        expect(board.fullmove).toBe('1');

        //expect board to be right size
        expect(board.board.length).toBe(8);
        board.board.forEach(column =>{
            expect(column.length).toBe(8);
        });

        //check set up orientation
        const a1Piece = board.getPiece(0,0);
        const h8Piece = board.getPiece(7,7)
        expect(a1Piece.constructor.name).toBe('Rook');
        expect(a1Piece.color).toBe('white');
        expect(h8Piece.constructor.name).toBe('Rook');
        expect(h8Piece.color).toBe('black');

        //Checks occurence of king for each color
        const wKing = board.getPieces('white').find(p => p.constructor.name ==='King');
        const bKing = board.getPieces('black').find(p => p.constructor.name ==='King');
        expect(wKing).toBeDefined();
        expect(bKing).toBeDefined();

        //checks threat map for accuracy
        const trueThreats = [
            { x: 0, y: 5 }, 
            { x: 2, y: 5 }, 
            { x: 5, y: 5 },
            { x: 7, y: 5 }
        ]
        const threatMap = board.threatMap;
        for(let i = 0; i< threatMap.length; ++i){
            for(let o = 0; o < threatMap[i].length; ++o){
                if(trueThreats.some(pos => pos.x === i && pos.y === o)){
                    expect(threatMap[i][o]).toBe(true);
                }else{
                    expect(threatMap[i][o]).toBe(false);
                }
            }
        }
    });

    test('createFen', () => {
        expect(board.createFen()).toBe(fen);
    });

    test('pawn Move logic', () =>{
        const from = {x: 0, y: 1};
        const to = {x: 0, y: 3};
        const pieceFrom = board.getPiece(from.x, from.y);
        board.move(from, to);
        expect(board.enPassant).toBe('02');
        expect(board.getPiece(to.x,to.y)).toBe(pieceFrom);
    });

    //fen = 'k7/8/4p3/3P4/8/8/8/K7 w - - 0 1';
    test('pawn Capture Logic', () =>{
        const fen = 'k7/8/4p3/3P4/8/8/8/K7 w - - 0 1';
        const board = new ChessBoard(fen);
        expect(board.getPiece(3,4).constructor.name).toBe('Pawn');
        expect(board.getPiece(3,4).color).toBe('white');
        expect(board.getPiece(4,5).constructor.name).toBe('Pawn');
        expect(board.getPiece(4,5).color).toBe('black');
        board.move({x: 3, y: 4},{x: 4, y: 5})
        let captureP = board.capturedPieces[0];
        expect(captureP.color).toBe('black');
        expect(board.getPiece(3,4)).toBe(null);
    })
    test('test Castling', ()=> {
        const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
        const board = new ChessBoard(fen);
        //set up move and expectation
    })

});