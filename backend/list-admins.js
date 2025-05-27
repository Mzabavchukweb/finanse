const { User } = require('./models');

(async () => {
    const admins = await User.findAll({ where: { role: 'admin' } });
    if (!admins.length) {
        console.log('Brak użytkowników z rolą admin!');
        process.exit(0);
    }
    admins.forEach(a => {
        console.log(`Email: ${a.email}, status: ${a.status}, isVerified: ${a.isVerified}, NIP: ${a.nip}`);
    });
    process.exit(0);
})();
