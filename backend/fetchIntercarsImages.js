const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Wczytaj listę kodów produktów
const { PRODUCT_CODES } = require('./importProducts');

const OUTPUT_PATH = path.join(__dirname, '../product_images.json');

async function fetchImagesForCode(code) {
    const searchUrl = `https://intercars.pl/szukaj/?query=${encodeURIComponent(code)}`;
    try {
        const searchRes = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(searchRes.data);
        // Znajdź pierwszy produkt na liście wyników
        const productLink = $('a.product-list__item').attr('href');
        if (!productLink) return [];
        const productUrl = `https://intercars.pl${productLink}`;
        const productRes = await axios.get(productUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $$ = cheerio.load(productRes.data);
        // Pobierz wszystkie zdjęcia produktu
        const images = [];
        $$('.product-gallery__image img').each((i, el) => {
            const src = $$(el).attr('src');
            if (src && !images.includes(src)) images.push(src.startsWith('http') ? src : `https://intercars.pl${src}`);
        });
        return images.slice(0, 3); // max 3 zdjęcia
    } catch (e) {
        console.error(`Błąd dla ${code}:`, e.message);
        return [];
    }
}

(async () => {
    const result = {};
    for (const code of PRODUCT_CODES) {
        console.log(`Szukam zdjęć dla: ${code}`);
        const images = await fetchImagesForCode(code);
        result[code] = images;
        console.log(`Znaleziono ${images.length} zdjęć.`);
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
    console.log('Zapisano product_images.json');
})();
