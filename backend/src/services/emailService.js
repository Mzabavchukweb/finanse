const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'biuro@cartechstore.pl',
                pass: process.env.EMAIL_PASS || 'your-app-password'
            }
        });
    }

    // Base email template
    getBaseTemplate(content, title = 'Cartechstore') {
        return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px 20px;
        }
        .order-details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .order-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .order-item:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #2563eb;
        }
        .btn {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-processing { background: #dbeafe; color: #1e40af; }
        .status-shipped { background: #d1fae5; color: #065f46; }
        .status-delivered { background: #dcfce7; color: #14532d; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .footer {
            background: #f3f4f6;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .contact-info {
            margin: 15px 0;
        }
        .contact-info a {
            color: #2563eb;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .container { margin: 10px; }
            .header, .content { padding: 20px 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
        <div class="footer">
            <div class="contact-info">
                <strong>Cartechstore SP. Z O.O.</strong><br>
                ul. Przemysłowa 15, 70-800 Szczecin<br>
                Tel: <a href="tel:+48911234567">+48 91 123 45 67</a><br>
                Email: <a href="mailto:biuro@cartechstore.pl">biuro@cartechstore.pl</a>
            </div>
            <p>© 2024 Cartechstore. Wszystkie prawa zastrzeżone.</p>
        </div>
    </div>
</body>
</html>`;
    }

    // Order confirmation email
    async sendOrderConfirmation(order, userEmail) {
        const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderItems = order.items.map(item =>
            `<div class="order-item">
                <span>${item.product?.name || item.name} (${item.quantity}x)</span>
                <span>${(item.price * item.quantity).toFixed(2)} €</span>
            </div>`
        ).join('');

        const content = `
            <div class="header">
                <h1>🎉 Dziękujemy za zamówienie!</h1>
                <p>Twoje zamówienie zostało przyjęte i jest przetwarzane</p>
            </div>
            <div class="content">
                <h2>Zamówienie #${order.id}</h2>
                <p><strong>Data złożenia:</strong> ${new Date(order.createdAt).toLocaleDateString('pl-PL')}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${order.status}">Oczekuje</span></p>
                
                <div class="order-details">
                    <h3>Szczegóły zamówienia:</h3>
                    ${orderItems}
                    <div class="order-item">
                        <span><strong>RAZEM</strong></span>
                        <span><strong>${orderTotal.toFixed(2)} €</strong></span>
                    </div>
                </div>

                <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h4>📦 Co dalej?</h4>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>Przetwarzamy Twoje zamówienie</li>
                        <li>Przygotowujemy produkty do wysyłki</li>
                        <li>Otrzymasz email z numerem przesyłki</li>
                        <li>Dostawa w ciągu 1-3 dni roboczych</li>
                    </ul>
                </div>

                <a href="${process.env.FRONTEND_URL}/pages/order-details.html?id=${order.id}" class="btn">
                    Zobacz szczegóły zamówienia
                </a>

                <p>Jeśli masz pytania, skontaktuj się z nami odpowiadając na tego emaila.</p>
            </div>
        `;

        const mailOptions = {
            from: `"Cartechstore" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `✅ Potwierdzenie zamówienia #${order.id} - Cartechstore`,
            html: this.getBaseTemplate(content, `Potwierdzenie zamówienia #${order.id}`)
        };

        return this.transporter.sendMail(mailOptions);
    }

    // Order status update email
    async sendOrderStatusUpdate(order, userEmail, oldStatus, newStatus) {
        const statusMessages = {
            processing: {
                icon: '⚙️',
                title: 'Zamówienie w realizacji',
                message: 'Przygotowujemy Twoje produkty do wysyłki'
            },
            shipped: {
                icon: '🚚',
                title: 'Zamówienie wysłane',
                message: 'Twoja przesyłka jest w drodze!'
            },
            delivered: {
                icon: '✅',
                title: 'Zamówienie dostarczone',
                message: 'Twoje zamówienie zostało dostarczone'
            },
            cancelled: {
                icon: '❌',
                title: 'Zamówienie anulowane',
                message: 'Twoje zamówienie zostało anulowane'
            }
        };

        const statusInfo = statusMessages[newStatus] || {
            icon: '📋',
            title: 'Aktualizacja zamówienia',
            message: `Status zmieniony na: ${newStatus}`
        };

        const trackingInfo = newStatus === 'shipped' ? `
            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4>📍 Śledzenie przesyłki</h4>
                <p>Numer przesyłki: <strong>CT${order.id}${Date.now().toString().slice(-6)}</strong></p>
                <p>Przewoźnik: DPD</p>
                <a href="https://trackcreative.cloud/pl/CT${order.id}" style="color: #059669;">
                    Śledź przesyłkę →
                </a>
            </div>
        ` : '';

        const content = `
            <div class="header">
                <h1>${statusInfo.icon} ${statusInfo.title}</h1>
                <p>${statusInfo.message}</p>
            </div>
            <div class="content">
                <h2>Zamówienie #${order.id}</h2>
                <p><strong>Nowy status:</strong> <span class="status-badge status-${newStatus}">${newStatus}</span></p>
                <p><strong>Data aktualizacji:</strong> ${new Date().toLocaleDateString('pl-PL')}</p>
                
                ${trackingInfo}

                <a href="${process.env.FRONTEND_URL}/pages/order-details.html?id=${order.id}" class="btn">
                    Zobacz szczegóły zamówienia
                </a>

                <p>Dziękujemy za zaufanie i zakupy w Cartechstore!</p>
            </div>
        `;

        const mailOptions = {
            from: `"Cartechstore" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `${statusInfo.icon} ${statusInfo.title} #${order.id} - Cartechstore`,
            html: this.getBaseTemplate(content, statusInfo.title)
        };

        return this.transporter.sendMail(mailOptions);
    }

    // Welcome email for new users
    async sendWelcomeEmail(user) {
        const isB2B = user.companyName ? true : false;
        const welcomeType = isB2B ? 'firmowe' : 'indywidualne';

        const content = `
            <div class="header">
                <h1>🎉 Witaj w Cartechstore!</h1>
                <p>Dziękujemy za założenie konta ${welcomeType}</p>
            </div>
            <div class="content">
                <h2>Cześć ${user.firstName}!</h2>
                
                <p>Cieszymy się, że dołączyłeś do grona naszych klientów. Twoje konto zostało pomyślnie utworzone.</p>

                ${isB2B ? `
                <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h4>🏢 Konto firmowe - ${user.companyName}</h4>
                    <p>Twoje konto B2B zostanie zweryfikowane w ciągu 24 godzin. Po weryfikacji otrzymasz dostęp do:</p>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>Specjalne ceny hurtowe</li>
                        <li>Odroczone terminy płatności</li>
                        <li>Dedykowany opiekun handlowy</li>
                        <li>Przejrzysty panel B2B</li>
                    </ul>
                </div>
                ` : `
                <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h4>🛒 Twoje korzyści</h4>
                    <ul style="margin-left: 20px; margin-top: 10px;">
                        <li>Szybkie składanie zamówień</li>
                        <li>Historia zakupów</li>
                        <li>Lista życzeń</li>
                        <li>Promocje dla stałych klientów</li>
                    </ul>
                </div>
                `}

                <a href="${process.env.FRONTEND_URL}/pages/catalog.html" class="btn">
                    Rozpocznij zakupy
                </a>

                <p>Jeśli masz jakiekolwiek pytania, nie wahaj się skontaktować z naszym zespołem.</p>
            </div>
        `;

        const mailOptions = {
            from: `"Cartechstore" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `🎉 Witaj w Cartechstore - ${isB2B ? 'Konto B2B' : 'Konto utworzone'}`,
            html: this.getBaseTemplate(content, 'Witaj w Cartechstore')
        };

        return this.transporter.sendMail(mailOptions);
    }

    // Newsletter confirmation
    async sendNewsletterConfirmation(email) {
        const content = `
            <div class="header">
                <h1>📧 Newsletter Cartechstore</h1>
                <p>Dziękujemy za zapisanie się do naszego newslettera!</p>
            </div>
            <div class="content">
                <h2>Zostałeś dodany do naszej listy!</h2>
                
                <p>Od teraz będziesz otrzymywać:</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <ul style="margin-left: 20px;">
                        <li>🏷️ Ekskluzywne promocje i rabaty</li>
                        <li>🆕 Informacje o nowych produktach</li>
                        <li>📰 Porady techniczne i artykuły</li>
                        <li>🎯 Oferty dostosowane do Twoich potrzeb</li>
                    </ul>
                </div>

                <p>Nie wysyłamy spamu - tylko wartościowe treści dla motoryzacyjnych profesjonalistów.</p>
                
                <a href="${process.env.FRONTEND_URL}/pages/newsletter-unsubscribe.html?email=${encodeURIComponent(email)}" 
                   style="color: #6b7280; font-size: 14px; text-decoration: none;">
                    Zrezygnuj z newslettera
                </a>
            </div>
        `;

        const mailOptions = {
            from: `"Cartechstore Newsletter" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '📧 Potwierdzenie zapisu do newslettera - Cartechstore',
            html: this.getBaseTemplate(content, 'Newsletter Cartechstore')
        };

        return this.transporter.sendMail(mailOptions);
    }

    // Test email function
    async sendTestEmail(to = 'test@example.com') {
        const content = `
            <div class="header">
                <h1>🧪 Test Email</h1>
                <p>System email notifications działa poprawnie!</p>
            </div>
            <div class="content">
                <h2>Email Service Test</h2>
                <p>Jeśli otrzymujesz ten email, oznacza to, że system email notifications dla Cartechstore działa poprawnie.</p>
                <p><strong>Czas wysłania:</strong> ${new Date().toLocaleString('pl-PL')}</p>
            </div>
        `;

        const mailOptions = {
            from: `"Cartechstore Test" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: '🧪 Test Email - Cartechstore Email Service',
            html: this.getBaseTemplate(content, 'Test Email')
        };

        return this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService();
