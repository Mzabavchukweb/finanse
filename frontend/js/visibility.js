document.addEventListener('DOMContentLoaded', function() {
    // Check login status and update visibility
    updateVisibility();

    // Listen for login status changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'isLoggedIn') {
            updateVisibility();
        }
    });
});

function updateVisibility() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const priceElements = document.querySelectorAll('.price');
    const stockElements = document.querySelectorAll('.stock');
    const loginPrompt = document.querySelector('.login-prompt');

    // Update price visibility
    priceElements.forEach(element => {
        if (isLoggedIn) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    });

    // Update stock visibility
    stockElements.forEach(element => {
        if (isLoggedIn) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    });

    // Show/hide login prompt
    if (loginPrompt) {
        if (!isLoggedIn) {
            loginPrompt.style.display = 'block';
        } else {
            loginPrompt.style.display = 'none';
        }
    }
}

// Function to check if user is logged in
function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Function to check if user is admin
function isUserAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.isAdmin === true;
}

// Function to get current user data
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
}

// Function to handle logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    updateVisibility();
    window.location.href = 'index.html';
} 