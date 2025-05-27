document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // Fetch user profile
        const response = await fetch('/api/auth/profile', {
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

        if (userFullName) {
            userFullName.textContent = `${userData.firstName} ${userData.lastName}`;
        }

        if (userCompany) {
            userCompany.textContent = userData.companyName;
        }

        // Update page title with user's name
        document.title = `Panel klienta - ${userData.firstName} ${userData.lastName} - Cartechstore`;

        // Wyświetlanie ostatnio przeglądanych produktów
        const viewedSection = document.getElementById('viewedProductsSection');
        if (viewedSection) {
            const viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
            if (viewed.length === 0) {
                viewedSection.innerHTML = '<p>Brak ostatnio przeglądanych produktów.</p>';
            } else {
                viewedSection.innerHTML = viewed.map(p => `
                    <div class="viewed-product-item">
                        <img src="${p.image}" alt="${p.name}" style="width:60px;height:40px;object-fit:contain;">
                        <div style="flex:1;">
                            <div class="product-name">${p.name}</div>
                            <div class="product-number">${p.number}</div>
                            <div class="product-price">${p.price}</div>
                        </div>
                        <a href="/product.html?number=${encodeURIComponent(p.number)}" class="btn-primary" style="margin-left:1rem;">Zobacz</a>
                    </div>
                `).join('');
            }
        }

    } catch (error) {
        console.error('Error fetching user profile:', error);
        // If there's an error, redirect to login
        window.location.href = '/login.html';
    }
}); 