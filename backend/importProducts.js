const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Product = require('./models/Product');
const { Op } = require('sequelize');
const Category = require('./models/Category');

// === AUTO-DETECT LATEST CSV FILES ===
function getLatestFile(prefix) {
    const dir = path.join(__dirname, '../csv_extracted');
    const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.csv'));
    if (!files.length) throw new Error('Brak plików CSV dla: ' + prefix);
    files.sort((a, b) => b.localeCompare(a)); // Najnowszy na górze (alfabetycznie po dacie)
    return path.join(dir, files[0]);
}

const CSV_PATH = getLatestFile('ProductInformation_');
const STOCK_PATH = getLatestFile('Stock_');
const PRICE_PATH = getLatestFile('Wholesale_Pricing_');

// === CONFIG ===
// List of product codes to check (from user)
const PRODUCT_CODES = [
    // Rozrządy + pompa
    'CT 1229 WP2 PRO', 'CT 1168 WP3', 'CT 1216 WP2', 'CT 1168 WP8 PRO', 'CT 1168 WP1',
    'CT 1139 WP8 PRO', 'CT 1148 WP1', 'CT 1134 WP2', 'CT 1051 WP2', 'CT 1051 WP1',
    'CT 1167 WP2 PRO', 'CT 1139 WP6', 'CT 1168 WP9', 'CT 1230 WP1', 'CT 1203 WP1',
    'CT 1028 WP3', 'CT 957 WP1', 'CT 1077 WP2', 'CT 1010 WP1', 'CT 1028 WP4',
    'CT 957 WP3', 'CT 1105 WP2', 'CT 979 WP2', 'CT 1140 WP1', 'CT 1155 WP1',
    'CT 1162 WP5', 'CT 1092 WP1', 'CT 881 WP4', 'CT 988 WP3', 'CT 1091 WP1',
    'CT 1045 WP1', 'CT 1035 WP3', 'CT 908 WP1', 'CT 1168 WP7', 'CT 1168 WP5',
    'CT 1168 WP4', 'CT 1028 WP7', 'CT 1121 WP1', 'CT 1044 WP1', 'CT 909 WP4',
    'CT 909 WP2', 'CT 1168 WP2', 'CT 1150 WP1', 'CT 1179 WP4',
    // Bosch 1 987 ...
    '1 987 946 383', '1 987 946 450', '1 987 946 954', '1 987 946 943', '1 987 946 974',
    '1 987 946 920', '1 987 946 442', '1 987 946 995', '1 987 946 477', '1 987 946 458',
    '1 987 948 800', '1 987 946 907', '1 987 946 988', '1 987 946 395', '1 987 946 960',
    '1 987 946 953', '1 987 948 727', '1 987 946 393', '1 987 946 391', '1 987 946 387',
    '1 987 946 386', '1 987 946 934', '1 987 946 497',
    // Wycieraczki
    '3 397 007 462', '3 397 007 863', '3 397 118 911', '3 397 007 297', '3 397 118 933',
    '3 397 007 555', '3 397 007 088', '3 397 118 979', '3 397 009 843', '3 397 118 927',
    '3 397 118 907', '3 397 014 242', '3 397 118 938', '3 397 007 414', '3 397 118 948',
    '3 397 007 309', '3 397 118 902', '3 397 007 620', '3 397 007 696', '3 397 118 950',
    '3 397 007 295', '3 397 118 996', '3 397 118 934', '3 397 118 955', '3 397 014 158',
    '3 397 014 076', '3 397 014 173', '3 397 118 984', '3 397 007 120', '3 397 014 138',
    '3 397 018 960', '3 397 118 967', '3 397 118 904', '3 397 118 901', '3 397 118 966',
    '3 397 007 945', '3 397 007 290', '3 397 118 953', '3 397 014 774', '3 397 007 294',
    '3 397 007 523', '3 397 118 977', '3 397 014 419', '3 397 118 929', '3 397 118 903',
    '3 397 118 931', '3 397 007 504', '3 397 014 116', '3 397 009 034', '3 397 007 638',
    '3 397 009 776', '3 397 014 010', '3 397 014 164', '3 397 007 584', '3 397 014 398',
    '3 397 014 009',
    // Filtry oleju
    'W 719/45', 'W 712/95', 'HU 831 x', 'W 712/94', 'F 026 407 080', 'HU 6004 x',
    'HU 711/6 z', 'W 610/3', 'W 719/30', '0 451 103 314', 'HU 8005 z', 'W 7058',
    'HU 821 x', 'HU 925/4 x', 'HU 716/2 x', 'HU 612/2 x', 'W 719/5', 'HU 711/51 x',
    'W 67/1', 'HU 7029 z', 'W 66', 'HU 6013 z', 'F 026 407 143', 'HU 816 x',
    'W 67/2', 'HU 6014/1 z', 'HU 721/5 x', 'HU 815/2 x', 'HU 719/6 x', 'W 610/6',
    'OC 593/3', 'HU 6012 z KIT', 'HU 7012 z',
    // Filtry paliwa
    'WK 820/17', 'PU 8028', 'WK 820/14', 'WK 820/1', 'WK 823/2', 'WK 6037',
    'WK 6003', '0 450 905 959', 'WK 820/16', 'F 026 402 809', 'WK 853/3 x',
    '0 450 906 457', 'PU 825 x', 'WK 8058', '0 450 906 467', 'WK 730/1',
    'WK 820/2 x', 'WK 69', 'PU 8008/1', 'F 026 403 006', 'WK 842/23 x', 'WK 7002',
    'WK 512', 'WK 920/6', 'WK 720', 'WK 842/2', 'PU 9001/1 x', 'PU 11 002 z KIT',
    'WK 820/18', '1 457 434 437', '1 457 070 013', 'WK 735/1', 'WK 939/13',
    'WK 9025', 'WK 834/1', '0 450 905 952', 'WK 853/21', 'KL 736/1D', 'WK 5010',
    'F 026 402 068', 'WK 42/2', 'WK 820/20', 'WK 857/1', 'WK 817/3 x', 'KL 145',
    'KL 176/6D', 'F 026 402 533', 'WK 5015', 'WK 6001', 'KX 386', 'WK 720/2 x',
    'KL 1102', 'F 026 402 824', 'WK 69/2'
];

// Kategorie na podstawie pozycji w liście
const CATEGORY_MAP = {};
const rozrzady = [
    'CT 1229 WP2 PRO', 'CT 1168 WP3', 'CT 1216 WP2', 'CT 1168 WP8 PRO', 'CT 1168 WP1',
    'CT 1139 WP8 PRO', 'CT 1148 WP1', 'CT 1134 WP2', 'CT 1051 WP2', 'CT 1051 WP1',
    'CT 1167 WP2 PRO', 'CT 1139 WP6', 'CT 1168 WP9', 'CT 1230 WP1', 'CT 1203 WP1',
    'CT 1028 WP3', 'CT 957 WP1', 'CT 1077 WP2', 'CT 1010 WP1', 'CT 1028 WP4',
    'CT 957 WP3', 'CT 1105 WP2', 'CT 979 WP2', 'CT 1140 WP1', 'CT 1155 WP1',
    'CT 1162 WP5', 'CT 1092 WP1', 'CT 881 WP4', 'CT 988 WP3', 'CT 1091 WP1',
    'CT 1045 WP1', 'CT 1035 WP3', 'CT 908 WP1', 'CT 1168 WP7', 'CT 1168 WP5',
    'CT 1168 WP4', 'CT 1028 WP7', 'CT 1121 WP1', 'CT 1044 WP1', 'CT 909 WP4',
    'CT 909 WP2', 'CT 1168 WP2', 'CT 1150 WP1', 'CT 1179 WP4'
];
const bosch = [
    '1 987 946 383', '1 987 946 450', '1 987 946 954', '1 987 946 943', '1 987 946 974',
    '1 987 946 920', '1 987 946 442', '1 987 946 995', '1 987 946 477', '1 987 946 458',
    '1 987 948 800', '1 987 946 907', '1 987 946 988', '1 987 946 395', '1 987 946 960',
    '1 987 946 953', '1 987 948 727', '1 987 946 393', '1 987 946 391', '1 987 946 387',
    '1 987 946 386', '1 987 946 934', '1 987 946 497'
];
const wycieraczki = [
    '3 397 007 462', '3 397 007 863', '3 397 118 911', '3 397 007 297', '3 397 118 933',
    '3 397 007 555', '3 397 007 088', '3 397 118 979', '3 397 009 843', '3 397 118 927',
    '3 397 118 907', '3 397 014 242', '3 397 118 938', '3 397 007 414', '3 397 118 948',
    '3 397 007 309', '3 397 118 902', '3 397 007 620', '3 397 007 696', '3 397 118 950',
    '3 397 007 295', '3 397 118 996', '3 397 118 934', '3 397 118 955', '3 397 014 158',
    '3 397 014 076', '3 397 014 173', '3 397 118 984', '3 397 007 120', '3 397 014 138',
    '3 397 018 960', '3 397 118 967', '3 397 118 904', '3 397 118 901', '3 397 118 966',
    '3 397 007 945', '3 397 007 290', '3 397 118 953', '3 397 014 774', '3 397 007 294',
    '3 397 007 523', '3 397 118 977', '3 397 014 419', '3 397 118 929', '3 397 118 903',
    '3 397 118 931', '3 397 007 504', '3 397 014 116', '3 397 009 034', '3 397 007 638',
    '3 397 009 776', '3 397 014 010', '3 397 014 164', '3 397 007 584', '3 397 014 398',
    '3 397 014 009'
];
const filtryOleju = [
    'W 719/45', 'W 712/95', 'HU 831 x', 'W 712/94', 'F 026 407 080', 'HU 6004 x',
    'HU 711/6 z', 'W 610/3', 'W 719/30', '0 451 103 314', 'HU 8005 z', 'W 7058',
    'HU 821 x', 'HU 925/4 x', 'HU 716/2 x', 'HU 612/2 x', 'W 719/5', 'HU 711/51 x',
    'W 67/1', 'HU 7029 z', 'W 66', 'HU 6013 z', 'F 026 407 143', 'HU 816 x',
    'W 67/2', 'HU 6014/1 z', 'HU 721/5 x', 'HU 815/2 x', 'HU 719/6 x', 'W 610/6',
    'OC 593/3', 'HU 6012 z KIT', 'HU 7012 z'
];
const filtryPaliwa = [
    'WK 820/17', 'PU 8028', 'WK 820/14', 'WK 820/1', 'WK 823/2', 'WK 6037',
    'WK 6003', '0 450 905 959', 'WK 820/16', 'F 026 402 809', 'WK 853/3 x',
    '0 450 906 457', 'PU 825 x', 'WK 8058', '0 450 906 467', 'WK 730/1',
    'WK 820/2 x', 'WK 69', 'PU 8008/1', 'F 026 403 006', 'WK 842/23 x', 'WK 7002',
    'WK 512', 'WK 920/6', 'WK 720', 'WK 842/2', 'PU 9001/1 x', 'PU 11 002 z KIT',
    'WK 820/18', '1 457 434 437', '1 457 070 013', 'WK 735/1', 'WK 939/13',
    'WK 9025', 'WK 834/1', '0 450 905 952', 'WK 853/21', 'KL 736/1D', 'WK 5010',
    'F 026 402 068', 'WK 42/2', 'WK 820/20', 'WK 857/1', 'WK 817/3 x', 'KL 145',
    'KL 176/6D', 'F 026 402 533', 'WK 5015', 'WK 6001', 'KX 386', 'WK 720/2 x',
    'KL 1102', 'F 026 402 824', 'WK 69/2'
];
rozrzady.forEach(code => CATEGORY_MAP[code] = 'Zestawy Rozrządu');
bosch.forEach(code => CATEGORY_MAP[code] = 'Zestawy Rozrządu');
wycieraczki.forEach(code => CATEGORY_MAP[code] = 'Wycieraczki');
filtryOleju.forEach(code => CATEGORY_MAP[code] = 'Filtry Oleju');
filtryPaliwa.forEach(code => CATEGORY_MAP[code] = 'Filtry Paliwa');

function getCategory(code) {
    return CATEGORY_MAP[code] || 'Inne';
}

function getReadableName(code) {
    const category = getCategory(code);
    if (category === 'Zestawy Rozrządu') return `Zestaw Rozrządu ${code}`;
    if (category === 'Wycieraczki') return `Wycieraczka ${code}`;
    if (category === 'Filtry Oleju') return `Filtr Oleju ${code}`;
    if (category === 'Filtry Paliwa') return `Filtr Paliwa ${code}`;
    return code;
}

function normalize(code) {
    return code.replace(/\s+/g, '').toUpperCase();
}

// Funkcja do wczytywania cen z pliku CSV
async function loadPrices() {
    return new Promise((resolve, reject) => {
        const prices = new Map();
        fs.createReadStream(PRICE_PATH)
            .pipe(csv({
                separator: ';',
                mapHeaders: ({ header }) => header.trim()
            }))
            .on('data', (row) => {
                const code = row['TOW_KOD'] || row['ARTICLE_NUMBER'];
                const price = parseFloat(row['PRICE'] || row['WHOLESALE_PRICE'] || 0);
                if (code && !isNaN(price)) {
                    prices.set(normalize(code), price);
                }
            })
            .on('end', () => resolve(prices))
            .on('error', reject);
    });
}

// Funkcja do wczytywania stanów magazynowych z pliku CSV
async function loadStock() {
    return new Promise((resolve, reject) => {
        const stock = new Map();
        fs.createReadStream(STOCK_PATH)
            .pipe(csv({
                separator: ';',
                mapHeaders: ({ header }) => header.trim()
            }))
            .on('data', (row) => {
                const code = row['TOW_KOD'] || row['ARTICLE_NUMBER'];
                const hsn = parseInt(row['HSN'] || 0);
                const hza = parseInt(row['HZA'] || 0);
                const szc = parseInt(row['SZC'] || 0);
                if (code) {
                    stock.set(normalize(code), { HSN: hsn, HZA: hza, SZC: szc });
                }
            })
            .on('end', () => resolve(stock))
            .on('error', reject);
    });
}

async function findProductInCSV(code) {
    return new Promise((resolve, reject) => {
        let found = false;
        fs.createReadStream(CSV_PATH)
            .pipe(csv({
                separator: ';',
                mapHeaders: ({ header }) => header.trim()
            }))
            .on('data', (row) => {
                const possibleCodes = [row['TOW_KOD'], row['ARTICLE_NUMBER'], row['CUSTOM_CODE']].filter(Boolean);
                for (const csvCode of possibleCodes) {
                    if (normalize(csvCode) === normalize(code)) {
                        found = true;
                        resolve(row);
                    }
                }
            })
            .on('end', () => {
                if (!found) resolve(null);
            })
            .on('error', reject);
    });
}

async function importProducts() {
    console.log('Rozpoczynam import produktów...');
    console.log('Używam plików:');
    console.log('- Informacje: ' + path.basename(CSV_PATH));
    console.log('- Stany: ' + path.basename(STOCK_PATH));
    console.log('- Ceny: ' + path.basename(PRICE_PATH));

    let imported = 0;
    let updated = 0;
    let missing = 0;
    let errors = 0;

    try {
    // Wczytaj ceny i stany magazynowe
        const [prices, stock] = await Promise.all([loadPrices(), loadStock()]);
        console.log(`Wczytano ${prices.size} cen i ${stock.size} stanów magazynowych`);

        for (const code of PRODUCT_CODES) {
            try {
                const row = await findProductInCSV(code);
                const categoryName = getCategory(code);
                // Pobierz kategorię z bazy
                const categoryObj = await Category.findOne({ where: { name: categoryName } });
                if (!categoryObj) {
                    throw new Error('Brak kategorii w bazie: ' + categoryName);
                }
                const normalizedCode = normalize(code);
                const price = prices.get(normalizedCode) || 0;
                const stockData = stock.get(normalizedCode) || { HSN: 0, HZA: 0, SZC: 0 };
                const totalStock = Object.values(stockData).reduce((a, b) => a + b, 0);

                const productData = {
                    name: row ? (row['SHORT_DESCRIPTION'] || row['DESCRIPTION'] || getReadableName(code)) : getReadableName(code),
                    description: row ? (row['DESCRIPTION'] || '') : 'Brak na magazynie',
                    price: price,
                    stock: totalStock,
                    categoryId: categoryObj.id,
                    imageUrl: '',
                    sku: code,
                    warehouses: stockData,
                    lastUpdate: new Date()
                };

                const [product, created] = await Product.findOrCreate({
                    where: { sku: productData.sku },
                    defaults: productData
                });

                if (!created) {
                    // Aktualizuj tylko jeśli są zmiany
                    const needsUpdate =
            product.price !== productData.price ||
            product.stock !== productData.stock ||
            JSON.stringify(product.warehouses) !== JSON.stringify(productData.warehouses);

                    if (needsUpdate) {
                        await product.update(productData);
                        updated++;
                        console.log(`Zaktualizowano: ${productData.name} (${row ? 'OK' : 'Brak na magazynie'})`);
                    }
                } else {
                    imported++;
                    console.log(`Zaimportowano: ${productData.name}`);
                }

                if (!row) missing++;
            } catch (err) {
                errors++;
                console.error(`Błąd przetwarzania produktu ${code}:`, err.message);
            }
        }

        // Log summary
        console.log('\nPodsumowanie importu:');
        console.log(`Zaimportowano nowych: ${imported}`);
        console.log(`Zaktualizowano: ${updated}`);
        console.log(`Brak na magazynie: ${missing}`);
        console.log(`Błędy: ${errors}`);
        console.log(`Data importu: ${new Date().toISOString()}`);

    } catch (err) {
        console.error('Błąd podczas importu:', err);
        process.exit(1);
    }
}

// Uruchom import
importProducts();
