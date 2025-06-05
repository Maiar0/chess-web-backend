class LogSession {
  constructor(fileId, context = {}) {
    this.timestamp = new Date().toISOString();
    this.context = context;       // { gameId, playerId, ip, etc. }
    this.events = [];             // chronological event stack
    this.errors = [];             // caught errors, if any
    this.result = null;           // outcome of the request
  }

  addEvent(message, data = {}) {
    this.events.push({
      at: new Date().toISOString(),
      message,
      ...data
    });
  }

  addError(err) {
    this.errors.push({
      at: new Date().toISOString(),
      message: err.message,
      stack: err.stack
    });
  }

  setResult(result) {
    this.result = result;
  }

  writeToFile(logDir = './logs') {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const fileName = `log_${this.fileId}_${Date.now()}.json`;
    const fullPath = path.join(logDir, fileName);

    fs.writeFileSync(fullPath, JSON.stringify(this, null, 2));
  }
}
