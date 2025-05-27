const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const watchDir = path.join(__dirname, '../csv_extracted');
console.log('CSV Watcher: monitoring folderu', watchDir);

let timeout = null;
let lastProcessedFiles = new Set();

function logWithTimestamp(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

function processCSVFiles() {
    const files = fs.readdirSync(watchDir).filter(f => f.endsWith('.csv'));
    const currentFiles = new Set(files);

    // Sprawdź czy są nowe pliki
    const newFiles = files.filter(f => !lastProcessedFiles.has(f));

    if (newFiles.length > 0) {
        logWithTimestamp(`Wykryto nowe pliki CSV: ${newFiles.join(', ')}`);
        logWithTimestamp('Uruchamiam import produktów...');

        exec('node backend/importProducts.js', (err, stdout, stderr) => {
            if (err) {
                logWithTimestamp(`Błąd importu: ${err.message}`);
                if (stderr) logWithTimestamp(`Szczegóły błędu: ${stderr}`);
            } else {
                logWithTimestamp('Import zakończony pomyślnie');
                logWithTimestamp('Log importu:\n' + stdout);
            }
        });

        lastProcessedFiles = currentFiles;
    }
}

// Inicjalne przetworzenie plików
processCSVFiles();

// Nasłuchuj zmian w folderze
fs.watch(watchDir, { persistent: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.csv')) {
        logWithTimestamp(`Wykryto zmianę w pliku: ${filename}`);

        if (timeout) clearTimeout(timeout);
        // Debounce: odczekaj 2 sekundy, żeby nie odpalać importu wielokrotnie
        timeout = setTimeout(processCSVFiles, 2000);
    }
});
