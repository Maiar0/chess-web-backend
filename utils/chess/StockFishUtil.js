const { Engine } = require('node-uci');
const path = require('path');
const isWindows = process.platform === 'win32';
const binaryPath = isWindows
  ? path.resolve(__dirname, '../../engines/stockfish-win.exe')
  : path.resolve(__dirname, '../../engines/stockfish-linux');

const enginePath = path.resolve(__dirname, binaryPath);
console.log(binaryPath);
/**
 * Asynchronously calculates the best chess move for a given FEN position using the Stockfish engine.
 *
 * @param {string} fen - The FEN string representing the current chess board position.
 * @returns {Promise<string>} A promise that resolves to the best move in UCI format.
 */
async function getBestMove(fen) {
  const engine = new Engine(enginePath);
  await engine.init();
  await engine.setoption('Threads', 1);
  await engine.position(fen);
  const result = await engine.go({ depth: 4 });
  await engine.quit();
  return result.bestmove;
}

module.exports = { getBestMove };
