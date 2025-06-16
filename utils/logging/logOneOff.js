const fs   = require('fs');
const path = require('path');

/**
 * Append a single log entry to todays log file (YYYY-MM-DD.txt)
 * in the standard logs directory (../../logs relative to this file).
 * 
 * @param {string} id           — Identifier for this log entry (e.g. requestId, userId).
 * @param {string} message      — The log message text.
 * @param {object} context      - context possible
 */
/**
 * Logs a one-off message to a daily log file, creating the logs directory if necessary.
 *
 * The log entry is timestamped and optionally tagged with a game ID from the context.
 * The log file is named after the current date (e.g., "2025-06-05.txt") and stored in the standard logs directory.
 *
 * @param {string} id - An identifier for the log entry (e.g., user ID, event type).
 * @param {string} message - The message to log.
 * @param {Object} [context={}] - Optional context for the log entry.
 * @param {string|number} [context.gameId] - Optional game ID to tag the log entry.
 */
function logOneOff(id, message, context = {}) {
    // Determine the standard logs directory (same as LogSession.writeToFile)
    const logDir = path.join(__dirname, '../../logs');

    // Ensure the directory exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Compute today’s filename automatically (e.g., "2025-06-05.txt")
    const datePart = new Date().toISOString().slice(0, 10);
    const fileName = `${datePart}.txt`;
    const fullPath = path.join(logDir, fileName);

    // Build an optional tag if context.gameId is provided
    const tag = context.gameId ? `[Game ${context.gameId}] ` : '';

    // Construct the timestamped entry
    const timestamp = new Date().toISOString();
    const entry = `${timestamp} ${tag}${id} ${message}\n`;

    // Append synchronously to today’s log file
    fs.appendFileSync(fullPath, entry, 'utf8');
}

module.exports = { logOneOff };
