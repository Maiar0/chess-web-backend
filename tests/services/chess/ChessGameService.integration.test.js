// __tests__/services/chess/ChessGameService.integration.test.js

const fs   = require('fs');
const os   = require('os');
const path = require('path');

// Point dbManager at a temp dir so we don’t touch real data
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'games-'));
const { setDbDir, deleteGameDB, getGameFen, getGameCaptures } = require('../../../db/dbManager');
setDbDir(tmpDir);

// Stub only the StockFish engine; everything else runs for real
jest.mock('../../../utils/chess/StockFishUtil', () => ({
  getBestMove: jest.fn().mockResolvedValue('e7e5')
}));

const { getBestMove } = require('../../../utils/chess/StockFishUtil');
const ChessGameService = require('../../../services/chess/ChessGameService');

describe('ChessGameService Integration: full AI-game move flow', () => {
  let log;
  let service;
  let gameId;

  beforeAll(() => {
    log = { addEvent: jest.fn() };
    service = new ChessGameService(undefined, log);
    gameId = service.gameId;
  });

  afterAll(() => {
    // Clean up DB file and temp directory
    deleteGameDB(gameId);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('human moves pawn from e2 to e4, then AI moves pawn from e7 to e5', async () => {
    // 1) Start an AI game
    expect(service.newGame(true)).toBe(true);

    // 2) First human connects as white
    expect(service.infoGame('human1')).toBe(true);

    // 3) Before any move, DB has initial FEN
    let fen0 = getGameFen(gameId);
    expect(fen0.startsWith('rnbqkbnr')).toBe(true);

    // 4) Human move: e2→e4
    const from = { x: 4, y: 1 }; // e2
    const to   = { x: 4, y: 3 }; // e4
    await service.requestMove(from, to, '', 'human1');

    // 5) Verify board update: white pawn is at e4, e2 is empty
    const board = service.chessBoard.board;
    expect(board[4][3]).not.toBeNull();
    expect(board[4][3].color).toBe('white');
    expect(board[4][1]).toBeNull();
    //COULD HAVE FLIPPED
    // 6) After human move, FEN in DB updated
    const fen1 = getGameFen(gameId);
    expect(fen1.split(' ')[1]).toBe('w'); // now white to move AI has moved

    // 7) AI move is triggered automatically; our stub returns "e7e5"
    expect(getBestMove).toHaveBeenCalledWith(fen1);

    // 8) Verify board update: black pawn from e7 (4,6) to e5 (4,4)
    expect(board[4][4]).not.toBeNull();
    expect(board[4][4].color).toBe('black');
    expect(board[4][6]).toBeNull();

    // 9) After AI move, FEN in DB updated again, back to white's turn
    const fen2 = getGameFen(gameId);
    expect(fen2.split(' ')[1]).toBe('w');

    // 10) Captures column remains empty
    expect(getGameCaptures(gameId)).toBe('');
  });
});
