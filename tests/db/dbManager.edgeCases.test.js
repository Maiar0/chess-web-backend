// __tests__/gameDB.edgeCases.test.js
const fs = require('fs');
const path = require('path');

const {
    createGameDB,
    getGameDB,
    deleteGameDB,
    getGameFen,
    setGameFen,
    setGameCaptures,
    getGameCaptures,
    getPlayer,
    setPlayer,
    getLastMoveTime
} = require('../../db/dbManager');

const ApiError = require('../../utils/ApiError');


function cleanupGamesDir() {
    const dbDir = path.join(__dirname, '..', 'games');
    if (!fs.existsSync(dbDir)) return;
    for (const file of fs.readdirSync(dbDir)) {
        const fullPath = path.join(dbDir, file);
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
            fs.unlinkSync(fullPath);
        }
    }
    try {
        fs.rmdirSync(dbDir);
    } catch (err) {
        // ignore
    }
}

describe('gameDB edge cases and error branches', () => {
    const missingGameId = 'does_not_exist';
    const testGameId = 'jest_edge_test';

    afterEach(() => {
        deleteGameDB(testGameId);
        cleanupGamesDir();
    });

    test('getGameFen returns null if DB does not exist', () => {
        expect(getGameFen(missingGameId)).toBeNull();
    });

    test('getGameFen throws if no row exists in table', () => {
        // 1. Create DB and capture its path
        const dbPath = createGameDB(testGameId);

        // 2. Open DB and delete the only row in game_state
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        db.prepare('DELETE FROM game_state WHERE id = ?').run(1);
        db.close();

        // 3. Now getGameFen should throw an ApiError
        expect(() => getGameFen(testGameId)).toThrow();
    });

    test('setGameFen returns null if DB does not exist', () => {
        expect(setGameFen(missingGameId, 'anything')).toBeNull();
    });

    test('setGameFen throws if no rows are updated', () => {
        // Create DB and capture its path
        const dbPath = createGameDB(testGameId);

        // Delete the row so that UPDATE affects 0 rows
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        db.prepare('DELETE FROM game_state WHERE id = ?').run(1);
        db.close();

        expect(() => setGameFen(testGameId, '8/8/8/8/8/8/8/8 w - - 0 1')).toThrow();
    });

    test('setGameCaptures returns null if DB does not exist', () => {
        expect(setGameCaptures(missingGameId, 'capt')).toBeNull();
    });

    test('setGameCaptures throws if no rows are updated', () => {
        // Create DB and capture its path
        const dbPath = createGameDB(testGameId);

        // Delete the row so that UPDATE affects 0 rows
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        db.prepare('DELETE FROM game_state WHERE id = ?').run(1);
        db.close();

        expect(() => setGameCaptures(testGameId, 'xP')).toThrow();
    });

    test('getGameCaptures returns null if DB does not exist', () => {
        expect(getGameCaptures(missingGameId)).toBeNull();
    });

    test('getGameCaptures throws if no row exists', () => {
        // Create DB and capture its path
        const dbPath = createGameDB(testGameId);

        // Delete the row so that SELECT returns undefined
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        db.prepare('DELETE FROM game_state WHERE id = ?').run(1);
        db.close();

        expect(() => getGameCaptures(testGameId)).toThrow();
    });

    test('getPlayer returns null if DB does not exist', () => {
        expect(getPlayer(missingGameId, 'white')).toBeNull();
    });

    test('getPlayer throws on invalid color', () => {
        createGameDB(testGameId);
        expect(() => getPlayer(testGameId, 'green')).toThrow();
    });

    test('getPlayer throws if no row exists', () => {
        // Create DB and capture its path
        const dbPath = createGameDB(testGameId);

        // Delete the row so that SELECT returns undefined
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        db.prepare('DELETE FROM game_state WHERE id = ?').run(1);
        db.close();

        expect(() => getPlayer(testGameId, 'white')).toThrow();
    });

    test('setPlayer returns null if DB does not exist', () => {
        expect(setPlayer(missingGameId, 'white', 'p1')).toBeNull();
    });

    test('setPlayer throws on invalid color', () => {
        createGameDB(testGameId);
        expect(() => setPlayer(testGameId, 'purple', 'p1')).toThrow();
    });

    test('setPlayer throws if no rows are updated', () => {
        // Create DB and capture its path
        const dbPath = createGameDB(testGameId);

        // Delete the row so that UPDATE affects 0 rows
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        db.prepare('DELETE FROM game_state WHERE id = ?').run(1);
        db.close();

        expect(() => setPlayer(testGameId, 'white', 'p1')).toThrow();
    });

    test('getLastMoveTime returns null if DB does not exist', () => {
        expect(getLastMoveTime(missingGameId)).toBeNull();
    });

    test('getLastMoveTime throws if no row exists', () => {
        // Create DB and capture its path
        const dbPath = createGameDB(testGameId);

        // Delete the row so that SELECT returns undefined
        const Database = require('better-sqlite3');
        const db = new Database(dbPath);
        db.prepare('DELETE FROM game_state WHERE id = ?').run(1);
        db.close();

        expect(() => getLastMoveTime(testGameId)).toThrow();
    });

    test('deleteGameDB does not error if file is missing', () => {
        // Ensure no DB file exists
        cleanupGamesDir();
        expect(() => deleteGameDB(missingGameId)).not.toThrow();
    });
});
