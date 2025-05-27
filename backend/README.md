# B2B Backend API

Backend API dla platformy B2B, obsługujący zarządzanie produktami, użytkownikami, zamówieniami i płatnościami.

## Wymagania

- Node.js >= 18.0.0
- SQLite3
- npm lub yarn

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone [url-repozytorium]
cd b2b-backend
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skopiuj plik .env.example do .env i uzupełnij zmienne środowiskowe:
```bash
cp .env.example .env
```

4. Uruchom migracje bazy danych:
```bash
npm run db:migrate
```

5. (Opcjonalnie) Uruchom seedy bazy danych:
```bash
npm run db:seed
```

## Uruchomienie

### Tryb deweloperski
```bash
npm run dev
```

### Tryb produkcyjny
```bash
npm start
```

## Dostępne skrypty

- `npm start` - Uruchomienie w trybie produkcyjnym
- `npm run dev` - Uruchomienie w trybie deweloperskim z hot-reload
- `npm test` - Uruchomienie testów
- `npm run test:watch` - Uruchomienie testów w trybie watch
- `npm run test:coverage` - Uruchomienie testów z raportem pokrycia
- `npm run lint` - Sprawdzenie kodu linterem
- `npm run lint:fix` - Automatyczne naprawienie błędów lintera
- `npm run format` - Formatowanie kodu
- `npm run db:migrate` - Uruchomienie migracji bazy danych
- `npm run db:seed` - Uruchomienie seederów bazy danych
- `npm run db:reset` - Reset bazy danych (usuwa, tworzy na nowo, migruje i seeduje)
- `npm run backup` - Utworzenie kopii zapasowej bazy danych
- `npm run security-check` - Sprawdzenie bezpieczeństwa zależności

## Struktura projektu

```
backend/
├── src/
│   ├── config/         # Konfiguracja aplikacji
│   ├── controllers/    # Kontrolery
│   ├── middleware/     # Middleware
│   ├── models/         # Modele Sequelize
│   ├── routes/         # Definicje tras
│   ├── utils/          # Narzędzia pomocnicze
│   └── app.js          # Główny plik aplikacji
├── __tests__/         # Testy
├── scripts/           # Skrypty pomocnicze
├── backups/           # Kopie zapasowe bazy danych
└── logs/             # Logi aplikacji
```

## API Endpoints

### Autoryzacja
- `POST /api/auth/register` - Rejestracja nowego użytkownika
- `POST /api/auth/login` - Logowanie
- `POST /api/auth/logout` - Wylogowanie
- `POST /api/auth/refresh-token` - Odświeżenie tokena
- `POST /api/auth/forgot-password` - Reset hasła
- `POST /api/auth/reset-password` - Ustawienie nowego hasła

### Użytkownicy
- `GET /api/users/profile` - Pobranie profilu użytkownika
- `PUT /api/users/profile` - Aktualizacja profilu
- `GET /api/users/orders` - Pobranie zamówień użytkownika

### Produkty
- `GET /api/products` - Lista produktów
- `GET /api/products/:id` - Szczegóły produktu
- `GET /api/products/category/:category` - Produkty z kategorii

### Zamówienia
- `POST /api/orders` - Utworzenie zamówienia
- `GET /api/orders/:id` - Szczegóły zamówienia
- `GET /api/orders` - Lista zamówień

### Płatności
- `POST /api/payments/create-intent` - Utworzenie intencji płatności
- `POST /api/payments/webhook` - Webhook dla płatności

## Bezpieczeństwo

- Wszystkie hasła są hashowane przy użyciu bcrypt
- Używane są JWT tokeny z krótkim czasem życia
- Implementacja rate limitingu
- Ochrona przed CSRF
- Nagłówki bezpieczeństwa (Helmet)
- Walidacja danych wejściowych
- Monitorowanie błędów (Sentry)

## Testy

Projekt zawiera testy jednostkowe i integracyjne. Uruchom je za pomocą:

```bash
npm test
```

## Monitoring

- Używamy Sentry do monitorowania błędów
- Logi są zapisywane do plików w katalogu `logs/`
- Dostępny jest endpoint `/health` do sprawdzania stanu serwera

## Kopie zapasowe

Kopie zapasowe bazy danych są tworzone automatycznie co 24 godziny w trybie produkcyjnym.
Możesz również utworzyć kopię zapasową ręcznie:

```bash
npm run backup
```

## Licencja

ISC 