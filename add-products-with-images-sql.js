const db = require('./backend/src/models');

async function addProductsWithImages() {
    try {
        console.log('🛒 Dodaję produkty z obrazami bezpośrednio do bazy...');

        // Clear existing products first
        await db.sequelize.query('DELETE FROM Products WHERE id > 1000');
        console.log('✅ Wyczyszczono istniejące produkty testowe');

        const testProducts = [
            {
                id: 1001,
                name: 'Klocki hamulcowe BREMBO P50047',
                description: 'Oryginalne klocki hamulcowe BREMBO dla samochodów osobowych. ' +
                    'Doskonała jakość i niezawodność.',
                price: 125.99,
                stock: 25,
                sku: 'BREMBO-P50047',
                brand: 'BREMBO',
                categoryId: 1,
                isActive: 1,
                isFeatured: 1,
                imageUrl: 'https://via.placeholder.com/400x400/dc2626/ffffff?text=BREMBO+Klocki',
                images: JSON.stringify([
                    'https://via.placeholder.com/400x400/dc2626/ffffff?text=BREMBO+Klocki',
                    'https://via.placeholder.com/400x400/991b1b/ffffff?text=BREMBO+Detail',
                    'https://via.placeholder.com/400x400/7f1d1d/ffffff?text=BREMBO+Box'
                ])
            },
            {
                id: 1002,
                name: 'Filtr oleju MANN W712/93',
                description: 'Wysokiej jakości filtr oleju MANN do silników benzynowych i diesla.',
                price: 28.50,
                stock: 50,
                sku: 'MANN-W712-93',
                brand: 'MANN',
                categoryId: 2,
                isActive: 1,
                isFeatured: 1,
                imageUrl: 'https://via.placeholder.com/400x400/2563eb/ffffff?text=MANN+Filtr',
                images: JSON.stringify([
                    'https://via.placeholder.com/400x400/2563eb/ffffff?text=MANN+Filtr',
                    'https://via.placeholder.com/400x400/1d4ed8/ffffff?text=MANN+Quality',
                    'https://via.placeholder.com/400x400/1e40af/ffffff?text=MANN+Original'
                ])
            },
            {
                id: 1003,
                name: 'Olej silnikowy Castrol GTX 5W-30 5L',
                description: 'Nowoczesny olej silnikowy o wysokiej jakości dla samochodów osobowych.',
                price: 89.99,
                stock: 30,
                sku: 'CASTROL-GTX-5W30-5L',
                brand: 'Castrol',
                categoryId: 3,
                isActive: 1,
                isFeatured: 1,
                imageUrl: 'https://via.placeholder.com/400x400/059669/ffffff?text=Castrol+5W30',
                images: JSON.stringify([
                    'https://via.placeholder.com/400x400/059669/ffffff?text=Castrol+5W30',
                    'https://via.placeholder.com/400x400/047857/ffffff?text=Castrol+GTX',
                    'https://via.placeholder.com/400x400/065f46/ffffff?text=Castrol+5L'
                ])
            },
            {
                id: 1004,
                name: 'Amortyzator SACHS 314875',
                description: 'Amortyzator przedni SACHS - najwyższa jakość i komfort jazdy.',
                price: 189.00,
                stock: 15,
                sku: 'SACHS-314875',
                brand: 'SACHS',
                categoryId: 4,
                isActive: 1,
                isFeatured: 0,
                imageUrl: 'https://via.placeholder.com/400x400/7c3aed/ffffff?text=SACHS+Amortyzator',
                images: JSON.stringify([
                    'https://via.placeholder.com/400x400/7c3aed/ffffff?text=SACHS+Amortyzator',
                    'https://via.placeholder.com/400x400/6d28d9/ffffff?text=SACHS+Front',
                    'https://via.placeholder.com/400x400/5b21b6/ffffff?text=SACHS+Quality'
                ])
            }
        ];

        // Insert products using raw SQL
        for (const product of testProducts) {
            await db.sequelize.query(`
                INSERT INTO Products (
                    id, name, description, price, stock, sku, brand, categoryId,
                    isActive, isFeatured, imageUrl, images, createdAt, updatedAt
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
                )
            `, {
                replacements: [
                    product.id, product.name, product.description, product.price,
                    product.stock, product.sku, product.brand, product.categoryId,
                    product.isActive, product.isFeatured, product.imageUrl, product.images
                ]
            });

            console.log(`✅ Dodano: ${product.name}`);
        }

        // Sprawdź wyniki
        console.log('\n📦 Sprawdzam dodane produkty...');
        const [results] = await db.sequelize.query(`
            SELECT id, name, price, sku, imageUrl, images, isFeatured
            FROM Products
            WHERE id > 1000
        `);

        results.forEach(product => {
            const imageCount = product.images ? JSON.parse(product.images).length : 0;
            const featuredText = product.isFeatured ? 'Tak' : 'Nie';
            console.log(`  ${product.name}: ${imageCount} obrazów, Featured: ${featuredText}`);
        });

        console.log('\n🎉 Produkty z obrazami zostały dodane pomyślnie!');
        console.log('Produkty będą widoczne na stronie głównej w sekcji "Polecane produkty"');

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        process.exit(0);
    }
}

addProductsWithImages();
