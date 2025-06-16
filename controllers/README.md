# 🧠 Controllers

This folder contains the core control logic for handling both **HTTP requests** and **WebSocket events** in the chess backend application.

---

## 📁 Files

### `chessController.js`

This module exposes all RESTful API handlers for managing chess game interactions.

#### Responsibilities:

- Creating and initializing games (`/newGame`)
- Processing player moves and triggering AI moves
- Handling resignations and draw negotiations
- Serving game state to clients
- Coordinating database logging and API responses

#### Key Functions:

| Function         | Route             | Description                                      |
|------------------|-------------------|--------------------------------------------------|
| `newGame`        | `/newGame`        | Starts a new game, with optional AI opponent     |
| `requestMove`    | `/move`           | Validates and processes a player's move          |
| `getInfo`        | `/getInfo`        | Returns full game state and metadata             |
| `chooseColor`    | `/choosecolor`    | Assigns a player to a color                      |
| `resign`         | `/resign`         | Handles a player's resignation                   |
| `drawResponse`   | `/drawResponse`   | Accepts or declines a draw offer                 |
| `claimDraw`      | `/claimDraw`      | Claims draw when 50-move or repetition applies   |

---

### `chessSocketController.js`

This module initializes and manages WebSocket connections using `socket.io`.

#### Responsibilities:

- Tracking connected players by socket ID
- Managing game room joins via `gameId`
- Relaying draw offers and results in real-time
- Cleaning up on disconnect
- Exposing a shared `io` instance across modules

#### Socket Events Handled:

| Event             | Direction       | Description                                      |
|-------------------|------------------|--------------------------------------------------|
| `registerPlayer`  | Client → Server  | Links player ID to current socket session        |
| `joinGame`        | Client → Server  | Joins a socket.io room corresponding to a gameId |
| `offerDraw`       | Client → Server  | Broadcasts a draw offer to both players          |
| `drawOffered`     | Server → Client  | Notifies that a draw has been offered            |
| `drawResult`      | Server → Client  | Communicates acceptance or rejection of a draw   |
| `disconnect`      | System           | Cleans up mappings when a player disconnects     |

---

## 🔄 Interconnection

- `chessController.js` emits socket events (`gameState`, `resignation`, etc.) to broadcast game updates.
- `chessSocketController.js` listens for incoming real-time actions and notifies players via rooms.
- Both rely on the `ChessGameService` for internal game logic and `ChessDbManager` for persistent storage.

---

## 📝 Notes

- Controllers are **stateless** and rely on IDs passed in the request body.
- Logging is handled via `LogSession`, written to file after every request.
- All socket communication is scoped to a game room using the `gameId` string.

