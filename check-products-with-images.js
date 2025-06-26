const { Product, Category } = require('./backend/src/models');

async function checkProductsWithImages() {
    try {
        console.log('📦 Sprawdzam produkty z obrazami...');

        const products = await Product.findAll({
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }]
        });

        console.log(`\n📊 Znaleziono ${products.length} produktów w bazie:`);

        products.forEach(product => {
            const hasImages = product.images && product.images.length > 0;
            const imageCount = hasImages ? product.images.length : 0;

            console.log(`\n📦 ${product.name}`);
            console.log(`   ID: ${product.id}`);
            console.log(`   SKU: ${product.sku}`);
            console.log(`   Kategoria: ${product.category?.name || 'Brak'}`);
            console.log(`   Cena: ${product.price} PLN`);
            console.log(`   Stock: ${product.stock}`);
            console.log(`   Aktywny: ${product.isActive ? 'Tak' : 'Nie'}`);
            console.log(`   Featured: ${product.isFeatured ? 'Tak' : 'Nie'}`);
            console.log(`   Obrazy: ${imageCount} ${hasImages ? '✅' : '❌'}`);

            if (hasImages) {
                product.images.forEach((img, index) => {
                    console.log(`     ${index + 1}. ${img}`);
                });
            }
        });

        const productsWithImages = products.filter(p => p.images && p.images.length > 0);
        const activeProducts = products.filter(p => p.isActive);
        const featuredProducts = products.filter(p => p.isFeatured);

        console.log('\n📊 Statystyki:');
        console.log(`   Wszystkie produkty: ${products.length}`);
        console.log(`   Produkty z obrazami: ${productsWithImages.length}`);
        console.log(`   Aktywne produkty: ${activeProducts.length}`);
        console.log(`   Featured produkty: ${featuredProducts.length}`);

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

checkProductsWithImages();
