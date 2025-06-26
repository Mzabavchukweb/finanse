require('dotenv').config();
const { Category } = require('./src/models');

async function seedCategories() {
    try {
        console.log('🌱 Dodawanie podstawowych kategorii części samochodowych...');

        const categories = [
            {
                name: 'Hamulce',
                description: 'Klocki hamulcowe, tarcze, płyny hamulcowe',
                isActive: true
            },
            {
                name: 'Filtry',
                description: 'Filtry oleju, powietrza, paliwa, kabinowe',
                isActive: true
            },
            {
                name: 'Oleje i płyny',
                description: 'Oleje silnikowe, przekładniowe, płyny eksploatacyjne',
                isActive: true
            },
            {
                name: 'Zawieszenie',
                description: 'Amortyzatory, sprężyny, łożyska',
                isActive: true
            },
            {
                name: 'Silnik',
                description: 'Części silnika, uszczelki, pompy',
                isActive: true
            },
            {
                name: 'Układ wydechowy',
                description: 'Tłumiki, katalizatory, rury wydechowe',
                isActive: true
            },
            {
                name: 'Elektryka',
                description: 'Żarówki, akumulatory, alternatony, rozruszniki',
                isActive: true
            },
            {
                name: 'Klimatyzacja',
                description: 'Filtry kabinowe, sprężarki, skraplacze',
                isActive: true
            },
            {
                name: 'Przekładnia',
                description: 'Sprzęgła, koła zębate, oleje przekładniowe',
                isActive: true
            },
            {
                name: 'Karoseria',
                description: 'Lusterka, szyby, uszczelki drzwi',
                isActive: true
            }
        ];

        for (const categoryData of categories) {
            const [category, created] = await Category.findOrCreate({
                where: { name: categoryData.name },
                defaults: categoryData
            });

            if (created) {
                console.log(`✅ Dodano kategorię: ${category.name}`);
            } else {
                console.log(`ℹ️  Kategoria już istnieje: ${category.name}`);
            }
        }

        const totalCategories = await Category.count();
        console.log(`\n📊 Łącznie kategorii w bazie: ${totalCategories}`);

    } catch (error) {
        console.error('❌ Błąd podczas dodawania kategorii:', error);
    } finally {
        process.exit(0);
    }
}

seedCategories();
