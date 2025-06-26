const { Product } = require('./backend/src/models');

async function testModelAttributes() {
    try {
        console.log('🔍 Sprawdzam atrybuty modelu Product...');

        // Sprawdź raw attributes
        console.log('\n📋 Raw attributes modelu:');
        const attributes = Product.rawAttributes;
        Object.keys(attributes).forEach(attr => {
            console.log(`   ${attr}: ${attributes[attr].type?.constructor?.name || 'unknown'}`);
        });

        // Sprawdź describe
        console.log('\n📋 Table info z Sequelize:');
        const tableInfo = await Product.sequelize.getQueryInterface().describeTable('Products');
        Object.keys(tableInfo).forEach(column => {
            console.log(`   ${column}: ${tableInfo[column].type}`);
        });

        // Test bezpośredniego odczytu
        console.log('\n🧪 Test bezpośredniego odczytu...');
        const product = await Product.findByPk(2, { raw: true });
        console.log('Product (raw):', product);

        // Test z include
        console.log('\n🧪 Test z modelem...');
        const productModel = await Product.findByPk(2);
        console.log('Product dataValues:', productModel?.dataValues);

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

testModelAttributes();
