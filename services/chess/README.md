# ♟️ services/chess

This folder contains the `ChessGameService` class, the main orchestrator for chess game sessions. It coordinates board state, player turns, move validation, AI logic, and persistence with the database.

---

## 📄 File: `ChessGameService.js`

The `ChessGameService` acts as the **domain controller** for each chess game instance. It encapsulates logic for:

- Move validation and execution
- Turn handling and game status evaluation
- FEN generation and persistence
- Color selection and player-role enforcement
- AI move calculation (via Stockfish)
- Checkmate, stalemate, and draw rule evaluation

---

## 🧠 Core Responsibilities

| Method               | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| `requestMove()`      | Validates and applies player moves                                          |
| `validateMove()`     | Confirms legality of moves (check safety, castling, etc.)                   |
| `endTurn()`          | Switches turns, evaluates game-ending conditions                            |
| `chooseColor()`      | Assigns color to player, handles conflicts and AI logic                     |
| `processAiMove()`    | Asynchronously executes AI move using Stockfish                             |
| `evaluateStatus()`   | Computes whether the game is active, checkmate, draw, or stalemate          |
| `saveFen()`          | Serializes and stores board state and captured pieces                       |
| `isPlayersTurn()`    | Determines if the requesting player can move                                |
| `newGame()`          | Initializes a fresh game instance with optional AI                          |

---

## 🔄 Game Flow Overview

1. **Initialization**  
   A game is started with a unique `gameId` and a new board state via `newGame()`.
2. **Color Selection**  
   Players call `chooseColor()` to reserve white or black.
3. **Gameplay Loop**  
   Each move is:
   - Validated with `validateMove()`
   - Executed on the board with `.move()`
   - Followed by `endTurn()` to check status and switch turns
4. **AI Integration**  
   If it's the AI’s turn, `processAiMove()` is triggered automatically.

---

## ⚙️ Dependencies

- `ChessBoard` – Maintains the actual piece layout, move logic, and FEN serialization
- `ChessDbManager` – Persists FEN, players, draw status, and captured pieces
- `MoveUtils` – Contains helper functions like simulation-based check/checkmate evaluation
- `StockFishUtil` – Interfaces with the Stockfish engine for AI move suggestions
- `LogSession` – Logs each significant game event for replay/debugging

---

## 🧪 Notes

- The service is **stateless between requests**: all state is reconstructed from the DB and FEN on each instantiation.
- `gameId` must be passed with each API call to target the correct game session.
- AI is treated as player `'ai'` and is always assigned black.

---
