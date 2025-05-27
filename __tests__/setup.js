const db = require('../backend/src/models');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Sequelize config:', db.sequelize.options);

// Ensure we're using test environment
process.env.NODE_ENV = 'test';

// Helper function to wait for database operations
const waitForDb = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

beforeAll(async () => {
  try {
    // Force sync the database before all tests
  await db.sequelize.sync({ force: true });
    
    // Wait for sync to complete
    await waitForDb();
  } catch (error) {
    console.error('Error during database sync:', error);
    throw error;
  }
});

beforeEach(async () => {
  try {
    // Clean up before each test
    const models = Object.values(db).filter(model => model.destroy);
    await Promise.all(models.map(model => model.destroy({ where: {}, force: true })));
    await waitForDb();
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close database connection after all tests
  await db.sequelize.close();
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
});

// Global timeout for tests
jest.setTimeout(30000);

// Run tests serially to avoid database conflicts
jest.setTimeout(30000); 