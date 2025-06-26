const db = require('./backend/src/models');

async function testImagesDirect() {
    try {
        console.log('🔍 Test bezpośredniego zapisywania obrazów...');

        // Test surowego SQL
        const [results] = await db.sequelize.query('PRAGMA table_info(Products);');
        console.log('\n📋 Struktura tabeli Products:');
        results.forEach(col => {
            console.log(`   ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
        });

        // Test bezpośredniego zapisu
        const testImages = JSON.stringify([
            'https://via.placeholder.com/300x300/059669/ffffff?text=Test+1',
            'https://via.placeholder.com/300x300/dc2626/ffffff?text=Test+2'
        ]);

        console.log('\n🧪 Test surowego SQL...');
        await db.sequelize.query(
            'UPDATE Products SET images = ? WHERE id = ?',
            { replacements: [testImages, 2] }
        );

        // Sprawdź wynik
        const [productResults] = await db.sequelize.query(
            'SELECT id, name, imageUrl, images FROM Products WHERE id = 2'
        );

        console.log('\n📦 Rezultat surowego SQL:');
        console.log(productResults[0]);

        // Test przez Model
        console.log('\n🧪 Test przez Sequelize Model...');
        const { Product } = require('./backend/src/models');
        const product = await Product.findByPk(2);

        if (product) {
            console.log(`   Produkt: ${product.name}`);
            console.log(`   Images (getter): ${JSON.stringify(product.images)}`);
            console.log(`   Images (raw): ${product.getDataValue('images')}`);

            // Spróbuj zapisać przez model
            const newImages = [
                'https://via.placeholder.com/300x300/red/ffffff?text=Model+Test+1',
                'https://via.placeholder.com/300x300/blue/ffffff?text=Model+Test+2'
            ];

            await product.update({ images: newImages });

            // Sprawdź ponownie
            const updatedProduct = await Product.findByPk(2);
            console.log(`   Po aktualizacji - Images: ${JSON.stringify(updatedProduct.images)}`);
            console.log(`   Po aktualizacji - Raw: ${updatedProduct.getDataValue('images')}`);
        }

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

testImagesDirect();
