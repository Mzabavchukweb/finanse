#!/bin/bash

# Generate secure random keys
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

# Create .env file
cat > .env << EOF
# Application
NODE_ENV=development
PORT=3005
FRONTEND_URL=http://localhost:5500

# Database
DATABASE_URL=sqlite:///database.sqlite

# JWT Authentication
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
EMAIL_FROM=noreply@cartechstore.pl
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Security
SESSION_SECRET=$SESSION_SECRET
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
RECAPTCHA_SITE_KEY=your_recaptcha_site

# Admin Configuration
ADMIN_EMAIL=admin@cartechstore.pl
ADMIN_PASSWORD=Admin123!@#
EOF

echo "✅ Plik .env został utworzony!"
echo "⚠️  WAŻNE: Uzupełnij następujące dane:"
echo "   - SMTP_USER i SMTP_PASS - dane do wysyłania emaili"
echo "   - STRIPE_SECRET_KEY i STRIPE_PUBLISHABLE_KEY - klucze Stripe"
echo "   - RECAPTCHA_SECRET_KEY i RECAPTCHA_SITE_KEY - klucze reCAPTCHA" 