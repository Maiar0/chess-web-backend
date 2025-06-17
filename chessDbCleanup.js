const fs = require('fs');
const path = require('path');
const ChessDbManager = require('./db/ChessDbManager');

const MAX_HOURS = 168;
const STALE_HOURS = 2;
const NEW_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Initialize DB manager and games directory
const dbManager = new ChessDbManager();
const GAMES_DIR = dbManager.dbDir;

function isGameOver(fen) {
  return !fen.includes('k') || !fen.includes('K');
}

function hoursSince(isoTime) {
  const last = new Date(isoTime);
  const now = new Date();
  return (now - last) / 36e5;
}

async function cleanUpDbs() {
  console.log('Running cleanup at', new Date().toISOString());
  let files;
  try {
    files = fs.readdirSync(GAMES_DIR);
  } catch (err) {
    console.error(`Failed to read games directory (${GAMES_DIR}):`, err.message);
    return;
  }

  for (const file of files) {
    if (!file.endsWith('.db')) continue;

    const gameId = path.basename(file, '.db');
    try {
      const fen = dbManager.getGameFen(gameId);
      const lastMove = dbManager.getLastMoveTime(gameId);
      const ageHours = hoursSince(lastMove);

      if (fen === NEW_FEN && ageHours > STALE_HOURS) {
        dbManager.deleteGame(gameId);
        console.log(`Deleted stale new game: ${file}`);
      } else if (ageHours > MAX_HOURS) {
        dbManager.deleteGame(gameId);
        console.log(`Deleted old game: ${file}`);
      } else if (isGameOver(fen)) {
        dbManager.deleteGame(gameId);
        console.log(`Deleted completed game: ${file}`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }
}

module.exports = cleanUpDbs;

// If run directly
if (require.main === module) {
  cleanUpDbs().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
}
