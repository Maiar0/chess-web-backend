const path = require("path");
const Database = require("better-sqlite3");

class AnalyticsDbManager {
  constructor() {
    const dbPath = path.join(__dirname, "analytics.db");
    this.db = new Database(dbPath);

    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS player_events (
        player_id TEXT PRIMARY KEY,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  }

  trackPlayer(playerId) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO player_events (player_id) VALUES (?)
    `);
    const result = stmt.run(playerId);
    return result.changes > 0; // true if a new player was added
  }

  getTotalPlayers() {
    const row = this.db.prepare(`
      SELECT COUNT(*) AS total FROM player_events
    `).get();
    return row.total;
  }

  getAllPlayerEvents() {
    return this.db.prepare(`
      SELECT * FROM player_events ORDER BY first_seen DESC
    `).all();
  }
}

module.exports = new AnalyticsDbManager();
