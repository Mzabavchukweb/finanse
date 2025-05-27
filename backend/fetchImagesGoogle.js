const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { PRODUCT_CODES } = require('./importProducts');

const OUTPUT_PATH = path.join(__dirname, '../product_images.json');
const GOOGLE_API_KEY = 'AIzaSyB5U4XqYNmgB_v5DI1U8PJLzQ832RLkgEc';
const GOOGLE_CX = '03d14dde5cc8d4fa4';

if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.error('Ustaw GOOGLE_API_KEY i GOOGLE_CX w zmiennych środowiskowych!');
    process.exit(1);
}

async function fetchImagesGoogle(query) {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_CX}&key=${GOOGLE_API_KEY}&searchType=image&num=5`;
    try {
        const res = await axios.get(url);
        return (res.data.items || []).map(item => item.link).slice(0, 3);
    } catch (e) {
        console.error('Błąd Google Images:', e.message);
        return [];
    }
}

(async () => {
    const result = {};
    for (const code of PRODUCT_CODES) {
        const query = `auto części ${code}`;
        console.log(`Google Images: ${query}`);
        const images = await fetchImagesGoogle(query);
        result[code] = images;
        console.log(`Znaleziono ${images.length} zdjęć.`);
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
    console.log('Zapisano product_images.json');
})();
