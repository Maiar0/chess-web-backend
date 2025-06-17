const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const ApiError = require('../utils/ApiError');

class ChessDbManager {
  constructor() {
    this.dbDir = path.join(__dirname, '..', 'games'); // Directory to store game databases
    this.initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // initial FEN string for chess
  }

  /**
   * Sets the directory path for the database.
   *
   * @param {string} newDir - The new directory path to be used for the database.
   */
  setDbDir(newDir) {
    this.dbDir = newDir;
  }

  /**
   * Constructs the full file path for the database file associated with a given game ID.
   *
   * @param {string} gameId - The unique identifier for the game.
   * @returns {string} The absolute path to the database file for the specified game.
   */
  getDBPath(gameId) {
    return path.join(this.dbDir, `${gameId}.db`);
  }
  /**
   * Creates a new SQLite database for a chess game or opens an existing one, 
   * initializes the `game_state` table if it does not exist, and inserts the initial game state.
   *
   * @param {string} gameId - The unique identifier for the chess game.
   * @returns {string} The file path to the created or opened game database.
   */
  createGame(gameId) {
    const dbPath = this.getDBPath(gameId);// Get the path to the game database
    console.log(`⚙️ ChessDbManager.createGame called for gameId="${gameId}"`);
    console.log(`   → dbDir = "${this.dbDir}"`);
    console.log(`   → will create/open DB at dbPath = "${dbPath}"`);
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
  /**
   * Retrieves the game database instance for the specified game ID.
   *
   * @param {string} gameId - The unique identifier of the game.
   * @returns {Database|null} The Database instance if the database exists, otherwise null.
   */
  getGame(gameId) {
    const dbPath = this.getDBPath(gameId);// Get the path to the game database
    if (!fs.existsSync(dbPath)) return null; // if database does not exist, return null
    return new Database(dbPath);
  }
  /**
   * Deletes the database file associated with the specified game ID.
   * Attempts to open and close the database to release any potential file locks before deletion.
   * If the file does not exist, the method does nothing.
   *
   * @param {string} gameId - The unique identifier of the game whose database file should be deleted.
   */
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

  /**
   * Retrieves the FEN (Forsyth-Edwards Notation) string for a chess game from the database by game ID.
   *
   * @param {number|string} gameId - The unique identifier of the chess game.
   * @returns {string|null} The FEN string representing the current state of the game, or null if the game is not found.
   * @throws {ApiError} If no row is found for the given game ID.
   */
  getGameFen(gameId) {
    const db = this.getGame(gameId);
    if (!db) throw new ApiError('Game not found. Check if the game ID is correct.', 404);

    // Assumes you have a table `game_state(id INTEGER PRIMARY KEY, fen TEXT, ...)`
    const stmt = db.prepare('SELECT fen FROM game_state WHERE id = ?');
    const row = stmt.get(1);      // or use whatever your row-id is
    db.close();
    if (!row) throw new ApiError('No rows found. Check if the game ID is correct, or game has expired.', 404);
    return row.fen; // Return the FEN string from the database
  }
  /**
   * Updates the FEN (Forsyth-Edwards Notation) string for a specific game in the database.
   * Also updates the lastMove timestamp to the current time.
   *
   * @param {number|string} gameId - The unique identifier of the game whose FEN is to be updated.
   * @param {string} fen - The new FEN string representing the current state of the chess game.
   * @returns {number|null} The number of rows updated, or null if the game database does not exist.
   * @throws {ApiError} If no rows are updated (e.g., invalid game ID).
   */
  setGameFen(gameId, fen) {
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
  /**
   * Updates the captures for a specific game in the database.
   *
   * @param {number|string} gameId - The unique identifier of the game.
   * @param {any} captures - The captures data to be stored (format depends on schema).
   * @returns {number|null} The number of rows updated, or null if the game was not found.
   * @throws {ApiError} If no rows are updated, indicating the game ID may be incorrect.
   */
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
  /**
   * Retrieves the captures for a specific chess game by its ID.
   *
   * @param {string|number} gameId - The unique identifier of the chess game.
   * @returns {any|null} The captures data for the specified game, or null if the game does not exist.
   * @throws {ApiError} If no rows are found for the given game ID.
   */
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
  /**
   * Retrieves the color ('white' or 'black') assigned to a player in a specific game.
   *
   * @param {number|string} gameId - The unique identifier of the game.
   * @param {number|string} playerId - The unique identifier of the player.
   * @returns {('white'|'black'|null)} The color assigned to the player, or null if the player is not part of the game.
   * @throws {ApiError} If no game state is found for the provided game ID.
   */
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
  /**
   * Retrieves the player information for a given game and color.
   *
   * @param {number|string} gameId - The unique identifier of the game.
   * @param {'white'|'black'} color - The color of the player to retrieve ("white" or "black").
   * @returns {any|null} The player information associated with the specified color, or null if the game does not exist.
   * @throws {ApiError} If an invalid color is provided or if no row is found for the given game ID.
   */
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
  /**
   * Sets the player for a given game and color.
   *
   * @param {number|string} gameId - The unique identifier of the game.
   * @param {'white'|'black'} color - The color to assign the player to ("white" or "black").
   * @param {number|string} playerId - The unique identifier of the player to set.
   * @returns {boolean|null} Returns true if the player was set successfully, or null if the game was not found.
   * @throws {ApiError} Throws an error if the color is invalid or if no rows were updated.
   */
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
  /**
   * Retrieves the timestamp of the last move for a given game.
   *
   * @param {number|string} gameId - The unique identifier of the game.
   * @returns {string|null} The ISO 8601 string representing the last move time, or null if the game does not exist.
   * @throws {ApiError} If no rows are found for the provided game ID.
   */
  getLastMoveTime(gameId) {
    const db = this.getGame(gameId);
    if (!db) return null;

    const stmt = db.prepare('SELECT lastMove FROM game_state WHERE id = ?');
    const row = stmt.get(1);

    db.close();

    if (!row) throw new ApiError('No rows found. Check if the game ID is correct.', 404);
    return row.lastMove; // ISO 8601 string
  }
  /**
   * Retrieves the draw status for both white and black players in a chess game.
   *
   * @param {number|string} gameId - The unique identifier of the chess game.
   * @returns {{white: boolean, black: boolean}|null} An object indicating the draw status for white and black,
   *   or null if the game does not exist.
   * @throws {ApiError} If no rows are found for the given game ID.
   */
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
  /**
   * Updates the draw status for a specific color in a chess game.
   *
   * @param {number|string} gameId - The unique identifier of the game.
   * @param {'white'|'black'} color - The color of the player ('white' or 'black') whose draw status is being set.
   * @param {boolean} accepted - Whether the draw offer is accepted (true) or declined (false).
   * @returns {boolean|null} Returns true if the draw status was successfully updated, or null if the game was not found.
   * @throws {ApiError} Throws if an invalid color is provided or if the update fails.
   */
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