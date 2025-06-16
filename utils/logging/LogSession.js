const fs = require('fs');
const path = require('path');

/**
 * Represents a logging session for tracking events with contextual information.
 * 
 * @class
 * @param {string} id - The unique identifier for the log session.
 * @param {Object} [context={}] - Optional context object, e.g., game information.
 * 
 * @property {Object} context - The context associated with the session.
 * @property {Array<string>} events - The list of logged event entries.
 * @property {string} id - The unique identifier for the session.
 * 
 * @example
 * const session = new LogSession('session1', { gameId: 42 });
 * session.addEvent('Player joined');
 * session.writeToFile();
 */
class LogSession {
  constructor(id,context = {}) {
    this.context = context; 
    this.events = [];
    this.id = id;
  }

  /**
   * Adds a new event entry to the session log with a timestamp and optional game context.
   *
   * @param {string} message - The event message to log.
   */
  addEvent(message) {
    const timestamp = new Date().toISOString();
    const tag = this.context.gameId ? `[Game ${this.context.gameId}]` : '';
    const entry = `${timestamp} ${this.id} ${message}`;
    this.events.push(entry);
  }

  /**
   * Writes the current session's events to a log file.
   * The log file is created (if it doesn't exist) in the specified directory,
   * with the filename based on the current date (YYYY-MM-DD.txt).
   * Each event is appended as a new line in the log file.
   *
   * @param {string} [logDir=path.join(__dirname, '../../logs')] - The directory where log files are stored.
   */
  writeToFile(logDir = path.join(__dirname, '../../logs')) {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const fileName = `${new Date().toISOString().slice(0, 10)}.txt`; 
    const fullPath = path.join(logDir, fileName);

    const data = this.events.map(e => e + '\n').join('');
    fs.appendFileSync(fullPath, data, 'utf8');
  }
}

module.exports = LogSession;
