// __tests__/dbManager.test.js
const os   = require('os');
const fs   = require('fs');
const path = require('path');

// 1) make a throwaway directory
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'games-test-'));

// 2) import and reconfigure dbManager
const db = require('../../db/dbManager');
db.setDbDir(tmpDir);

// 3) pull out the helpers
const {
  createGameDB,
  getGameDB,
  deleteGameDB,
  getGameFen,
  setGameFen,
  setGameCaptures,
  getGameCaptures,
  getPlayer,
  setPlayer
} = db;

// clean up the whole tmpDir once tests finish
afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('dbManager (isolated)', () => {
  const gameId = 'test123';

  test('createGameDB creates a .db file and returns its path', () => {
    const dbPath = createGameDB(gameId);
    expect(dbPath.startsWith(tmpDir)).toBe(true);
    expect(fs.existsSync(dbPath)).toBe(true);
  });

  test('getGameDB returns a Database instance only after creation', () => {
    expect(getGameDB('nope')).toBeNull();
    createGameDB(gameId);
    const instance = getGameDB(gameId);
    expect(instance).not.toBeNull();
    instance.close();
  });

  test('setGameFen/getGameFen round‐trip', () => {
    createGameDB(gameId);
    const before = getGameFen(gameId);
    const newFen = '8/8/8/8/8/8/8/8 w - - 0 1';
    expect(setGameFen(gameId, newFen)).toBe(1);
    expect(getGameFen(gameId)).toBe(newFen);
  });

  test('setGameCaptures/getGameCaptures round‐trip', () => {
    createGameDB(gameId);
    expect(setGameCaptures(gameId, 'pP')).toBe(1);
    expect(getGameCaptures(gameId)).toBe('pP');
  });

  test('setPlayer/getPlayer round‐trip', () => {
    createGameDB(gameId);
    expect(setPlayer(gameId, 'white', 'alice')).toBe(true);
    expect(getPlayer(gameId, 'white')).toBe('alice');
  });

  test('deleteGameDB removes the file', () => {
    const p = createGameDB(gameId);
    expect(fs.existsSync(p)).toBe(true);
    deleteGameDB(gameId);
    expect(fs.existsSync(p)).toBe(false);
  });
});
