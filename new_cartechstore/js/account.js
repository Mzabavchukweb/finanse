document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    try {
        // Fetch user profile
        const response = await fetch('http://localhost:3005/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const userData = await response.json();

        // Update user information in the UI
        const userFullName = document.getElementById('userFullName');
        const userCompany = document.getElementById('userCompany');
        const userEmail = document.getElementById('userEmail');

        if (userFullName) {
            userFullName.textContent = `${userData.firstName} ${userData.lastName}`;
        }

        if (userCompany) {
            userCompany.textContent = userData.companyName || '';
        }

        if (userEmail) {
            userEmail.textContent = userData.email || '';
        }

        // Update page title with user's name
        document.title = `Panel klienta - ${userData.firstName} ${userData.lastName} - Cartechstore`;

        // Setup routing for different sections
        setupAccountRouting();

        // Load initial section based on hash
        handleHashChange();

        localStorage.setItem('token', token);
        window.loggedIn = true;

    } catch (error) {
        console.error('Error fetching user profile:', error);
        // If there's an error, redirect to login
        window.location.href = '/pages/login.html';
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        window.loggedIn = false;
    }
});

// Setup routing for account sections
function setupAccountRouting() {
    // Handle hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle menu item clicks
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                window.location.hash = href;
            }
        });
    });
}

// Handle hash changes and show appropriate section
function handleHashChange() {
    const hash = window.location.hash || '#dashboard';
    const section = hash.substring(1); // Remove # symbol
    
    // Update active menu item
    updateActiveMenuItem(hash);
    
    // Show appropriate content
    switch(section) {
        case 'orders':
            showOrdersSection();
            break;
        case 'dashboard':
        default:
            showDashboardSection();
            break;
    }
}

// Update active menu item
function updateActiveMenuItem(activeHash) {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === activeHash || (activeHash === '#dashboard' && !item.getAttribute('href').startsWith('#'))) {
            item.classList.add('active');
        }
    });
}

// Show dashboard section
function showDashboardSection() {
    const contentTitle = document.getElementById('welcomeTitle');
    const accountContent = document.querySelector('.account-content');
    
    if (contentTitle) {
        contentTitle.textContent = 'Panel główny';
    }
    
    // Show dashboard content
    accountContent.innerHTML = `
        <div class="content-header">
            <h1 class="content-title" id="welcomeTitle">Panel główny</h1>
            <div class="content-actions">
                <a href="/pages/profile-edit.html" class="action-btn btn-secondary">
                    <i class="fas fa-edit"></i>
                    Edytuj profil
                </a>
                <a href="/pages/catalog.html" class="action-btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Nowe zamówienie
                </a>
            </div>
        </div>

        <div class="stats-grid" id="statsGrid">
            <!-- Statystyki użytkownika -->
        </div>

        <div class="orders-section">
            <h2 class="section-title">Ostatnie zamówienia</h2>
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Numer zamówienia</th>
                        <th>Data</th>
                        <th>Wartość</th>
                        <th>Status</th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody id="ordersTableBody">
                    <!-- Zamówienia użytkownika lub komunikat o braku -->
                </tbody>
            </table>
            <div id="noOrdersMsg" style="display:none; text-align:center; color:#888; margin-top:1rem;">
                Nie masz jeszcze żadnych zamówień.
                <br><br>
                <a href="/pages/catalog.html" class="action-btn btn-primary">
                    <i class="fas fa-shopping-cart"></i>
                    Rozpocznij zakupy
                </a>
            </div>
        </div>
    `;
    
    // Load dashboard data
    loadDashboardData();
}

// Show orders section  
function showOrdersSection() {
    const accountContent = document.querySelector('.account-content');
    
    accountContent.innerHTML = `
        <div class="content-header">
            <h1 class="content-title">Moje zamówienia</h1>
            <div class="content-actions">
                <a href="/pages/catalog.html" class="action-btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Nowe zamówienie
                </a>
            </div>
        </div>

        <div class="orders-filters" style="margin-bottom: 2rem;">
            <div style="display: flex; gap: 1rem; align-items: center;">
                <select id="orderStatusFilter" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <option value="">Wszystkie statusy</option>
                    <option value="processing">W trakcie realizacji</option>
                    <option value="completed">Zrealizowane</option>
                    <option value="cancelled">Anulowane</option>
                </select>
                <input type="text" id="orderSearchInput" placeholder="Szukaj po numerze zamówienia..." 
                       style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 8px; flex: 1;">
            </div>
        </div>

        <div class="orders-table-container">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Numer zamówienia</th>
                        <th>Data</th>
                        <th>Wartość</th>
                        <th>Status</th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody id="allOrdersTableBody">
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 2rem;">
                            <i class="fas fa-spinner fa-spin"></i> Ładowanie zamówień...
                        </td>
                    </tr>
                </tbody>
            </table>
            <div id="noAllOrdersMsg" style="display:none; text-align:center; color:#888; margin-top:2rem; padding: 2rem;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <h3>Nie masz jeszcze żadnych zamówień</h3>
                <p>Rozpocznij zakupy w naszym katalogu części samochodowych</p>
                <br>
                <a href="/pages/catalog.html" class="action-btn btn-primary">
                    <i class="fas fa-shopping-cart"></i>
                    Przejdź do katalogu
                </a>
            </div>
        </div>
    `;
    
    // Load all orders
    loadAllOrders();
}

// Load dashboard data
async function loadDashboardData() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    try {
        // Fetch orders
        const ordersResponse = await fetch('http://localhost:3005/api/orders/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let orders = [];
        if (ordersResponse.ok) {
            orders = await ordersResponse.json();
        }
        
        // Update stats
        const statsGrid = document.getElementById('statsGrid');
        const activeCount = orders.filter(o => o.status === 'processing').length;
        const completedCount = orders.filter(o => o.status === 'completed').length;
        const totalValue = orders.reduce((sum, o) => sum + (parseFloat(o.value) || 0), 0);
        
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <i class="fas fa-shopping-cart stat-icon"></i>
                    <div class="stat-value" id="activeCount">0</div>
                    <div class="stat-label">Aktywne zamówienia</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-check-circle stat-icon"></i>
                    <div class="stat-value" id="completedCount">0</div>
                    <div class="stat-label">Zrealizowane zamówienia</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-chart-line stat-icon"></i>
                    <div class="stat-value" id="totalValue">0</div>
                    <div class="stat-label">Łączna wartość (PLN)</div>
                </div>
            `;
            
            // Animate counters
            setTimeout(() => {
                animateCount(document.getElementById('activeCount'), activeCount);
                animateCount(document.getElementById('completedCount'), completedCount);
                animateCount(document.getElementById('totalValue'), Math.round(totalValue));
            }, 100);
        }
        
        // Update recent orders table
        const ordersTableBody = document.getElementById('ordersTableBody');
        const noOrdersMsg = document.getElementById('noOrdersMsg');
        
        if (!orders || orders.length === 0) {
            if (noOrdersMsg) noOrdersMsg.style.display = 'block';
            if (ordersTableBody) ordersTableBody.style.display = 'none';
        } else {
            if (noOrdersMsg) noOrdersMsg.style.display = 'none';
            if (ordersTableBody) {
                ordersTableBody.style.display = '';
                ordersTableBody.innerHTML = orders.slice(0, 5).map(order => `
                    <tr>
                        <td>#${order.number || order.id}</td>
                        <td>${formatDate(order.createdAt || order.date)}</td>
                        <td>${formatPrice(order.value || order.total)}</td>
                        <td>
                            <span class="order-status ${getStatusClass(order.status)}">
                                <i class="fas ${getStatusIcon(order.status)}"></i>
                                ${getStatusName(order.status)}
                            </span>
                        </td>
                        <td><a href="order.html?id=${order.id}" class="view-order">Zobacz</a></td>
                    </tr>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show error message in stats
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card" style="grid-column: 1 / -1; text-align: center; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle stat-icon"></i>
                    <div>Błąd ładowania danych</div>
                </div>
            `;
        }
    }
}

// Load all orders for orders section
async function loadAllOrders() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:3005/api/orders/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let orders = [];
        if (response.ok) {
            orders = await response.json();
        }
        
        const allOrdersTableBody = document.getElementById('allOrdersTableBody');
        const noAllOrdersMsg = document.getElementById('noAllOrdersMsg');
        
        if (!orders || orders.length === 0) {
            if (allOrdersTableBody) allOrdersTableBody.style.display = 'none';
            if (noAllOrdersMsg) noAllOrdersMsg.style.display = 'block';
        } else {
            if (noAllOrdersMsg) noAllOrdersMsg.style.display = 'none';
            if (allOrdersTableBody) {
                allOrdersTableBody.style.display = '';
                allOrdersTableBody.innerHTML = orders.map(order => `
                    <tr>
                        <td>#${order.number || order.id}</td>
                        <td>${formatDate(order.createdAt || order.date)}</td>
                        <td>${formatPrice(order.value || order.total)}</td>
                        <td>
                            <span class="order-status ${getStatusClass(order.status)}">
                                <i class="fas ${getStatusIcon(order.status)}"></i>
                                ${getStatusName(order.status)}
                            </span>
                        </td>
                        <td><a href="order.html?id=${order.id}" class="view-order">Zobacz szczegóły</a></td>
                    </tr>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Error loading orders:', error);
        const allOrdersTableBody = document.getElementById('allOrdersTableBody');
        if (allOrdersTableBody) {
            allOrdersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: #ef4444;">
                        <i class="fas fa-exclamation-triangle"></i> Błąd ładowania zamówień
                    </td>
                </tr>
            `;
        }
    }
}

// Helper functions
function animateCount(el, to) {
    if (!el) return;
    let start = 0;
    const duration = 900;
    const step = Math.ceil(to / 30);
    function update() {
        start += step;
        if (start >= to) { 
            el.textContent = to;
            return; 
        }
        el.textContent = start;
        requestAnimationFrame(update);
    }
    update();
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('pl-PL');
    } catch {
        return dateString;
    }
}

function formatPrice(price) {
    if (!price) return '0,00 €';
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

function getStatusClass(status) {
    switch(status) {
        case 'completed': return 'status-completed';
        case 'processing': return 'status-processing';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-processing';
    }
}

function getStatusIcon(status) {
    switch(status) {
        case 'completed': return 'fa-check';
        case 'processing': return 'fa-clock';
        case 'cancelled': return 'fa-times';
        default: return 'fa-clock';
    }
}

function getStatusName(status) {
    switch(status) {
        case 'completed': return 'Zrealizowane';
        case 'processing': return 'W trakcie realizacji';
        case 'cancelled': return 'Anulowane';
        default: return 'W trakcie realizacji';
    }
} 