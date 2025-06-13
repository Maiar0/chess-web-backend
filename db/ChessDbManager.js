const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const ApiError = require('../utils/ApiError');

class ChessDbManager {
  constructor() {
    this.dbDir = path.join(__dirname, '..', 'games'); // Directory to store game databases
    this.initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // initial FEN string for chess
  }

  setDbDir(newDir) {
    this.dbDir = newDir;
  }

  getDBPath(gameId) {
    return path.join(this.dbDir, `${gameId}.db`);
  }
  createGame(gameId) {//TODO:: Needs tested
    const dbPath = this.getDBPath(gameId);// Get the path to the game database
    if (!fs.existsSync(this.dbDir)) fs.mkdirSync(this.dbDir, { recursive: true }); // if directory does not exist, create it
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
        `).run(this.initialFen);// Insert initial FEN string into the game_state table

    db.close();
    return dbPath;
  }
  getGame(gameId) {
    const dbPath = this.getDBPath(gameId);// Get the path to the game database
    if (!fs.existsSync(dbPath)) return null; // if database does not exist, return null
    return new Database(dbPath);
  }
  deleteGame(gameId) {
    const dbPath = this.getDBPath(gameId);

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

  getGameFen(gameId) {
    const db = this.getGame(gameId);
    if (!db) return null;

    // Assumes you have a table `game_state(id INTEGER PRIMARY KEY, fen TEXT, ...)`
    const stmt = db.prepare('SELECT fen FROM game_state WHERE id = ?');
    const row = stmt.get(1);      // or use whatever your row-id is
    db.close();
    if (!row) throw new ApiError('No rows found. Check if the game ID is correct, or game has expired.', 404);
    return row.fen; // Return the FEN string from the database
  }
  setGameFen(gameId, fen) {//TODO:: Test
    const db = this.getGame(gameId);
    if (!db) {
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
  setGameCaptures(gameId, captures) {
    const db = this.getGame(gameId);
    if (!db) return null;

    const stmt = db.prepare('UPDATE game_state SET captures = ? WHERE id = ?');
    const info = stmt.run(captures, 1);

    db.close();

    if (info.changes === 0) {
      throw new ApiError('No rows updated. Check if the game ID is correct.', 404);
    }
    return info.changes;
  }
  getGameCaptures(gameId) {
    const db = this.getGame(gameId);
    if (!db) return null;

    const stmt = db.prepare('SELECT captures FROM game_state WHERE id = ?');
    const row = stmt.get(1);

    db.close();
    if (!row) {
      throw new ApiError('No rows found. Check if the game ID is correct, or game has expired.', 404);
    }

    return row.captures;
  }
  getPlayerColor(gameId, playerId) {
    const db = this.getGame(gameId);
    if (!db) return null;

    // Load both columns in one query
    const stmt = db.prepare(`
      SELECT white, black
      FROM game_state
      WHERE id = ?
    `);
    const row = stmt.get(1);
    db.close();

    if (!row) {
      throw new ApiError(
        'No game state found. Check that the game ID is correct.',
        404
      );
    }

    if (row.white === playerId) return 'white';
    if (row.black === playerId) return 'black';
    return null;
  }
  getPlayer(gameId, color) {
    const db = this.getGame(gameId);
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
  setPlayer(gameId, color, playerId) {
    const db = this.getGame(gameId);
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
  getLastMoveTime(gameId) {
    const db = this.getGame(gameId);
    if (!db) return null;

    const stmt = db.prepare('SELECT lastMove FROM game_state WHERE id = ?');
    const row = stmt.get(1);

    db.close();

    if (!row) throw new ApiError('No rows found. Check if the game ID is correct.', 404);
    return row.lastMove; // ISO 8601 string
  }
  getDrawStatus(gameId) {
    const db = this.getGame(gameId);
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
  setDrawStatus(gameId, color, accepted) {
    const db = this.getGame(gameId);
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
}
module.exports = ChessDbManager;