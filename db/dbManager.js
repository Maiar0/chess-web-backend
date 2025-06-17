const fs    = require('fs');
const path  = require('path'); 
const Database = require('better-sqlite3');
const { get } = require('http');
//TODO:: Should be able to remove this
const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // initial FEN string for chess
let dbDir = path.join(__dirname, '..', 'games');// Directory to store game databases
//so we can run tests
function setDbDir(newDir) {
  dbDir = newDir;
}
function getDBPath(gameId) {
  return path.join(dbDir, `${gameId}.db`);
}

function createGameDB(gameId){
    const dbPath = getDBPath(gameId);// Get the path to the game database
    if(!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, {recursive: true}); // if directory does not exist, create it
    const db = new Database(dbPath);//Create a new database or open an existing one
    db.exec(`
        CREATE TABLE IF NOT EXISTS game_state ( 
        id          INTEGER     PRIMARY KEY,
        fen         TEXT        NOT NULL,
        captures    TEXT        DEFAULT '',
        white       TEXT        DEFAULT '',
        black       TEXT        DEFAULT '',
        black_draw  INTEGER     DEFAULT 0,
        white_draw  INTEGER     DEFAULT 0,
        lastMove    DATETIME    DEFAULT (datetime('now'))
        );
    `);
    // Create the game_state table if it doesn't exist
    db.prepare(`
        INSERT OR REPLACE INTO game_state (id, fen, captures, white, black, black_draw, white_draw, lastMove)
        VALUES (1, ?, '', '', '', 0, 0, datetime('now'));
    `).run(initialFen);// Insert initial FEN string into the game_state table
    
    db.close();
    return dbPath;
}
// Create a new game database or open an existing one
function getGameDB(gameId){
    const dbPath = getDBPath(gameId);// Get the path to the game database
    if(!fs.existsSync(dbPath)) return null; // if database does not exist, return null
    return new Database(dbPath);
}
function deleteGameDB(gameId) {
  const dbPath = getDBPath(gameId);

  // If the file exists, first try opening & closing a connection to release any lock.
  if (fs.existsSync(dbPath)) {
    try {
      const tempDb = new Database(dbPath);
      tempDb.close();
    } catch (e) {
      // ignore if opening fails
    }
    // now it’s safe (or at least as safe as we can be) to delete:
    fs.unlinkSync(dbPath);
  }
}

function getGameFen(gameId) {
    const db = getGameDB(gameId);
    if (!db) return null;

    // Assumes you have a table `game_state(id INTEGER PRIMARY KEY, fen TEXT, ...)`
    const stmt = db.prepare('SELECT fen FROM game_state WHERE id = ?');
    const row = stmt.get(1);      // or use whatever your row-id is
    db.close();
    if (!row) throw new ApiError('No rows found. Check if the game ID is correct, or game has expired.', 404);
    return row.fen; // Return the FEN string from the database
}
function setGameFen(gameId, fen) {
    const db = getGameDB(gameId);
    if (!db){
        return null; // If the database does not exist, return null
    }

    // Assumes a table `game_state(id INTEGER PRIMARY KEY, fen TEXT, ...)`
    const stmt = db.prepare(`
        UPDATE game_state
        SET fen = ?, 
        lastMove = datetime('now')
        WHERE id = ?
        `);
    const info = stmt.run(fen, 1); // or use whatever your row-id is
    db.close();
    if (info.changes === 0) {
        throw new ApiError('No rows updated. Check if the game ID is correct.', 404);
    }
    return info.changes;
}

function setGameCaptures(gameId, captures) {
    const db = getGameDB(gameId);
    if (!db) return null;

    const stmt = db.prepare('UPDATE game_state SET captures = ? WHERE id = ?');
    const info = stmt.run(captures, 1);

    db.close();

    if (info.changes === 0) {
        throw new ApiError('No rows updated. Check if the game ID is correct.', 404);
    }
    return info.changes;
}
function getGameCaptures(gameId) {
    const db = getGameDB(gameId);
    if (!db) return null;

    const stmt = db.prepare('SELECT captures FROM game_state WHERE id = ?');
    const row = stmt.get(1);
    
    db.close();
    if (!row) {
        throw new ApiError('No rows found. Check if the game ID is correct, or game has expired.', 404);
    }

    return row.captures;
}

function getPlayer(gameId, color) {
    const db = getGameDB(gameId);
    if (!db) return null;

    if (color !== 'white' && color !== 'black') {
        throw new ApiError('Invalid color provided. Must be "white" or "black".', 400);
    }

    const stmt = db.prepare(`SELECT ${color} FROM game_state WHERE id = ?`);
    const row = stmt.get(1);

    db.close();

    if (!row) {
        throw new ApiError('No rows found. Check if the game ID is correct, or game has expired.', 404);
    }

    return row[color];
}

function setPlayer(gameId, color, playerId) {
    const db = getGameDB(gameId);
    if (!db) return null;

    if (color !== 'white' && color !== 'black') {
        throw new ApiError('Invalid color provided. Must be "white" or "black".', 400);
    }

    const stmt = db.prepare(`UPDATE game_state SET ${color} = ? WHERE id = ?`);
    const result = stmt.run(playerId, 1);

    db.close();

    if (result.changes === 0) {
        throw new ApiError('Failed to set player. No rows were updated.', 500);
    }

    return true;
}

function getLastMoveTime(gameId) {
    const db = getGameDB(gameId);
    if (!db) return null;

    const stmt = db.prepare('SELECT lastMove FROM game_state WHERE id = ?');
    const row = stmt.get(1);

    db.close();

    if (!row) throw new ApiError('No rows found. Check if the game ID is correct.', 404);
    return row.lastMove; // ISO 8601 string
}
/**
 * Get the current draw‐offer acceptance flags for both sides.
 * @param {string} gameId
 * @returns {{ white: boolean, black: boolean }}
 */
function getDrawStatus(gameId) {
  const db = getGameDB(gameId);
  if (!db) return null;

  const stmt = db.prepare(`
    SELECT white_draw AS white, black_draw AS black
    FROM game_state
    WHERE id = ?
  `);
  const row = stmt.get(1);
  db.close();

  if (!row) {
    throw new ApiError(
      'No rows found. Check if the game ID is correct.',
      404
    );
  }

  // Convert 0/1 integers to booleans
  return {
    white: Boolean(row.white),
    black: Boolean(row.black)
  };
}

/**
 * Set one side’s draw‐acceptance flag.
 * @param {string} gameId
 * @param {'white'|'black'} color
 * @param {boolean} accepted
 * @returns {boolean} true on success
 */
function setDrawStatus(gameId, color, accepted) {
  const db = getGameDB(gameId);
  if (!db) return null;

  if (color !== 'white' && color !== 'black') {
    throw new ApiError(
      'Invalid color provided. Must be "white" or "black".',
      400
    );
  }

  // Choose the correct column
  const col = color === 'white' ? 'white_draw' : 'black_draw';

  const stmt = db.prepare(`
    UPDATE game_state
    SET ${col} = ?
    WHERE id = ?
  `);
  const info = stmt.run(accepted ? 1 : 0, 1);
  db.close();

  if (info.changes === 0) {
    throw new ApiError(
      'Failed to update draw status. No rows were updated.',
      500
    );
  }

  return true;
}

module.exports = {
    setDbDir,
    createGameDB,
    getGameDB,
    deleteGameDB,
    getGameFen,
    setGameFen,
    setGameCaptures,
    getGameCaptures,
    getPlayer,
    setPlayer,
    getLastMoveTime,
    getDrawStatus,
    setDrawStatus
};