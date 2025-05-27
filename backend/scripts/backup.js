const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BACKUP_DIR = path.join(__dirname, '../backups');
const DB_FILE = path.join(__dirname, '../database.sqlite');
const MAX_BACKUPS = process.env.BACKUP_RETENTION_DAYS || 30;

async function createBackup() {
    try {
        // Utworzenie katalogu na kopie zapasowe, jeśli nie istnieje
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        // Generowanie nazwy pliku kopii zapasowej
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sqlite`);

        // Kopiowanie pliku bazy danych
        await execAsync(`cp "${DB_FILE}" "${backupFile}"`);
        console.log(`Utworzono kopię zapasową: ${backupFile}`);

        // Usuwanie starych kopii zapasowych
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('backup-'))
            .map(file => ({
                name: file,
                path: path.join(BACKUP_DIR, file),
                time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        // Usuwanie kopii zapasowych starszych niż MAX_BACKUPS dni
        const cutoffTime = Date.now() - (MAX_BACKUPS * 24 * 60 * 60 * 1000);
        for (const file of files) {
            if (file.time < cutoffTime) {
                fs.unlinkSync(file.path);
                console.log(`Usunięto starą kopię zapasową: ${file.name}`);
            }
        }

        // Kompresja kopii zapasowej
        const compressedFile = `${backupFile}.gz`;
        await execAsync(`gzip -c "${backupFile}" > "${compressedFile}"`);
        fs.unlinkSync(backupFile); // Usunięcie nieskompresowanego pliku
        console.log(`Skompresowano kopię zapasową: ${compressedFile}`);

    } catch (error) {
        console.error('Błąd podczas tworzenia kopii zapasowej:', error);
        process.exit(1);
    }
}

// Uruchomienie tworzenia kopii zapasowej
createBackup();
