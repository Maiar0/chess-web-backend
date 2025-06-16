
# ♟️ Chess Web Backend
This repository contains the backend server powering a web-based multiplayer chess game. Built with **Node.js**, **Express**, **WebSockets**, and **SQLite**, the backend provides HTTP APIs for core gameplay logic and real-time communication features to support live player interactions.

---

## 📦 Features

```markdown
- 🎮 Create and manage multiplayer chess games
- 🔄 Real-time updates via Socket.IO
- 💾 Game state management using SQLite
- 🤖 Optional AI opponent using Stockfish
- 📡 REST API for move validation, draw/resign logic, and game retrieval
- 🧼 Daily cleanup of old game databases (configurable via cron)
````
---

## 🧱 Tech Stack

- **Backend:** Node.js, Express
- **WebSocket:** Socket.IO
- **Database:** SQLite (via better-sqlite3 and sqlite3)
- **AI Engine:** Stockfish via node-uci
- **Task Scheduling:** node-cron
  
---

## 🗂️ Project Structure

```markdown
controllers/
chessController.js        # Handles game logic and API routes
chessSocketController.js  # WebSocket event handlers
db/
ChessDbManager.js         # Database interaction layer
routes/
chessRoutes.js            # RESTful API routes
services/
chess/ChessGameService.js # Game service logic per instance
utils/
chess/                   # Move and FEN utilities
logging/LogSession.js     # Per-game logging for debugging
server.js                   # Entry point for server + socket setup
````

---

## 🔌 API Endpoints

Base URL: `/api/chess`

| Endpoint         | Method | Description                       |
|------------------|--------|-----------------------------------|
| `/newGame`       | POST   | Start a new game                  |
| `/getInfo`       | POST   | Fetch current game state          |
| `/move`          | POST   | Submit a move                     |
| `/choosecolor`   | POST   | Assign player color               |
| `/resign`        | POST   | Resign from a game                |
| `/drawResponse`  | POST   | Respond to a draw offer           |
| `/claimDraw`     | POST   | Claim a draw based on conditions  |

---

## 🔊 WebSocket Events

| Event             | Direction | Purpose                                      |
|-------------------|-----------|----------------------------------------------|
| `registerPlayer`  | Client → Server | Register socket ID to player ID      |
| `joinGame`        | Client → Server | Join a specific game room           |
| `offerDraw`       | Client → Server | Player requests a draw              |
| `gameState`       | Server → Client | Pushes updated game state           |
| `drawOffered`     | Server → Client | Notify players of draw request      |
| `drawResult`      | Server → Client | Notify result of draw decision      |
| `resignation`     | Server → Client | Notify player resignation           |
| `handshakeAck`    | Server → Client | Acknowledge successful connection   |

---

## 🧪 Development & Testing

### Install dependencies:

```bash
npm install
````

### Start development server:

```bash
node server.js
```

### Run tests:

```bash
npm test
```

---

## 🧹 Daily Cleanup

The backend includes a scheduled task using `node-cron` (currently commented out) that runs at midnight daily to delete stale or expired game databases:

```js
cron.schedule('0 0 * * *', async () => {
  await cleanUpDbs();
});
```

Uncomment this block in `server.js` to enable it.

---

## 🤖 AI Support

The backend integrates **Stockfish** via `node-uci` to allow games against a basic AI opponent. This is handled internally in the game service and requires no special setup from the frontend beyond flagging `isAi: true` in the `/newGame` payload.

---

Great — here's a refined and focused **`TODO / Enhancements`** section based on your clarification:

---

### 🚧 TODO / Enhancements

* 🗂 **Persistent Game State Tracking**
  Add game status flags (e.g., *active*, *drawn*, *resigned*, *checkmate*) to the database so game state can be reliably retrieved without relying solely on in-memory logic or logs.

* 🛢 **Database Scalability**
  Migrate from per-game SQLite files to a more scalable and centralized database solution (e.g. PostgreSQL, Supabase, or another relational DB) to better support concurrent multiplayer games and long-term storage.

* 🧪 **Improve Test Coverage**
  Add comprehensive unit and integration tests for key API routes (`/move`, `/newGame`, etc.), socket events, and utility functions.

---

## 📜 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

## ✍️ Author

Dennis Ward II
[GitHub Profile](https://github.com/Maiar0)

---

