#!/bin/bash

echo "🚀 Uruchamianie i testowanie aplikacji e-commerce B2B"
echo "=================================================="

# Przejdź do katalogu projektu
cd /Users/maksymzabavchuk/Desktop/b2b_cartechstore/mz

# Zatrzymaj wszystkie procesy node na portach 3005 i 5500
echo "🛑 Zatrzymywanie ewentualnych działających procesów..."
lsof -ti:3005 | xargs kill -9 2>/dev/null
lsof -ti:5500 | xargs kill -9 2>/dev/null

# Uruchom backend
echo "🔧 Uruchamianie backendu..."
cd backend
node server.js > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Czekaj aż backend się uruchomi
sleep 5

# Uruchom frontend
echo "🌐 Uruchamianie frontendu..."
node frontend-server.js > frontend.log 2>&1 &
FRONTEND_PID=$!

# Czekaj aż frontend się uruchomi
sleep 3

echo ""
echo "📋 Status serwerów:"
echo "-------------------"
if lsof -i:3005 > /dev/null 2>&1; then
    echo "✅ Backend działa na porcie 3005 (PID: $BACKEND_PID)"
else
    echo "❌ Backend nie działa!"
    echo "Logi backendu:"
    tail -20 backend/backend.log
fi

if lsof -i:5500 > /dev/null 2>&1; then
    echo "✅ Frontend działa na porcie 5500 (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend nie działa!"
    echo "Logi frontendu:"
    tail -20 frontend.log
fi

echo ""
echo "🧪 Testy funkcjonalności:"
echo "------------------------"

# Test 1: Logowanie admina
echo ""
echo "1️⃣ Test logowania administratora..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3005/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cartechstore.pl","password":"admin123"}' 2>/dev/null)

if echo "$ADMIN_RESPONSE" | grep -q "token"; then
    echo "✅ Logowanie administratora działa!"
    TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    echo "   Token: ${TOKEN:0:20}..."
else
    echo "❌ Błąd logowania administratora:"
    echo "   $ADMIN_RESPONSE"
fi

# Test 2: Rejestracja użytkownika
echo ""
echo "2️⃣ Test rejestracji użytkownika B2B..."
USER_EMAIL="test_$(date +%s)@example.com"
REG_RESPONSE=$(curl -s -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$USER_EMAIL\",
    \"password\":\"Test123!@#\",
    \"firstName\":\"Test\",
    \"lastName\":\"User\",
    \"companyName\":\"Test Company\",
    \"companyCountry\":\"PL\",
    \"nip\":\"1234567890\",
    \"phone\":\"123456789\",
    \"address\":{
      \"street\":\"Testowa 1\",
      \"postalCode\":\"00-001\",
      \"city\":\"Warszawa\"
    }
  }" 2>/dev/null)

if echo "$REG_RESPONSE" | grep -q "User registered successfully"; then
    echo "✅ Rejestracja użytkownika działa!"
    echo "   Email testowy: $USER_EMAIL"
else
    echo "❌ Błąd rejestracji:"
    echo "   $REG_RESPONSE"
fi

# Test 3: Sprawdzenie stron
echo ""
echo "3️⃣ Test dostępności stron..."
PAGES=("index.html" "login.html" "admin-login.html" "b2b-registration.html" "register-customer.html")
for page in "${PAGES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5500/pages/$page)
    if [ "$STATUS" = "200" ]; then
        echo "✅ /pages/$page - dostępna"
    else
        echo "❌ /pages/$page - błąd (status: $STATUS)"
    fi
done

echo ""
echo "📍 Adresy do testów manualnych:"
echo "-------------------------------"
echo "🏠 Strona główna: http://localhost:5500/pages/index.html"
echo "🔐 Panel admina: http://localhost:5500/pages/admin-login.html"
echo "👤 Logowanie użytkownika: http://localhost:5500/pages/login.html"
echo "📝 Rejestracja B2B: http://localhost:5500/pages/b2b-registration.html"
echo "🛒 Rejestracja detaliczna: http://localhost:5500/pages/register-customer.html"

echo ""
echo "🔑 Dane logowania administratora:"
echo "---------------------------------"
echo "Email: admin@cartechstore.pl"
echo "Hasło: admin123"

echo ""
echo "💡 Aby zatrzymać serwery, użyj:"
echo "kill $BACKEND_PID $FRONTEND_PID" 