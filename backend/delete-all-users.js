const { sequelize } = require('./src/models');
const { User } = require('./src/models');

async function deleteAllUsers() {
  try {
    // Start a transaction
    const transaction = await sequelize.transaction();

    try {
      // Delete all users
      const deletedCount = await User.destroy({ where: {}, transaction });
      console.log(`Deleted ${deletedCount} users`);

      // Commit the transaction
      await transaction.commit();
      console.log('Successfully deleted all users');
    } catch (error) {
      // If there's an error, rollback the transaction
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting users:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the function
deleteAllUsers(); 