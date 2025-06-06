const fs   = require('fs');
const path = require('path');

/**
 * Append a single log entry to today’s “normal” log file (YYYY-MM-DD.txt)
 * in the standard logs directory (../../logs relative to this file).
 * 
 * @param {string} id           — Identifier for this log entry (e.g. requestId, userId).
 * @param {string} message      — The log message text.
 * @param {object} context      — Optional context object. If context.gameId is provided,
 *                                it will prepend “[Game <gameId>] ” to the entry.
 */
function logOneOff(id, message, context = {}) {
    // 1. Determine the standard logs directory (same as LogSession.writeToFile)
    const logDir = path.join(__dirname, '../../logs');

    // 2. Ensure the directory exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // 3. Compute today’s filename automatically (e.g., "2025-06-05.txt")
    const datePart = new Date().toISOString().slice(0, 10);
    const fileName = `${datePart}.txt`;
    const fullPath = path.join(logDir, fileName);

    // 4. Build an optional tag if context.gameId is provided
    const tag = context.gameId ? `[Game ${context.gameId}] ` : '';

    // 5. Construct the timestamped entry
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} ${tag}${id} ${message}\n`;

    // 6. Append synchronously to today’s log file
    fs.appendFileSync(fullPath, entry, 'utf8');
}

module.exports = { logOneOff };
