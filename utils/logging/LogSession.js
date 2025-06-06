const fs = require('fs');
const path = require('path');

class LogSession {
  constructor(id,context = {}) {
    this.context = context; 
    this.events = [];
    this.id = id;
  }

  addEvent(message) {
    const timestamp = new Date().toISOString();
    const tag = this.context.gameId ? `[Game ${this.context.gameId}]` : '';
    const entry = `${timestamp} ${this.id} ${message}`;
    this.events.push(entry);
  }

  writeToFile(logDir = path.join(__dirname, '../../logs')) {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const fileName = `${new Date().toISOString().slice(0, 10)}.txt`; 
    const fullPath = path.join(logDir, fileName);

    const data = this.events.map(e => e + '\n').join('');
    fs.appendFileSync(fullPath, data, 'utf8');
  }
}

module.exports = LogSession;
