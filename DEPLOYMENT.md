# Instrukcja wdrożenia Cartechstore

## Wymagania systemowe

- Node.js >= 16.0.0
- npm >= 8.0.0
- SQLite3 (domyślnie) lub PostgreSQL >= 13 (opcjonalnie dla produkcji)
- Redis (opcjonalnie, dla cache i sesji)

## Zmienne środowiskowe

Utwórz plik `.env` w głównym katalogu projektu z następującymi zmiennymi:

```env
# Aplikacja
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://twoja-domena.pl

# Baza danych - wybierz jedną opcję:
# Opcja 1: SQLite (prostsze, domyślne):
DB_DIALECT=sqlite

# Opcja 2: PostgreSQL (zalecane dla produkcji):
# DB_DIALECT=postgresql
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=cartechstore
# DB_USER=twoj_user
# DB_PASSWORD=twoje_haslo

# JWT
JWT_SECRET=twoj_tajny_klucz
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# reCAPTCHA
RECAPTCHA_SITE_KEY=twoj_klucz_strony
RECAPTCHA_SECRET_KEY=twoj_tajny_klucz

# Stripe
STRIPE_PUBLISHABLE_KEY=twoj_klucz_publiczny
STRIPE_SECRET_KEY=twoj_klucz_tajny

# Email
SMTP_HOST=smtp.twoj-smtp.pl
SMTP_PORT=587
SMTP_USER=twoj_user
SMTP_PASS=twoje_haslo
EMAIL_FROM=noreply@twoja-domena.pl

# Sentry
SENTRY_DSN=twoj_dsn_z_sentry

# Session
SESSION_SECRET=twoj_tajny_klucz_sesji
```

## Kroki wdrożenia

1. Przygotowanie serwera:
   ```bash
   # Aktualizacja systemu
   sudo apt update && sudo apt upgrade -y
   
   # Instalacja Node.js
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Instalacja PostgreSQL
   sudo apt install -y postgresql postgresql-contrib
   
   # Instalacja PM2
   sudo npm install -g pm2
   ```

2. Konfiguracja bazy danych:

   **Opcja A: SQLite (domyślna, prostsza):**
   ```bash
   # Baza danych zostanie utworzona automatycznie przy pierwszym uruchomieniu
   # Nie wymaga dodatkowej konfiguracji
   ```

   **Opcja B: PostgreSQL (zalecana dla produkcji):**
   ```bash
   # Instalacja PostgreSQL
   sudo apt install -y postgresql postgresql-contrib
   
   # Konfiguracja bazy danych
   sudo -u postgres psql
   CREATE DATABASE cartechstore;
   CREATE USER twoj_user WITH ENCRYPTED PASSWORD 'twoje_haslo';
   GRANT ALL PRIVILEGES ON DATABASE cartechstore TO twoj_user;
   
   # W pliku .env ustaw:
   # DB_DIALECT=postgresql
   # DB_HOST=localhost
   # DB_PORT=5432
   # DB_NAME=cartechstore
   # DB_USER=twoj_user
   # DB_PASSWORD=twoje_haslo
   ```

3. Wdrożenie aplikacji:
   ```bash
   # Klonowanie repozytorium
   git clone https://twoje-repo.git
   cd cartechstore
   
   # Instalacja zależności
   npm install
   
   # Budowanie aplikacji
   npm run build
   
   # Uruchomienie z PM2
   pm2 start dist/backend/server.js --name cartechstore
   pm2 save
   ```

4. Konfiguracja Nginx:
   ```nginx
   server {
       listen 80;
       server_name twoja-domena.pl;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. Konfiguracja SSL:
   ```bash
   # Instalacja Certbot
   sudo apt install -y certbot python3-certbot-nginx
   
   # Uzyskanie certyfikatu
   sudo certbot --nginx -d twoja-domena.pl
   ```

## Monitoring i utrzymanie

1. Monitorowanie aplikacji:
   ```bash
   # Podgląd logów
   pm2 logs cartechstore
   
   # Status aplikacji
   pm2 status
   
   # Restart aplikacji
   pm2 restart cartechstore
   ```

2. Backup bazy danych:

   **SQLite:**
   ```bash
   # Tworzenie backupu
   cp database.sqlite backup_$(date +%Y%m%d).sqlite
   
   # Przywracanie z backupu
   cp backup.sqlite database.sqlite
   ```

   **PostgreSQL:**
   ```bash
   # Tworzenie backupu
   pg_dump -U twoj_user cartechstore > backup_$(date +%Y%m%d).sql
   
   # Przywracanie z backupu
   psql -U twoj_user cartechstore < backup.sql
   ```

3. Aktualizacja aplikacji:
   ```bash
   # Pobranie zmian
   git pull
   
   # Instalacja zależności
   npm install
   
   # Budowanie
   npm run build
   
   # Restart aplikacji
   pm2 restart cartechstore
   ```

## Bezpieczeństwo

1. Regularnie aktualizuj system i zależności:
   ```bash
   sudo apt update && sudo apt upgrade -y
   npm audit fix
   ```

2. Monitoruj logi pod kątem podejrzanej aktywności:
   ```bash
   tail -f /var/log/nginx/access.log
   pm2 logs cartechstore
   ```

3. Wykonuj regularne backup'y bazy danych.

4. Używaj silnych haseł i regularnie je zmieniaj.

5. Włącz firewall i skonfiguruj tylko niezbędne porty:
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

## Rozwiązywanie problemów

1. Sprawdź logi aplikacji:
   ```bash
   pm2 logs cartechstore
   ```

2. Sprawdź logi Nginx:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Sprawdź status usług:
   ```bash
   sudo systemctl status nginx
   sudo systemctl status postgresql
   pm2 status
   ```

4. Sprawdź zużycie zasobów:
   ```bash
   htop
   df -h
   free -m
   ``` 