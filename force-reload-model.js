const db = require('./backend/src/models');

async function forceReloadModel() {
    try {
        console.log('🔄 Wymuszam przeładowanie modelu Product...');

        // Close existing connection
        await db.sequelize.close();

        console.log('✅ Zamknięte połączenie z bazą');

        // Re-require the models (this should reload them)
        delete require.cache[require.resolve('./backend/src/models')];
        delete require.cache[require.resolve('./backend/src/models/product.js')];

        console.log('✅ Wyczyszczony cache modeli');

        // Re-require models
        const newDb = require('./backend/src/models');
        const { Product } = newDb;

        console.log('✅ Przeładowane modele');

        // Check attributes
        console.log('\n📋 Atrybuty po przeładowaniu:');
        const attributes = Product.rawAttributes;
        Object.keys(attributes).forEach(attr => {
            console.log(`   ${attr}: ${attributes[attr].type?.constructor?.name || 'unknown'}`);
        });

        // Test with reloaded model
        console.log('\n🧪 Test z przeładowanym modelem...');
        const product = await Product.findByPk(2);

        if (product) {
            console.log(`   Produkt: ${product.name}`);
            console.log('   DataValues:', product.dataValues);
            console.log('   Images field:', product.images);
        }

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

forceReloadModel();
