const db = require('./backend/src/models');

async function addImagesColumn() {
    try {
        console.log('🔧 Dodaję kolumnę images do tabeli Products...');

        const queryInterface = db.sequelize.getQueryInterface();

        // Sprawdź czy kolumna już istnieje
        try {
            const tableInfo = await queryInterface.describeTable('Products');
            console.log('📋 Obecne kolumny w tabeli Products:');
            Object.keys(tableInfo).forEach(column => {
                console.log(`   - ${column}: ${tableInfo[column].type}`);
            });

            if (tableInfo.images) {
                console.log('✅ Kolumna images już istnieje!');
                return;
            }

            // Dodaj kolumnę images
            await queryInterface.addColumn('Products', 'images', {
                type: db.Sequelize.JSON,
                allowNull: true,
                defaultValue: '[]'
            });

            console.log('✅ Kolumna images została dodana!');

        } catch (error) {
            console.error('❌ Błąd sprawdzania tabeli:', error.message);
        }

        // Test aktualizacji produktu
        const { Product } = require('./backend/src/models');
        const testProduct = await Product.findOne();

        if (testProduct) {
            console.log('\n🧪 Test zapisywania obrazów...');

            const testImages = [
                'https://via.placeholder.com/300x300/059669/ffffff?text=Test+1',
                'https://via.placeholder.com/300x300/dc2626/ffffff?text=Test+2'
            ];

            await testProduct.update({
                images: testImages,
                imageUrl: testImages[0]
            });

            // Pobierz ponownie i sprawdź
            const updatedProduct = await Product.findByPk(testProduct.id);
            console.log(`   Produkt: ${updatedProduct.name}`);
            console.log(`   Images zapisane: ${JSON.stringify(updatedProduct.images)}`);
            console.log(`   Main image: ${updatedProduct.imageUrl}`);
        }

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

addImagesColumn();
