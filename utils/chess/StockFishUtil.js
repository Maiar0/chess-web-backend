const { Engine } = require('node-uci');
const path = require('path');
const isWindows = process.platform === 'win32';
const binaryPath = isWindows
  ? path.resolve(__dirname, '../../engines/stockfish-win.exe')
  : path.resolve(__dirname, '../../engines/stockfish-linux');

const enginePath = path.resolve(__dirname, binaryPath);
console.log(binaryPath);
async function getBestMove(fen) {
  const engine = new Engine(enginePath);
  await engine.init();
  await engine.setoption('Threads', 1);
  await engine.position(fen);
  const result = await engine.go({ depth: 12 });
  await engine.quit();
  return result.bestmove;
}

module.exports = { getBestMove };
