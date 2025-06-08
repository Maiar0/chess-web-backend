// __tests__/services/chess/ChessGameService.test.js
const ChessGameService = require('../../../services/chess/ChessGameService');
const ChessBoard = require('../../../domain/chess/board/ChessBoard');
const MoveUtils = require('../../../utils/chess/MoveUtils');
const FenUtils = require('../../../utils/chess/FenUtils');
const { getBestMove } = require('../../../utils/chess/StockFishUtil');
const {
  createGameDB,
  getGameFen,
  setGameFen,
  setGameCaptures,
  getGameCaptures,
  getPlayer,
  setPlayer
} = require('../../../db/dbManager');
const ApiError = require('../../../utils/ApiError');

jest.mock('../../../domain/chess/board/ChessBoard');
jest.mock('../../../utils/chess/MoveUtils');
jest.mock('../../../utils/chess/FenUtils');
jest.mock('../../../utils/chess/StockFishUtil');
jest.mock('../../../db/dbManager');

describe('ChessGameService', () => {
  let service;
  const dummyLog = { addEvent: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('creates new game when gameId undefined', () => {
      // Mock createGameDB, getGameCaptures, getGameFen
      createGameDB.mockImplementation((id) => {});
      getGameCaptures.mockReturnValue(''); 
      getGameFen.mockReturnValue('dummyFen');

      // Mock ChessBoard constructor to record arguments
      ChessBoard.mockImplementation((fen, opts) => ({
        activeColor: 'w',
        board: [],
        capturedPieces: [],
        createFen: jest.fn().mockReturnValue('dummyFen'),
        getPieces: jest.fn().mockReturnValue([]),
        move: jest.fn().mockReturnValue(true),
        getPiece: jest.fn().mockReturnValue(null),
        isThreatened: jest.fn().mockReturnValue(false),
        fullmove: '1'
      }));

      service = new ChessGameService(undefined, dummyLog);

      // gameId should be a 9‐char alphanumeric
      expect(service.gameId).toMatch(/^[a-z0-9]{9}$/);
      expect(createGameDB).toHaveBeenCalledWith(service.gameId);
      expect(getGameCaptures).toHaveBeenCalledWith(undefined);
      expect(getGameFen).toHaveBeenCalledWith(service.gameId);
      expect(service.chessBoard).toBeDefined();
      expect(service.CheckMate).toBe(false);
    });

    test('uses provided gameId when not undefined', () => {
      const existingId = 'game12345';
      getGameCaptures.mockReturnValue('caps');
      getGameFen.mockReturnValue('fenStr');
      ChessBoard.mockImplementation(() => ({
        activeColor: 'b',
        board: [],
        capturedPieces: [],
        createFen: jest.fn().mockReturnValue('fenStr'),
        getPieces: jest.fn().mockReturnValue([]),
        move: jest.fn().mockReturnValue(true),
        getPiece: jest.fn().mockReturnValue(null),
        isThreatened: jest.fn().mockReturnValue(false),
        fullmove: '1'
      }));

      service = new ChessGameService(existingId, dummyLog);
      expect(service.gameId).toBe(existingId);
      expect(createGameDB).not.toHaveBeenCalled();
      expect(getGameCaptures).toHaveBeenCalledWith(existingId);
      expect(getGameFen).toHaveBeenCalledWith(existingId);
    });
  });

  describe('createGameId', () => {
    test('generates 9 character alphanumeric id and logs event', () => {
      getGameCaptures.mockReturnValue('');
      getGameFen.mockReturnValue('fen');
      ChessBoard.mockImplementation(() => ({
        activeColor: 'w',
        board: [],
        capturedPieces: [],
        createFen: jest.fn().mockReturnValue('fen'),
        getPieces: jest.fn().mockReturnValue([]),
        move: jest.fn().mockReturnValue(true),
        getPiece: jest.fn().mockReturnValue(null),
        isThreatened: jest.fn().mockReturnValue(false),
        fullmove: '1'
      }));
      service = new ChessGameService(undefined, dummyLog);
      const id = service.createGameId();
      expect(id).toMatch(/^[a-z0-9]{9}$/);
      expect(dummyLog.addEvent).toHaveBeenCalledWith('creating game');
    });
  });

  describe('newGame', () => {
    beforeEach(() => {
      getGameCaptures.mockReturnValue('');
      getGameFen.mockReturnValue('fen');
      ChessBoard.mockImplementation(() => ({
        activeColor: 'w',
        board: [],
        capturedPieces: [],
        createFen: jest.fn().mockReturnValue('fen'),
        getPieces: jest.fn().mockReturnValue([]),
        move: jest.fn().mockReturnValue(true),
        getPiece: jest.fn().mockReturnValue(null),
        isThreatened: jest.fn().mockReturnValue(false),
        fullmove: '1'
      }));
      service = new ChessGameService(undefined, dummyLog);
    });

    test('returns true and sets AI as black player when isAi true', () => {
      setPlayer.mockReturnValue(true);
      getPlayer.mockReturnValue('ai');
      const result = service.newGame(true);
      expect(setPlayer).toHaveBeenCalledWith(service.gameId, 'black', 'ai');
      expect(dummyLog.addEvent).toHaveBeenCalledWith('This is AI Game');
      expect(result).toBe(true);
    });

    test('returns true when isAi false and does nothing else', () => {
      const result = service.newGame(false);
      expect(setPlayer).not.toHaveBeenCalled();
      expect(dummyLog.addEvent).not.toHaveBeenCalledWith('This is AI Game');
      expect(result).toBe(true);
    });
  });

  describe('infoGame', () => {
    beforeEach(() => {
      getGameCaptures.mockReturnValue('caps');
      getGameFen.mockReturnValue('fen');
      ChessBoard.mockImplementation(() => ({
        activeColor: 'w',
        board: [],
        capturedPieces: [],
        createFen: jest.fn().mockReturnValue('fen'),
        getPieces: jest.fn().mockReturnValue([]),
        move: jest.fn().mockReturnValue(true),
        getPiece: jest.fn().mockReturnValue(null),
        isThreatened: jest.fn().mockReturnValue(false),
        fullmove: '1'
      }));
      service = new ChessGameService(undefined, dummyLog);
    });

    test('assigns playerId to color if unset', () => {
      getPlayer.mockReturnValueOnce(null);  // no white player yet
      getPlayer.mockReturnValueOnce('other'); // black player
      const result = service.infoGame('player1');
      expect(setPlayer).toHaveBeenCalledWith(service.gameId, 'white', 'player1');
      expect(result).toBe(true);
    });

    test('does not assign if current player exists', () => {
      getPlayer.mockReturnValueOnce('playerX'); // white already set
      getPlayer.mockReturnValueOnce('playerY'); // black
      const result = service.infoGame('player1');
      expect(setPlayer).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('isPlayersTurn & isAisTurn', () => {
    beforeEach(() => {
      getGameCaptures.mockReturnValue('');
      // Two‐color switching scenario
      getPlayer.mockImplementation((_, color) =>
        color === 'white' ? 'pWhite' : 'ai'
      );
      getGameFen.mockReturnValue('dummyFen b KQkq - 0 1'); // black to move
      ChessBoard.mockImplementation(() => ({
        activeColor: 'b',
        board: [],
        capturedPieces: [],
        createFen: jest.fn().mockReturnValue('dummyFen b KQkq - 0 1'),
        getPieces: jest.fn().mockReturnValue([]),
        move: jest.fn().mockReturnValue(true),
        getPiece: jest.fn().mockReturnValue(null),
        isThreatened: jest.fn().mockReturnValue(false),
        fullmove: '1'
      }));
      service = new ChessGameService(undefined, dummyLog);
    });

    test('isAisTurn returns true when activeColor = b and black player is ai', () => {
        // 1) Force the service’s board‐FEN to say “black to move”
        service.chessBoard.fen = '8/8/8/8/8/8/8/8 b KQkq - 0 1';

        // 2) Mock getPlayer so that for 'black' it returns 'ai'
        getPlayer.mockImplementation((gameId, color) => {
            return color === 'black' ? 'ai' : 'someHuman';
        });

        // 3) Now isAisTurn() should return true
        const result = service.isAisTurn();
        expect(result).toBe(true);
    });
  });

  describe('validateMove', () => {
    beforeEach(() => {
      getGameCaptures.mockReturnValue('');
      getGameFen.mockReturnValue('dummyFen w KQkq - 0 1');
      // Provide a board with one piece at (0,0), color 'w'
      const fakePiece = { color: 'white', position: { x: 0, y: 0 } };
      ChessBoard.mockImplementation(() => ({
        activeColor: 'w',
        board: [[fakePiece]],
        capturedPieces: [],
        createFen: jest.fn().mockReturnValue('dummyFen'),
        getPieces: jest.fn().mockReturnValue([]),
        move: jest.fn().mockReturnValue(true),
        getPiece: jest.fn((x, y) => (x === 0 && y === 0 ? fakePiece : null)),
        isThreatened: jest.fn().mockReturnValue(false),
        fullmove: '1'
      }));
      service = new ChessGameService(undefined, dummyLog);
    });

    test('throws if no piece at from', () => {
      expect(() => service.validateMove({ x: 1, y: 1 }, { x: 2, y: 2 })).toThrow(ApiError);
    });

    test('throws if wrong piece color', () => {
      // Mock piece color mismatch: piece.color = 'black'
      const fakePiece = { color: 'black', position: { x: 0, y: 0 } };
      ChessBoard.mockImplementation(() => ({
        activeColor: 'w',
        board: [[fakePiece]],
        capturedPieces: [],
        createFen: jest.fn(),
        getPieces: jest.fn().mockReturnValue([]),
        move: jest.fn(),
        getPiece: jest.fn(() => fakePiece),
        isThreatened: jest.fn().mockReturnValue(false),
        fullmove: '1'
      }));
      service = new ChessGameService(undefined, dummyLog);
      expect(() => service.validateMove({ x: 0, y: 0 }, { x: 1, y: 1 })).toThrow(ApiError);
    });

    test('throws if simulationKingCheck returns true', () => {
      MoveUtils.simulationKingCheck.mockReturnValue(true);
      expect(() => service.validateMove({ x: 0, y: 0 }, { x: 1, y: 1 })).toThrow(ApiError);
    });

    test('returns true when castlingPossible returns true', () => {
      MoveUtils.simulationKingCheck.mockReturnValue(false);
      MoveUtils.castlingPossible.mockReturnValue(true);
      expect(service.validateMove({ x: 0, y: 0 }, { x: 2, y: 0 })).toBe(true);
    });

    test('throws if isValidMove returns false', () => {
      MoveUtils.simulationKingCheck.mockReturnValue(false);
      MoveUtils.castlingPossible.mockReturnValue(false);
      MoveUtils.isValidMove.mockReturnValue(false);
      expect(() => service.validateMove({ x: 0, y: 0 }, { x: 2, y: 2 })).toThrow(ApiError);
      expect(dummyLog.addEvent).toHaveBeenCalledWith(
        expect.stringContaining('ERROR : Invalid move')
      );
    });

    test('returns true when valid normal move', () => {
      MoveUtils.simulationKingCheck.mockReturnValue(false);
      MoveUtils.castlingPossible.mockReturnValue(false);
      MoveUtils.isValidMove.mockReturnValue(true);
      expect(service.validateMove({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(true);
    });
  });

  describe('saveFen', () => {
    beforeEach(() => {
      getGameCaptures.mockReturnValue('');
      getGameFen.mockReturnValue('fen w KQkq - 0 1');
      ChessBoard.mockImplementation(() => ({
        activeColor: 'w',
        board: [],
        capturedPieces: [],
        fullmove: '1',
        createFen: jest.fn().mockReturnValue('updatedFen'),
        getPieces: jest.fn().mockReturnValue([]),
        getPiece: jest.fn(),
        isThreatened: jest.fn().mockReturnValue(false),
        move: jest.fn().mockReturnValue(true)
      }));
      FenUtils.parseCapturedPiece.mockReturnValue('capStr');
      setGameFen.mockReturnValue(true);
      setGameCaptures.mockReturnValue(true);
      service = new ChessGameService(undefined, dummyLog);
    });

    test('saveFen returns true when both DB updates return 1', () => {
        // 1. Arrange: Mock ChessBoard and DB helpers
        const fakeBoard = {
            createFen: jest.fn().mockReturnValue('newFen'),
            capturedPieces: [ /* ...some piece objects... */ ],
        };
        ChessBoard.mockImplementation(() => fakeBoard);

        FenUtils.parseCapturedPiece.mockReturnValue('capsStr');
        setGameFen.mockReturnValue(1);
        setGameCaptures.mockReturnValue(1);

        // 2. Construct service (constructor will call getGameFen/getGameCaptures)
        const service = new ChessGameService(undefined, dummyLog);

        // 3. Act: call saveFen
        const result = service.saveFen();

        // 4. Assert:
        expect(fakeBoard.createFen).toHaveBeenCalled();
        expect(setGameFen).toHaveBeenCalledWith(service.gameId, 'newFen');
        expect(FenUtils.parseCapturedPiece).toHaveBeenCalledWith(fakeBoard.capturedPieces);
        expect(setGameCaptures).toHaveBeenCalledWith(service.gameId, 'capsStr');
        expect(result).toBe(true);
    });

    test('saveFen returns false when setGameFen does not return 1', () => {
        setGameFen.mockReturnValue(0);
        const result = service.saveFen();
        expect(result).toBe(false);
        // You can also assert that setGameCaptures was never called in this branch:
        expect(setGameCaptures).not.toHaveBeenCalled();
    });

    test('saveFen returns false when setGameCaptures does not return 1', () => {
        setGameFen.mockReturnValue(1);
        setGameCaptures.mockReturnValue(0);
        const result = service.saveFen();
        expect(result).toBe(false);
    });

  });
});
