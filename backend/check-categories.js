require('dotenv').config();
const { Category } = require('./src/models');

async function checkCategories() {
    try {
        const categories = await Category.findAll({
            attributes: ['id', 'name', 'description', 'isActive']
        });

        console.log('📋 Wszystkie kategorie w bazie:');
        if (categories.length === 0) {
            console.log('  ❌ Brak kategorii w bazie danych!');
        } else {
            categories.forEach(category => {
                console.log(`  ${category.id}: ${category.name} (${category.isActive ? 'aktywna' : 'nieaktywna'})`);
            });
        }

        console.log(`\n📊 Łącznie: ${categories.length} kategorii`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkCategories();
