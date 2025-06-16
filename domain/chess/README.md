# ♟️ domain/chess
```markdown
This folder contains the **core domain logic** for the chess game, including chessboard state management and individual piece behavior.
```
---

## 🧱 Structure
```markdown
chess/
├── board/
│   └── ChessBoard.js         # Manages game state, move resolution, and FEN logic
├── pieces/
│   ├── ChessPiece.js         # Abstract base class for all pieces
│   ├── ChessPieceFactory.js  # Instantiates pieces from FEN characters
│   ├── Pawn.js               # Pawn-specific movement (inc. en passant & promotion)
│   ├── Rook.js
│   ├── Knight.js
│   ├── Bishop.js
│   ├── Queen.js
│   └── King.js               # Includes castling and check awareness

````

---

## 🧩 `ChessBoard.js`

The `ChessBoard` class is responsible for:

- Parsing and generating **FEN strings**
- Maintaining an 8x8 matrix of pieces
- Executing moves and resolving special cases:
  - En Passant
  - Promotion
  - Castling
- Maintaining:
  - Captured pieces
  - Threat maps
  - Turn counters (halfmove/fullmove)

It exposes methods like:

```js
board.move(from, to, promotionChar);
board.createFen();
board.generateThreatMap('black');
board.isThreatened(x, y);
````

---

## 🧠 ChessPiece Hierarchy

All chess pieces inherit from `ChessPiece`, which defines a common interface:

| Method            | Purpose                              |
| ----------------- | ------------------------------------ |
| `getMoves(board)` | Returns valid move set               |
| `getFen()`        | Returns FEN notation character       |
| `getPosition()`   | Returns `{x, y}` position            |
| `getPieceType()`  | Returns string identifier (optional) |

Each subclass (Pawn, Rook, etc.) implements its own `getMoves()` logic based on movement rules and captures.

---

## 🏭 `ChessPieceFactory.js`

Factory for dynamically creating pieces from FEN strings or promotion characters.

```js
const piece = ChessPieceFactory.createPiece('n'); // returns a black knight
```

---

## 🧠 Design Principles

* **Encapsulation**: Each piece class contains only its own movement logic.
* **FEN-Oriented**: The board state is always backed by a FEN string, ensuring frontend-backend sync.
* **Threat Tracking**: The board maintains a `threatMap` to evaluate check status efficiently.

---

## 📌 Notes

* All coordinates are 0-indexed: `x` is file (a–h → 0–7), `y` is rank (1–8 → 0–7)
* En passant is stored as `{ x, y }` or `'-'`
* Pieces must be explicitly assigned a `position` after instantiation

---

