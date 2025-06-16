# 📝 utils/logging/

This folder contains logging utilities for the chess backend, supporting both structured **session-based logs** and lightweight **one-off log entries**.

---

## 📄 Files

### `LogSession.js`

Provides a session-based logging class for capturing a sequence of related events (e.g., a single API request or full game).

#### Features:

- Create per-session log streams
- Tag logs with contextual identifiers (e.g., `gameId`)
- Automatically timestamps each entry
- Appends logs to daily files in `logs/YYYY-MM-DD.txt`

#### Example:

```js
const log = new LogSession('MoveHandler', { gameId: 'abc123' });
log.addEvent('Move received');
log.addEvent('Move validated');
log.writeToFile(); // Writes to ./logs/2025-06-16.txt
````

---

### `logOneOff.js`

Utility for single log lines without managing state. Use this for background tasks, checks, or isolated logs.

#### Example:

```js
const { logOneOff } = require('./logOneOff');
logOneOff('HealthCheck', 'Memory usage normal', { gameId: 'abc123' });
```

---

## 📁 Log Output

* All logs are saved in the `logs/` directory at the project root
* Files are rotated **daily**, named by date: `2025-06-16.txt`
* Each entry is prepended with a full ISO timestamp

---

## 🧠 Design Principles

* Keeps logs human-readable and chronological
* Avoids external logging dependencies
* Isolated logging logic makes it easy to adapt or redirect output later (e.g., Sentry, cloud logs)

---

