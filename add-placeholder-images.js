const { Product, Category } = require('./backend/src/models');

async function addPlaceholderImages() {
    try {
        console.log('🖼️ Dodaję placeholder obrazy do produktów...');

        const products = await Product.findAll();

        // Placeholder obrazy dla różnych kategorii produktów
        const placeholderImages = {
            'Filtry': [
                '/uploads/products/placeholder-filter.jpg',
                'https://via.placeholder.com/300x300/2563eb/ffffff?text=Filtr+Powietrza',
                'https://via.placeholder.com/300x300/059669/ffffff?text=Filtr+Oleju'
            ],
            'Oleje': [
                '/uploads/products/placeholder-oil.jpg',
                'https://via.placeholder.com/300x300/dc2626/ffffff?text=Olej+Silnikowy',
                'https://via.placeholder.com/300x300/ea580c/ffffff?text=Olej+Przekładniowy'
            ],
            'Hamulce': [
                '/uploads/products/placeholder-brake.jpg',
                'https://via.placeholder.com/300x300/7c3aed/ffffff?text=Klocki+Hamulcowe',
                'https://via.placeholder.com/300x300/be185d/ffffff?text=Tarcze+Hamulcowe'
            ]
        };

        let updatedCount = 0;

        for (const product of products) {
            const category = await Category.findByPk(product.categoryId);
            const categoryName = category?.name || 'Default';

            // Wybierz odpowiednie obrazy na podstawie kategorii
            let images = placeholderImages[categoryName] || [
                'https://via.placeholder.com/300x300/6b7280/ffffff?text=Produkt',
                'https://via.placeholder.com/300x300/4b5563/ffffff?text=Części+Auto'
            ];

            // Dodaj specyficzne obrazy na podstawie nazwy produktu
            if (product.name.toLowerCase().includes('filtr')) {
                images = placeholderImages['Filtry'];
            } else if (product.name.toLowerCase().includes('olej')) {
                images = placeholderImages['Oleje'];
            } else if (product.name.toLowerCase().includes('hamulc')) {
                images = placeholderImages['Hamulce'];
            }

            await product.update({
                images: images,
                imageUrl: images[0]  // Pierwszy obraz jako główny
            });

            updatedCount++;
            console.log(`✅ Zaktualizowano ${product.name} - dodano ${images.length} obrazów`);
        }

        console.log(`\n🎉 Zaktualizowano ${updatedCount} produktów z obrazami!`);

        // Sprawdź wyniki
        const updatedProducts = await Product.findAll({
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
            }]
        });

        console.log('\n📦 Produkty po aktualizacji:');
        updatedProducts.forEach(product => {
            console.log(`  ${product.name}: ${product.images?.length || 0} obrazów`);
        });

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

addPlaceholderImages();
