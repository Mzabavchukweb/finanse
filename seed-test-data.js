const { Category, Product } = require('./backend/src/models');

async function seedTestData() {
    try {
        console.log('🌱 Dodawanie testowych danych...');

        // Sprawdź czy kategorie już istnieją
        const existingCategories = await Category.count();
        if (existingCategories === 0) {
            console.log('📁 Tworzenie kategorii...');

            const categories = await Category.bulkCreate([
                { name: 'Hamulce', description: 'Systemy hamulcowe', isActive: true },
                { name: 'Filtry', description: 'Filtry powietrza, oleju i paliwa', isActive: true },
                { name: 'Oleje', description: 'Oleje silnikowe i przekładniowe', isActive: true },
                { name: 'Zawieszenie', description: 'Amortyzatory i sprężyny', isActive: true },
                { name: 'Silnik', description: 'Części silnika', isActive: true }
            ]);

            console.log(`✅ Utworzono ${categories.length} kategorii`);
        } else {
            console.log('📁 Kategorie już istnieją');
        }

        // Sprawdź czy produkty już istnieją
        const existingProducts = await Product.count();
        if (existingProducts === 0) {
            console.log('📦 Tworzenie produktów...');

            const categories = await Category.findAll();
            const hamulceCategory = categories.find(cat => cat.name === 'Hamulce');
            const filtryCategory = categories.find(cat => cat.name === 'Filtry');
            const olejeCategory = categories.find(cat => cat.name === 'Oleje');

            const products = await Product.bulkCreate([
                {
                    name: 'Klocki hamulcowe TRW GDB1330',
                    description: 'Wysokiej jakości klocki hamulcowe do samochodów osobowych',
                    price: 89.99,
                    stock: 25,
                    sku: 'TRW-GDB1330',
                    brand: 'TRW',
                    categoryId: hamulceCategory ? hamulceCategory.id : 1,
                    isActive: true,
                    isFeatured: true
                },
                {
                    name: 'Filtr powietrza MANN C25114',
                    description: 'Oryginalny filtr powietrza MANN do silników benzynowych',
                    price: 34.50,
                    stock: 50,
                    sku: 'MANN-C25114',
                    brand: 'MANN',
                    categoryId: filtryCategory ? filtryCategory.id : 2,
                    isActive: true,
                    isFeatured: false
                },
                {
                    name: 'Olej Castrol GTX 5W-30 4L',
                    description: 'Syntetyczny olej silnikowy 5W-30 pojemność 4L',
                    price: 125.00,
                    salePrice: 99.99,
                    stock: 30,
                    sku: 'CASTROL-GTX-5W30-4L',
                    brand: 'Castrol',
                    categoryId: olejeCategory ? olejeCategory.id : 3,
                    isActive: true,
                    isFeatured: true
                },
                {
                    name: 'Tarcze hamulcowe Brembo 09.7011.24',
                    description: 'Przednie tarcze hamulcowe Brembo dla samochodów sportowych',
                    price: 189.99,
                    stock: 15,
                    sku: 'BREMBO-097011.24',
                    brand: 'Brembo',
                    categoryId: hamulceCategory ? hamulceCategory.id : 1,
                    isActive: true,
                    isFeatured: false
                },
                {
                    name: 'Filtr oleju BOSCH 0451103336',
                    description: 'Wysokowydajny filtr oleju BOSCH',
                    price: 28.90,
                    stock: 40,
                    sku: 'BOSCH-0451103336',
                    brand: 'BOSCH',
                    categoryId: filtryCategory ? filtryCategory.id : 2,
                    isActive: true,
                    isFeatured: false
                }
            ]);

            console.log(`✅ Utworzono ${products.length} produktów`);
        } else {
            console.log('📦 Produkty już istnieją');
        }

        console.log('🎉 Testowe dane zostały dodane pomyślnie!');

    } catch (error) {
        console.error('❌ Błąd podczas dodawania testowych danych:', error);
    }
}

// Jeśli plik jest uruchamiany bezpośrednio
if (require.main === module) {
    seedTestData().then(() => {
        console.log('Zakończono dodawanie danych');
        process.exit(0);
    }).catch(error => {
        console.error('Błąd:', error);
        process.exit(1);
    });
}

module.exports = seedTestData;
