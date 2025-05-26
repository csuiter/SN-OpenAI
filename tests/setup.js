// Jest setup file for global test configuration and cleanup
// filepath: /Users/coreysuiter/VSCode Projects/.github/SN-OpenAI/tests/setup.js

// Set test timeout
jest.setTimeout(10000);

// Global test cleanup
afterAll(async () => {
    // Close any open handles
    if (global.gc) {
        global.gc();
    }
    
    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
});

// Mock console.error to reduce noise during tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});
