require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔄 PRZEŁĄCZANIE SYSTEMU NA GMAIL SMTP (DARMOWY)');
console.log('===============================================');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
    console.log('❌ Brak pliku .env');
    console.log('📋 Stwórz plik .env z zawartością:');
    console.log('');
    console.log('EMAIL_PROVIDER=gmail');
    console.log('GMAIL_USER=zabavchukmaks21@gmail.com');
    console.log('GMAIL_APP_PASSWORD=twoje-hasło-aplikacji');
    console.log('');
    console.log('🔗 Instrukcje: zobacz GMAIL_SETUP.md');
    process.exit(1);
}

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf8');

// Check current configuration
const hasEmailProvider = envContent.includes('EMAIL_PROVIDER');
const hasGmailUser = envContent.includes('GMAIL_USER');
const hasGmailPassword = envContent.includes('GMAIL_APP_PASSWORD');

console.log('📋 AKTUALNY STATUS KONFIGURACJI:');
console.log(`   EMAIL_PROVIDER: ${hasEmailProvider ? '✅' : '❌'}`);
console.log(`   GMAIL_USER: ${hasGmailUser ? '✅' : '❌'}`);
console.log(`   GMAIL_APP_PASSWORD: ${hasGmailPassword ? '✅' : '❌'}`);

// Add missing configuration
if (!hasEmailProvider) {
    envContent += '\n# Email Provider\nEMAIL_PROVIDER=gmail\n';
    console.log('✅ Dodano EMAIL_PROVIDER=gmail');
}

if (!hasGmailUser) {
    envContent += '\n# Gmail SMTP (FREE)\nGMAIL_USER=zabavchukmaks21@gmail.com\n';
    console.log('✅ Dodano GMAIL_USER');
}

if (!hasGmailPassword) {
    envContent += 'GMAIL_APP_PASSWORD=your-app-password-here\n';
    console.log('⚠️  Dodano GMAIL_APP_PASSWORD - MUSISZ GO SKONFIGUROWAĆ!');
}

// Write updated .env
fs.writeFileSync(envPath, envContent);

// Create backup of current email.js
const emailPath = path.join(__dirname, 'src/utils/email.js');
const backupPath = path.join(__dirname, 'src/utils/email-resend-backup.js');

if (fs.existsSync(emailPath)) {
    fs.copyFileSync(emailPath, backupPath);
    console.log('📁 Utworzono backup: email-resend-backup.js');
}

// Replace email.js with Gmail version
const gmailEmailPath = path.join(__dirname, 'src/utils/email-hybrid.js');
if (fs.existsSync(gmailEmailPath)) {
    fs.copyFileSync(gmailEmailPath, emailPath);
    console.log('🔄 Zastąpiono email.js hybrydową wersją');
}

console.log('');
console.log('🎯 NASTĘPNE KROKI:');
console.log('==================');
console.log('1. Skonfiguruj Gmail App Password (zobacz GMAIL_SETUP.md)');
console.log('2. Uruchom test: node test-gmail-system.js');
console.log('3. Restart serwer: npm start');
console.log('4. Wszystkie emaile będą działać na wszystkie adresy!');
console.log('');
console.log('💰 OSZCZĘDNOŚCI: $20/miesiąc vs FREE');
console.log('📊 LIMIT: 500 emaili/dzień (wystarczające dla B2B)');

console.log('');
console.log('✅ SYSTEM PRZYGOTOWANY DO PRZEŁĄCZENIA!');
