# 🔧 INSTRUKCJE KONFIGURACJI GMAIL - NATYCHMIASTOWA NAPRAWA EMAILI

## ⚠️ **OBECNIE EMAIL NIE DZIAŁA BO:**
Gmail odrzuca logowanie - potrzebne jest **App Password** zamiast zwykłego hasła.

## 🎯 **5-MINUTOWA NAPRAWA:**

### **KROK 1: Włącz weryfikację 2-etapową**
1. Idź na: https://myaccount.google.com/security
2. Znajdź "2-Step Verification" 
3. Kliknij "Get started"
4. Skonfiguruj przez telefon (SMS lub aplikacja)

### **KROK 2: Wygeneruj App Password**
1. Po włączeniu 2FA, idź na: https://myaccount.google.com/apppasswords
2. Wybierz "Mail" jako aplikacja
3. Wybierz "Other (custom name)" jako urządzenie
4. Wpisz: "Cartechstore"
5. Kliknij "Generate"
6. **SKOPIUJ 16-znakowe hasło** (np: abcd efgh ijkl mnop)

### **KROK 3: Aktualizuj .env**
Otwórz plik `.env` i zmień:
```bash
GMAIL_APP_PASSWORD=your_app_password_here
```
na:
```bash
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```
(wstaw swoje 16-znakowe hasło)

### **KROK 4: Restart serwera**
```bash
pkill -f "node.*server.js"
npm start
```

### **KROK 5: Test emaila**
Idź do panelu admin → Ustawienia → Test Email

---

## 🚨 **ALTERNATYWA: UŻYJ RESEND (JUŻ SKONFIGUROWANE)**

Jeśli nie chcesz konfigurować Gmail, użyj Resend:

1. **Zmień provider** w pliku `backend/src/utils/email.js`:
   ```javascript
   // Zmień z:
   const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'gmail';
   
   // Na:
   const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend';
   ```

2. **Aktualizuj .env**:
   ```bash
   EMAIL_PROVIDER=resend
   ```

3. **Restart serwera**

---

## ✅ **PO NAPRAWIE:**
- Emaile rejestracyjne będą działać
- Powiadomienia admin będą działać
- Reset haseł będzie działać
- Test email będzie działać

## 🔍 **SPRAWDZENIE CZY DZIAŁA:**
Po konfiguracji sprawdź logi serwera - powinieneś zobaczyć:
```
✅ Email wysłany przez Gmail do email@example.com: messageId
```
zamiast:
```
❌ Gmail SMTP error: Invalid login
``` 