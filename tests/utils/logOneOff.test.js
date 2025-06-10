// __tests__/utils/logging/logOneOff.test.js
const fs = require('fs');
const path = require('path');
const { logOneOff } = require('../../utils/logging/logOneOff');

describe('logOneOff', () => {
    const logsDir = path.join(__dirname, '../../logs');
    const todayFileName = `${new Date().toISOString().slice(0, 10)}.txt`;
    const fullPath = path.join(logsDir, todayFileName);

    afterEach(() => {
        // Clean up logs directory after each test
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
        try {
            fs.rmdirSync(logsDir);
        } catch {
            // ignore if directory not empty or doesn't exist
        }
    });

    test('appends entry without context.gameId', () => {
        const id = 'request123';
        const message = 'User logged in';

        logOneOff(id, message);

        expect(fs.existsSync(fullPath)).toBe(true);
        const contents = fs.readFileSync(fullPath, 'utf8').trim().split('\n');

        const entry = contents[0];
        // Match ISO timestamp at start
        expect(entry).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z request123 User logged in$/);
    });

    
});
