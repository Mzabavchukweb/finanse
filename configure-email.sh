#!/bin/bash

echo "📧 KONFIGURACJA EMAIL DLA APLIKACJI"
echo "==================================="
echo ""
echo "Wybierz dostawcę email:"
echo "1) Gmail (zalecane)"
echo "2) Inny SMTP"
echo ""
read -p "Wybór (1 lub 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🔧 INSTRUKCJA DLA GMAIL:"
    echo "------------------------"
    echo "1. Zaloguj się na swoje konto Gmail"
    echo "2. Włącz weryfikację dwuetapową:"
    echo "   https://myaccount.google.com/security"
    echo "3. Wygeneruj hasło aplikacji:"
    echo "   https://myaccount.google.com/apppasswords"
    echo "4. Wybierz: 'Poczta' i 'Inne (nazwa własna)'"
    echo "5. Skopiuj 16-znakowe hasło"
    echo ""
    read -p "Podaj swój email Gmail: " gmail_user
    read -p "Podaj 16-znakowe hasło aplikacji (bez spacji): " gmail_pass
    
    # Aktualizuj plik .env
    sed -i '' "s/SMTP_USER=.*/SMTP_USER=$gmail_user/" backend/.env
    sed -i '' "s/SMTP_PASS=.*/SMTP_PASS=$gmail_pass/" backend/.env
    sed -i '' "s/EMAIL_FROM=.*/EMAIL_FROM=$gmail_user/" backend/.env
    
    echo "✅ Konfiguracja Gmail zapisana!"
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "🔧 KONFIGURACJA WŁASNEGO SMTP:"
    echo "------------------------------"
    read -p "Host SMTP (np. smtp.firma.pl): " smtp_host
    read -p "Port SMTP (np. 587): " smtp_port
    read -p "Email nadawcy: " smtp_user
    read -p "Hasło: " smtp_pass
    read -p "Użyć SSL? (true/false): " smtp_secure
    
    # Aktualizuj plik .env
    sed -i '' "s/SMTP_HOST=.*/SMTP_HOST=$smtp_host/" backend/.env
    sed -i '' "s/SMTP_PORT=.*/SMTP_PORT=$smtp_port/" backend/.env
    sed -i '' "s/SMTP_USER=.*/SMTP_USER=$smtp_user/" backend/.env
    sed -i '' "s/SMTP_PASS=.*/SMTP_PASS=$smtp_pass/" backend/.env
    sed -i '' "s/SMTP_SECURE=.*/SMTP_SECURE=$smtp_secure/" backend/.env
    sed -i '' "s/EMAIL_FROM=.*/EMAIL_FROM=$smtp_user/" backend/.env
    
    echo "✅ Konfiguracja SMTP zapisana!"
fi

echo ""
echo "🔄 Restart serwerów..."
# Znajdź i zatrzymaj procesy
kill $(lsof -ti:3005) 2>/dev/null
kill $(lsof -ti:5500) 2>/dev/null
sleep 2

# Uruchom ponownie
cd backend && node server.js > backend.log 2>&1 &
cd ..
node frontend-server.js > frontend.log 2>&1 &

echo "✅ Serwery zrestartowane!"
echo ""
echo "📧 Email skonfigurowany! Teraz rejestracja będzie działać." 