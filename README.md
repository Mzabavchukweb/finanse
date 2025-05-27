# NazwaAplikacji – szybki start

## Jak uruchomić projekt lokalnie

1. Sklonuj repozytorium:
```bash
   git clone https://github.com/Mzabavchukweb/b2b-ecom.git
   cd b2b-ecom
```
2. Skopiuj plik konfiguracyjny środowiska:
```bash
   cp env.example .env
```
3. Zainstaluj zależności w głównym katalogu, backendzie i frontendzie:
```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
```
4. (Opcjonalnie) Uruchom migracje bazy danych w backendzie:
```bash
   cd backend
   npm run db:migrate
   cd ..
```
5. Uruchom backend i frontend (w osobnych terminalach):
```bash
   cd backend && npm run dev
   # w nowym terminalu:
   cd frontend && npm run dev
```

## Uwaga
- Pliki .env, bazy danych (.sqlite), katalogi logs/ i node_modules/ nie są przechowywane w repozytorium – musisz je utworzyć lokalnie.
- Przykładową konfigurację środowiska znajdziesz w pliku env.example.
- Jeśli korzystasz z docker-compose, możesz uruchomić całość poleceniem:
```bash
   docker-compose up --build
```

## Minimalna instalacja

1. Sklonuj repo:
```bash
   git clone <repo-url>
   cd <repo-folder>
```
2. Zainstaluj zależności:
```bash
npm install
```
3. Skonfiguruj plik `.env` (przykład):
```env
   JWT_SECRET=twoj_tajny_klucz
   EMAIL_USER=twoj_email@gmail.com
   EMAIL_PASSWORD=haslo_aplikacji_gmail
   ADMIN_EMAIL=admin@twojadomena.pl
   FRONTEND_URL=http://localhost:3000
   ```
4. Uruchom backend i frontend (oba na porcie 3000):
```bash
npm run dev
```

## Funkcje (tylko konkret):
- Rejestracja i logowanie użytkownika (walidacja, email, silne hasło)
- Weryfikacja emaila (link aktywacyjny)
- Panel użytkownika: tylko dane (imię, nazwisko, email, firma, zmiana hasła)
- Panel admina: CRUD produktów, kategorii, użytkowników
- Katalog produktów z CSV (filtrowanie, paginacja, koszyk)
- Wysyłka maili (Gmail lub SMTP)
- Prosta obsługa błędów (jasne komunikaty)

## Testy automatyczne
- Kolekcja Postman: testy API (rejestracja, logowanie, zamówienia, autoryzacja)
- Skrypty Cypress: testy UI (formularze, komunikaty, XSS, regresja)
- Testy bezpieczeństwa: SQLi, XSS, brute-force
- Testy wydajności: Artillery (100+ użytkowników)

## Uruchomienie testów
- Postman: `newman run kolekcja.postman_collection.json`
- Cypress: `npx cypress open` lub `npx cypress run`
- Artillery: `artillery run test.yml`

## Usuwanie wszystkich użytkowników (reset bazy)
```bash
node -e "const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('./database.sqlite'); db.run('DELETE FROM users', function(err) { if (err) { console.error('Błąd:', err); } else { console.log('Wszyscy użytkownicy usunięci!'); } db.close(); });"
```

## FAQ
- Jeśli nie dochodzą maile: sprawdź konfigurację SMTP i folder SPAM.
- Jeśli rejestracja/logowanie nie działa: sprawdź logi backendu i poprawność endpointów.
- Jeśli chcesz jeszcze prostszy panel użytkownika – usuń niepotrzebne sekcje w `account.html`.

---
**Zero marketingu. Tylko konkret.**