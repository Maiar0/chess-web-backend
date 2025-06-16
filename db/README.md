# 🗃️ Database (db/)

This folder contains the logic responsible for database operations in the chess backend. Each chess game is stored in its own SQLite database file to isolate game data and simplify cleanup.

---

## 📄 File: `ChessDbManager.js`

This class handles creation, access, updates, and deletion of game-specific databases. It uses `better-sqlite3` for synchronous and fast SQL queries, and stores databases under the `/games` directory.

---

## 🧩 Responsibilities

- 📁 Creates one database file per game (`games/{gameId}.db`)
- ♟ Stores board state using FEN, captures, player IDs, and draw status
- 🔄 Tracks and updates data such as last move time, player assignments, and draw responses
- 🧹 Safely deletes stale databases after game completion or timeout

---

## 🗃️ Database Schema

Each game database has a single table: `game_state`.

| Column       | Type     | Description                                |
|--------------|----------|--------------------------------------------|
| `id`         | INTEGER  | Always `1`; single-row schema               |
| `fen`        | TEXT     | Current board state in FEN notation        |
| `captures`   | TEXT     | Captured pieces string                     |
| `white`      | TEXT     | Player ID for white                        |
| `black`      | TEXT     | Player ID for black                        |
| `white_draw` | INTEGER  | 1 if white accepted draw, 0 otherwise      |
| `black_draw` | INTEGER  | 1 if black accepted draw, 0 otherwise      |
| `lastMove`   | DATETIME | Timestamp of last move                     |

---

## 🔧 Key Methods

| Method                    | Purpose                                             |
|---------------------------|-----------------------------------------------------|
| `createGame(gameId)`      | Initializes a new database file with empty state    |
| `deleteGame(gameId)`      | Safely deletes a game's database                    |
| `getGameFen(gameId)`      | Retrieves the FEN board state                       |
| `setGameFen(gameId, fen)` | Updates the FEN board state                         |
| `setPlayer(gameId, color, playerId)` | Assigns player to color                 |
| `getPlayerColor(gameId, playerId)`   | Resolves player’s assigned color       |
| `getDrawStatus(gameId)`   | Returns draw accept status for both players         |
| `setDrawStatus(gameId, color, accepted)` | Updates draw response for a color |
| `getLastMoveTime(gameId)` | Returns timestamp of last move                      |

---

## ⚠️ Notes

- This setup is optimized for lightweight short-lived game instances.
- For scalability, a future enhancement could replace per-file DBs with a centralized relational DB (e.g., PostgreSQL).
- All game data is stored under the `/games` directory — make sure this is not committed to version control.

---

