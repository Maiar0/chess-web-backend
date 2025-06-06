// __tests__/gameDB.test.js
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

// Helper to remove the entire 'games' directory after each test (if it’s empty or not)
function cleanupGamesDir() {//TODO:: this is dangerous to have laying around
    const dbDir = path.join(__dirname, '..', 'games');
    if (!fs.existsSync(dbDir)) return;

    // Delete all files within
    for (const file of fs.readdirSync(dbDir)) {
        const fullPath = path.join(dbDir, file);
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
            fs.unlinkSync(fullPath);
        }
    }

    // Remove the directory if it’s empty
    try {
        fs.rmdirSync(dbDir);
    } catch (err) {
        // might not be empty or already removed; ignore
    }
}

describe('gameDB module', () => {
    const testGameId = 'jest_test_game';

    afterEach(() => {
        // Delete the test database (and directory) after each test
        deleteGameDB(testGameId);
        cleanupGamesDir();
    });

    test('createGameDB should create a new .db file and return its path', () => {
        const dbPath = createGameDB(testGameId);
        expect(typeof dbPath).toBe('string');

        // The file should exist on disk
        expect(fs.existsSync(dbPath)).toBe(true);

        // The returned path should end with "<testGameId>.db"
        expect(path.basename(dbPath)).toBe(`${testGameId}.db`);
    });

    test('getGameDB should return a Database instance when DB exists, and null when it does not', () => {
        // Initially, no DB exists
        let dbInstance = getGameDB(testGameId);
        expect(dbInstance).toBeNull();

        // Create it, then getGameDB should return a non-null object
        createGameDB(testGameId);
        dbInstance = getGameDB(testGameId);
        expect(dbInstance).not.toBeNull();

        // Closing the returned Database instance
        dbInstance.close();
    });

    test('getGameFen should return the initial FEN after creation, and null if DB does not exist', () => {
        // If DB doesn't exist, getGameFen returns null
        expect(getGameFen(testGameId)).toBeNull();

        // After creation, getGameFen returns the initial position
        createGameDB(testGameId);
        const fen = getGameFen(testGameId);
        expect(typeof fen).toBe('string');
        expect(fen).toMatch(/^rnbqkbnr\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\/RNBQKBNR w KQkq/);
    });

    test('setGameCaptures and getGameCaptures should update and retrieve captures correctly', () => {
        createGameDB(testGameId);

        // Before setting, captures should be empty string
        let initialCaptures = getGameCaptures(testGameId);
        expect(initialCaptures).toBe('');

        // Set captures
        const changes = setGameCaptures(testGameId, 'rNb3,qQ5');
        expect(changes).toBe(1);

        // Now retrieving should return the new captures
        const newCaptures = getGameCaptures(testGameId);
        expect(newCaptures).toBe('rNb3,qQ5');
    });

    test('getPlayer and setPlayer (white and black) should work as expected', () => {
        createGameDB(testGameId);

        // Initially, both white and black columns are empty strings
        expect(getPlayer(testGameId, 'white')).toBe('');
        expect(getPlayer(testGameId, 'black')).toBe('');

        // Set white player
        const whiteSet = setPlayer(testGameId, 'white', 'player123');
        expect(whiteSet).toBe(true);
        expect(getPlayer(testGameId, 'white')).toBe('player123');

        // Set black player
        const blackSet = setPlayer(testGameId, 'black', 'enemy456');
        expect(blackSet).toBe(true);
        expect(getPlayer(testGameId, 'black')).toBe('enemy456');
    });

    test('getLastMoveTime should return a valid ISO string after creation', () => {
        createGameDB(testGameId);

        const lastMove = getLastMoveTime(testGameId);
        expect(typeof lastMove).toBe('string');

        // It should be parseable as a Date
        const parsed = Date.parse(lastMove);
        expect(isNaN(parsed)).toBe(false);
    });

    test('deleteGameDB should remove the .db file from disk', () => {
        const dbPath = createGameDB(testGameId);
        expect(fs.existsSync(dbPath)).toBe(true);

        // Delete and verify
        deleteGameDB(testGameId);
        expect(fs.existsSync(dbPath)).toBe(false);

        // Now getGameDB should return null
        expect(getGameDB(testGameId)).toBeNull();
    });

    test('setGameFen should update the FEN in game_state (if SQL is correct)', () => {
        createGameDB(testGameId);

        // Retrieve initial FEN
        const originalFen = getGameFen(testGameId);
        expect(originalFen).toBeTruthy();

        // Attempt to set a new FEN
        // (NOTE: If the SQL in setGameFen is invalid, this call may throw. If so, adapt code accordingly.)
        const newFen = '8/8/8/8/8/8/8/8 w - - 0 1'; 
        let changes;
        expect(() => {
            changes = setGameFen(testGameId, newFen);
        }).not.toThrow();

        // Changes should be 1
        expect(changes).toBe(1);

        // Now getGameFen should return the updated string
        const fetchedFen = getGameFen(testGameId);
        expect(fetchedFen).toBe(newFen);
    });
});
