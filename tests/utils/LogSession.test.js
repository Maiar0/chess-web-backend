// __tests__/utils/logging/LogSession.test.js
const fs = require('fs');
const path = require('path');
const LogSession = require('../../utils/logging/LogSession');

describe('LogSession', () => {
  const tempLogsDir = path.join(__dirname, 'tempLogs');

  afterEach(() => {
    // Remove all files in tempLogsDir, then remove the directory
    if (fs.existsSync(tempLogsDir)) {
      for (const file of fs.readdirSync(tempLogsDir)) {
        const fullPath = path.join(tempLogsDir, file);
        if (fs.lstatSync(fullPath).isFile()) {
          fs.unlinkSync(fullPath);
        }
      }
      fs.rmdirSync(tempLogsDir);
    }
  });

  test('constructor initializes id, context, and empty events array', () => {
    const session = new LogSession('sess1', { gameId: 'g123' });
    expect(session.id).toBe('sess1');
    expect(session.context).toEqual({ gameId: 'g123' });
    expect(Array.isArray(session.events)).toBe(true);
    expect(session.events).toHaveLength(0);
  });

  test('addEvent pushes timestamped entry without tag when no gameId', () => {
    const session = new LogSession('sess2');
    session.addEvent('Started game');
    expect(session.events).toHaveLength(1);

    const entry = session.events[0];
    // Should match: ISO timestamp + space + id + space + message
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z sess2 Started game$/;
    expect(entry).toMatch(regex);
  });

  test('writeToFile creates file and appends all events with newline', () => {
    const session = new LogSession('sess4', { gameId: 'g789' });
    session.addEvent('First event');
    session.addEvent('Second event');

    // Write to the temporary directory
    session.writeToFile(tempLogsDir);

    // Verify directory exists
    expect(fs.existsSync(tempLogsDir)).toBe(true);

    // Compute expected filename
    const fileName = `${new Date().toISOString().slice(0, 10)}.txt`;
    const fullPath = path.join(tempLogsDir, fileName);
    expect(fs.existsSync(fullPath)).toBe(true);

    // Read file contents
    const contents = fs.readFileSync(fullPath, 'utf8').trim().split('\n');
    expect(contents.length).toBe(2);

    // Check each line matches the corresponding session.events entry
    for (let i = 0; i < contents.length; i++) {
      // Each line should equal the event plus no additional characters
      expect(contents[i]).toBe(session.events[i]);
    }
  });

  test('writeToFile appends to existing file rather than overwriting', () => {
    const session1 = new LogSession('sess5');
    session1.addEvent('Event one');
    session1.writeToFile(tempLogsDir);

    // Create a second session and write another event to the same file
    const session2 = new LogSession('sess6');
    session2.addEvent('Event two');
    session2.writeToFile(tempLogsDir);

    const fileName = `${new Date().toISOString().slice(0, 10)}.txt`;
    const fullPath = path.join(tempLogsDir, fileName);
    expect(fs.existsSync(fullPath)).toBe(true);

    const lines = fs.readFileSync(fullPath, 'utf8').trim().split('\n');
    // Should have two lines: first from session1, second from session2
    expect(lines.length).toBe(2);
    expect(lines[0]).toBe(session1.events[0]);
    expect(lines[1]).toBe(session2.events[0]);
  });
});
