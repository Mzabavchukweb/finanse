const { sequelize } = require('./src/models');
const { User } = require('./src/models');

async function deleteAllExceptMainAdmin() {
    const MAIN_ADMIN_EMAIL = 'admin@cartechstore.pl';
    try {
    // Start a transaction
        const transaction = await sequelize.transaction();

        try {
            // Usuń wszystkich użytkowników, których email jest różny od głównego admina
            const deletedCount = await User.destroy({
                where: {
                    email: { [require('sequelize').Op.ne]: MAIN_ADMIN_EMAIL }
                },
                transaction
            });
            console.log(`Deleted ${deletedCount} users except main admin (${MAIN_ADMIN_EMAIL})`);

            // Commit the transaction
            await transaction.commit();
            console.log('Successfully deleted all users except main admin');
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
deleteAllExceptMainAdmin();
