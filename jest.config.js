module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/unit/**/*.test.js',
        '**/__tests__/integration/**/*.test.js',
        '**/__tests__/e2e/**/*.test.js'
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/coverage/',
        '/__tests__/'
    ],
    setupFilesAfterEnv: ['./__tests__/setup.js'],
    verbose: true,
    testTimeout: 30000,
    moduleDirectories: ['node_modules', 'backend/src'],
    forceExit: true,
    detectOpenHandles: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
