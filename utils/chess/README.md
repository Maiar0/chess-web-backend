

# ♟️ utils/chess/

````markdown
This folder contains chess-specific utility modules that support game validation, FEN parsing, AI integration, and rule enforcement. These utilities are used throughout the game service, controller, and board logic.
````
---

## 📁 Modules Overview

| File               | Purpose                                                          |
|--------------------|------------------------------------------------------------------|
| `FenUtils.js`      | Convert between FEN ↔️ Board, handle captures and positions      |
| `MoveUtils.js`     | Simulate checks, castling, draw conditions, and validate moves  |
| `StockFishUtil.js` | Interface with Stockfish engine for AI move calculation         |

---

## 🔠 `FenUtils.js`

Utilities for working with **Forsyth-Edwards Notation (FEN)** and board state.

#### Key Methods:

- `parseFen(fen)` → 8×8 board array
- `parseBoard(board, color, ...)` → FEN string from board state
- `parseCaptureString(str)` / `parseCapturedPiece(pieces)`
- `toAlgebraic([x, y])` / `fromAlgebraic("e4")`

#### Example:

```js
const board = FenUtils.parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
const fen = FenUtils.parseBoard(board, 'w', 'KQkq', '-', 0, 1);
````

---

## 🔍 `MoveUtils.js`

Simulates chess rules and validates special scenarios.

#### Key Functions:

| Function                    | Purpose                                     |
| --------------------------- | ------------------------------------------- |
| `simulationKingCheck()`     | Check if a move leaves king in check        |
| `simulationKingCheckMate()` | Check if board is in checkmate              |
| `evaluateStalemate()`       | Detect stalemate                            |
| `evaluateMaterialsDraw()`   | Check for draw by insufficient material     |
| `castlingPossible()`        | Determine if castling is legal              |
| `isValidMove()`             | Check if a piece can legally move to square |

---

## 🤖 `StockFishUtil.js`

Wraps the Stockfish engine using `node-uci`.

#### Method:

* `getBestMove(fen)` – Returns best UCI move for a given FEN at depth 4.

```js
const move = await getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
// => "e2e4"
```

---

## 🧠 Design Notes

* These modules **do not mutate global state** — they're safe for simulation and prediction.
* They are **imported directly** into game services, controllers, and board logic.
* Logic here is decoupled from Express, Socket.IO, or database layers.

---

