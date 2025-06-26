# 🆓 Gmail SMTP Setup - Darmowy System Email

## 📋 **KROKI KONFIGURACJI:**

### 1. **Włącz weryfikację 2-etapową w Gmail**
```
1. Idź do: https://myaccount.google.com/security
2. Znajdź "2-Step Verification" 
3. Kliknij "Get started"
4. Skonfiguruj weryfikację przez telefon
```

### 2. **Wygeneruj App Password**
```
1. Po włączeniu 2FA, idź do: https://myaccount.google.com/apppasswords
2. Wybierz "Mail" jako aplikacja
3. Wybierz "Other (custom name)" jako urządzenie
4. Wpisz: "Cartechstore B2B System"
5. Kliknij "Generate"
6. ZAPISZ hasło (16 znaków bez spacji)
```

### 3. **Dodaj do .env file**
```bash
# Gmail SMTP Configuration (FREE)
EMAIL_PROVIDER=gmail
GMAIL_USER=zabavchukmaks21@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop  # Twoje 16-znakowe hasło aplikacji
```

### 4. **Test systemu**
```bash
node test-gmail-system.js
```

## 🎯 **ZALETY GMAIL SMTP:**

✅ **Koszt**: 0 PLN (całkowicie darmowe)  
✅ **Limit**: 500 emaili dziennie (wystarczające dla B2B)  
✅ **Zasięg**: Wszystkie adresy email na świecie  
✅ **Niezawodność**: 99.9% uptime Google  
✅ **HTML**: Pełne wsparcie formatowania  
✅ **Załączniki**: Do 25MB  
✅ **Bezpieczeństwo**: OAuth2 + TLS  
✅ **Setup**: 5 minut konfiguracji  

## 📊 **PORÓWNANIE Z RESEND:**

| Feature | Gmail SMTP | Resend (Free) | Resend (Paid) |
|---------|------------|---------------|---------------|
| **Koszt** | 🆓 FREE | 🆓 FREE | 💰 $20/miesiąc |
| **Limit** | 500/dzień | 100/miesiąc | 50,000/miesiąc |
| **Wszystkie adresy** | ✅ TAK | ❌ Tylko admin | ✅ TAK |
| **HTML emails** | ✅ TAK | ✅ TAK | ✅ TAK |
| **Setup time** | 5 min | 2 min | 15 min + domain |

## 🚀 **WDROŻENIE:**

1. **Skonfiguruj Gmail** (instrukcje powyżej)
2. **Zmień provider** w systemie:
   ```javascript
   // W src/utils/email.js zastąp:
   const { sendEmail } = require('./email-gmail');
   ```
3. **Testuj**: `node test-gmail-system.js`
4. **Go live**: Wszystkie emaile będą działać!

## 🔧 **TROUBLESHOOTING:**

**Błąd "Invalid login":**
- Sprawdź czy masz włączoną 2FA
- Sprawdź czy App Password jest poprawne
- Sprawdź czy GMAIL_USER jest poprawny

**Błąd "Less secure apps":**
- Gmail nie używa już "less secure apps"
- Musisz użyć App Password (nie zwykłego hasła)

**Błąd "Daily limit exceeded":**
- Gmail SMTP ma limit 500 emaili/dzień
- Reset o północy czasu Pacific (Google)
- Dla większych wolumenów użyj SendGrid/Mailgun

## 💡 **ALTERNATYWNE DARMOWE OPCJE:**

### **SendGrid (Free tier):**
- 100 emaili/dzień za darmo
- Wymagana domena
- API key setup

### **Mailgun (Free tier):**
- 300 emaili/dzień za darmo (pierwsze 3 miesiące)
- Wymagana domena
- Credit card required

### **Gmail SMTP (ZALECANE):**
- 500 emaili/dzień za darmo
- Brak wymagań domeny
- Tylko App Password needed

---

**Dla Cartechstore B2B system Gmail SMTP jest idealny - prosty, darmowy, niezawodny!** 