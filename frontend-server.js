const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5501;

// Enable CORS
app.use(cors());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve pages directory
app.use('/pages', express.static(path.join(__dirname, 'frontend/pages')));

// Default route - redirect to main index.html
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Frontend server running at http://localhost:${PORT}`);
    console.log(`📂 Serving files from: ${path.join(__dirname, 'frontend')}`);
    console.log(`🏠 Homepage: http://localhost:${PORT}/index.html`);
    console.log(`🔐 Admin login: http://localhost:${PORT}/pages/admin-login.html`);
    console.log(`👤 User login: http://localhost:${PORT}/pages/login.html`);
    console.log(`📝 B2B Registration: http://localhost:${PORT}/pages/b2b-registration.html`);
    console.log(`🛒 Customer Registration: http://localhost:${PORT}/pages/register-customer.html`);
});
