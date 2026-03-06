module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'api/**/*.js',
        'services/**/*.js',
        'sql/**/*.js',
        '!**/node_modules/**'
    ]
};
