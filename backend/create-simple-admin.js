const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

(async () => {
    try {
        const password = await bcrypt.hash('admin123', 10);
        const email = 'admin@cartechstore.pl';

        db.run(`
            INSERT OR REPLACE INTO users (
                email, password, firstName, lastName, 
                role, isVerified, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [email, password, 'Admin', 'Cartechstore', 'admin', 1], function (err) {
            if (err) {
                console.error('Error creating admin:', err);
            } else {
                console.log('✅ Admin user created successfully!');
                console.log('📧 Email:', email);
                console.log('🔑 Password: admin123');
                console.log('🌐 Login at: http://localhost:3005/pages/admin-login.html');
            }
            db.close();
        });
    } catch (error) {
        console.error('Error:', error);
        db.close();
    }
})();
