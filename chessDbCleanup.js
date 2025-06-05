const fs = require('fs');
const path = require('path');
const{ getGameFen, getLastMoveTime, deleteGameDB } = require('./db/dbManager');

const MAX_HOURS = 168;
const STALE_HOURS = 2;
const NEW_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const GAMES_DIR = path.join(__dirname, 'games');

function isGameOver(fen){
    if(!fen.includes('k') && !fen.includes('K')){//TODO:: we dont remove king yet
        return true;
    }
    return false;
}

function isOld(isoTime){
    const last = new Date(isoTime);
    const now = new Date();
    const ageHours = (now - last) / 36e5;
    return ageHours > MAX_HOURS;//TODO:: remove if 1 week old this is from creation currently not last update we need to do a las tupdate in saveFen
}
function isGameStale(fen, isoTime){
    const last = new Date(isoTime);
    const now = new Date();
    const ageHours = (now - last) / 36e5;
    if(fen === NEW_FEN && ageHours > STALE_HOURS){
        return true;
    }
    return false;
}

module.exports = async function cleanUpDbs() {
  console.log("Running daily task at", new Date().toISOString());
  const files = fs.readdirSync(GAMES_DIR);
  for(const file of files){
    if(!file.endsWith('.db')) continue;

    const gameId = path.basename(file, '.db');
    try{
        const fen = getGameFen(gameId);
        const lastMove = getLastMoveTime(gameId);
        if(isGameStale(fen, lastMove) ){
            deleteGameDB(gameId);
            console.log(`Deleted Stale game: ${file}`);
        }else if(isOld(lastMove)){
            deleteGameDB(gameId);
            console.log(`Deleted Old game: ${file}`);
        }else if(isGameOver(fen)){
            deleteGameDB(gameId);
            console.log(`Deleted Over game: ${file}`);
        }
    }catch(err){
        console.error(`Error inspecting ${file}:`, err.message);
    }
  }
};

if (require.main === module) {
  // File is being run directly (via `node chessDbCleanup.js`)
  (async () => {
    try {
      await module.exports();
    } catch (err) {
      console.error("Daily task failed:", err);
      process.exit(1);
    }
  })();
}