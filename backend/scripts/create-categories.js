const Category = require('../models/Category');

const categories = [
    { name: 'Zestawy Rozrządu', description: 'Zestawy rozrządu i pompy' },
    { name: 'Wycieraczki', description: 'Wycieraczki samochodowe' },
    { name: 'Filtry Oleju', description: 'Filtry oleju do samochodów' },
    { name: 'Filtry Paliwa', description: 'Filtry paliwa do samochodów' },
    { name: 'Inne', description: 'Pozostałe produkty' }
];

(async () => {
    for (const cat of categories) {
        const [category, created] = await Category.findOrCreate({
            where: { name: cat.name },
            defaults: cat
        });
        if (created) {
            console.log('Dodano kategorię:', cat.name);
        } else {
            console.log('Kategoria już istnieje:', cat.name);
        }
    }
    process.exit(0);
})();
