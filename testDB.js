const fs       = require('fs');
const path     = require('path');
const Database = require('better-sqlite3');
const { createGameDB, deleteGameDB, getGameDB } = require('./db/dbManager');

// 1. Test DB Creation
const gameId = 'vsCodeTest';
const dbPath = createGameDB(gameId);
console.log(`Database created at ${dbPath}`);
console.log('\tExists:', fs.existsSync(dbPath));
const db  = new Database(dbPath);
const row = db.prepare('SELECT fen FROM game_state WHERE id = 1').get();
console.log('\tInitial FEN:', row.fen);
db.close();
// 2. Test DB Deletion
const dbDeletePath = deleteGameDB(gameId);
console.log(`Database deleted`);
console.log('\tDeleted:', !fs.existsSync(dbDeletePath));

