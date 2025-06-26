const db = require('./backend/src/models');

async function syncDatabase() {
    try {
        console.log('🔄 Synchronizuję bazę danych...');

        // Force sync to recreate tables with new structure
        await db.sequelize.sync({ alter: true });

        console.log('✅ Baza danych zsynchronizowana pomyślnie!');

        // Test if images field exists
        const { Product } = require('./backend/src/models');
        const testProduct = await Product.findOne();

        if (testProduct) {
            console.log('🧪 Test pola images:');
            console.log(`   Produkt: ${testProduct.name}`);
            console.log(`   Images field exists: ${testProduct.images !== undefined}`);
            console.log(`   Images value: ${JSON.stringify(testProduct.images)}`);
        }

    } catch (error) {
        console.error('❌ Błąd synchronizacji:', error);
    } finally {
        process.exit(0);
    }
}

syncDatabase();
