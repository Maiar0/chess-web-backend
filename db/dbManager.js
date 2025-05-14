const fs    = require('fs');
const path  = require('path'); 
const Database = require('better-sqlite3');
const { get } = require('http');

const intialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'; // initial FEN string for chess
const dbDir = path.join(__dirname, '..', 'games');// Directory to store game databases

function getDBPath(gameId){
    return path.join(dbDir, `${gameId}.db`);// Path to the game database
}

function createGameDB(gameId){
    const dbPath = getDBPath(gameId);// Get the path to the game database
    if(!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, {recursive: true}); // if directory does not exist, create it
    const db = new Database(dbPath);//Create a new database or open an existing one
    db.exec(`
        CREATE TABLE IF NOT EXISTS game_state ( 
        id  INTEGER  PRIMARY KEY,
        fen TEXT    NOT NULL
        );
    `);
    // Create the game_state table if it doesn't exist
    db.prepare(`
        INSERT OR REPLACE INTO game_state (id, fen)
        VALUES (1,?);
    `).run(intialFen);// Insert initial FEN string into the game_state table
    
    db.close();
    return dbPath;
}
// Create a new game database or open an existing one
function getGameDB(gameId){
    const dbPath = getDBPath(gameId);// Get the path to the game database
    if(!fs.existsSync(dbPath)) return null; // if database does not exist, return null
    return new Database(dbPath);
}
//Delete the game database if it exists
function deleteGameDB(gameId){
    const dbPath = getDBPath(gameId);// Get the path to the game database
    if(fs.existsSync(dbPath)) fs.unlinkSync(dbPath); // if database exists, delete it
}

function getGameFen(gameId) {
    const db = getGameDB(gameId);
    if (!db) return null;

    // Assumes you have a table `game_state(id INTEGER PRIMARY KEY, fen TEXT, ...)`
    const stmt = db.prepare('SELECT fen FROM game_state WHERE id = ?');
    const row = stmt.get(1);      // or use whatever your row-id is
    db.close();

    return row.fen; // Return the FEN string from the database
}
function setGameFen(gameId, fen) {
    const db = getGameDB(gameId);
    if (!db) return null;

    // Assumes you have a table `game_state(id INTEGER PRIMARY KEY, fen TEXT, ...)`
    const stmt = db.prepare('UPDATE game_state SET fen = ? WHERE id = ?');
    const info = stmt.run(fen, 1); // or use whatever your row-id is
    db.close();

    return info.changes > 0;
}

module.exports = {
    createGameDB,
    getGameDB,
    deleteGameDB,
    getGameFen,
    setGameFen
};