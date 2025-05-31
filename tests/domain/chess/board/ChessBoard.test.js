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
    test('test enPassant white', ()=>{
        const fen = 'rnbqkbnr/ppppppp1/8/1P5p/8/8/P1PPPPPP/RNBQKBNR b KQkq - 0 2';
        const board = new ChessBoard(fen);
        board.move({x: 0, y: 6}, {x: 0, y: 4});
        expect(board.enPassant).toBe('05');
        board.move({x: 1, y: 4}, {x: 0, y: 5});
        expect(board.getPiece(0,5).constructor.name).toBe('Pawn');
        expect(board.getPiece(0,4)).toBe(null);
    })
    test('test enPassant black', ()=>{
        const fen = 'rnbqkbnr/p1pppppp/8/8/1p5P/1P6/P1PPPPP1/RNBQKBNR w KQkq - 0 3';
        const board = new ChessBoard(fen);
        board.move({x: 2, y: 1}, {x: 2, y: 3});
        expect(board.enPassant).toBe('22');
        board.move({x: 1, y: 3}, {x: 2, y: 2});
        expect(board.getPiece(2,2).constructor.name).toBe('Pawn');
        expect(board.getPiece(2,3)).toBe(null);
    })
    test('test Pawn Promotion', ()=>{
        const fen = 'rn1qkbnr/P1ppppp1/b7/1p5p/8/8/P1PPPPPP/RNBQKBNR w KQkq - 1 5';
        let board = new ChessBoard(fen);
        board.move({x: 0, y: 6}, {x: 1, y: 7}, 'Q');
        expect(board.getPiece(1,7).constructor.name).toBe('Queen');//valid promotion
        board = new ChessBoard(fen);
        expect(()=> {
            board.move({x: 0, y: 6}, {x: 1, y: 7}, '')
        }).toThrow();//invalid promotion
    })
    test('test Castling', ()=> {
        const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
        const board = new ChessBoard(fen);
        //ensure correct set up
        expect(board.getPiece(4,0).constructor.name).toBe('King');
        expect(board.getPiece(0,0).constructor.name).toBe('Rook');
        expect(board.getPiece(4,7).constructor.name).toBe('King');
        expect(board.getPiece(7,7).constructor.name).toBe('Rook');
        //check king side
        board.move({x: 4, y: 0}, {x: 6, y: 0});
        expect(board.getPiece(5,0).constructor.name).toBe('Rook');
        board.move({x: 4, y: 7}, {x: 6, y: 7});
        expect(board.getPiece(5,7).constructor.name).toBe('Rook');
        //check queen side
        const secondBoard = new ChessBoard(fen);
        secondBoard.move({x: 4, y: 0}, {x: 2, y: 0});
        expect(secondBoard.getPiece(3,0).constructor.name).toBe('Rook');
        secondBoard.move({x: 4, y: 7}, {x: 2, y: 7});
        expect(secondBoard.getPiece(3,7).constructor.name).toBe('Rook');

    })
    test('test castling rights update', ()=> {
        const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
        let board = new ChessBoard(fen);
        expect(board.castlingAvaible).toBe('KQkq');
        board.move({x: 0, y: 0}, {x: 0, y: 1});
        expect(board.castlingAvaible).toBe('Kkq');
        board.move({x: 7, y: 0}, {x: 7, y: 1});
        expect(board.castlingAvaible).toBe('kq');
        board.move({x: 7, y: 7}, {x: 7, y: 6});
        expect(board.castlingAvaible).toBe('q');
        board.move({x: 0, y: 7}, {x: 0, y: 6});
        expect(board.castlingAvaible).toBe('-');
        board = new ChessBoard(fen);
        expect(board.castlingAvaible).toBe('KQkq');
        board.move({x: 4, y: 0}, {x: 4, y: 1});
        expect(board.castlingAvaible).toBe('kq');
        board.move({x: 4, y: 7}, {x: 4, y: 6});
        expect(board.castlingAvaible).toBe('-');

        
    })
    test('test board Reset', ()=>{
        const fen = 'rn1qkbnr/P1ppppp1/b7/1p5p/8/8/P1PPPPPP/RNBQKBNR w KQkq - 1 5';
        const board = new ChessBoard(fen);
        const freshFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        expect(board.getPiece(0,6).color).toBe('white');
        board.resetBoard();
        expect(board.createFen()).toBe(freshFen);


    })
    test('king in check', ()=> {
        const fen = '8/8/8/8/8/8/5R2/4k2K w - - 0 1';
        const board = new ChessBoard(fen);
        expect(board.kingInCheck).toBe(false);
        board.move({x: 5, y: 1}, {x: 4, y: 1});
        board.generateThreatMap('white');
        expect(board.kingInCheck).toBe(true);

    })
    test('printThreatMap outputs expected format', () => {
        const fen = '8/8/8/8/8/8/8/R3K2R w KQ - 0 1';
        const board = new ChessBoard(fen);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        board.printThreatMap();

        expect(logSpy).toHaveBeenCalled();
        const output = logSpy.mock.calls.map(call => call[0]);

        // Basic assertions
        expect(output[0]).toMatch(/Threat Map:/);
        expect(output[1]).toBe('   a b c d e f g h');
        expect(output).toHaveLength(10); // 1 label + 1 header + 8 rows

        logSpy.mockRestore();
    });
    test('printBoard outputs board with correct labels', () => {
        const fen = '8/8/8/8/8/8/8/R3K2R w KQ - 0 1';
        const board = new ChessBoard(fen);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        board.printBoard();

        const output = logSpy.mock.calls.map(call => call.join(' ')); // JOIN arguments into one line

        expect(output[0]).toBe('Board:');
        expect(output[1]).toBe('   a b c d e f g h');
        expect(output).toHaveLength(11); // 1 label + 1 header + 8 rows + 1 footer
        expect(output[10]).toMatch(/activeColor:.*Castling:.*En Passant:/); // ✅

        logSpy.mockRestore();
    });



});