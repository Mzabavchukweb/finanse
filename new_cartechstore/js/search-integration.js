// Search Integration for Cartechstore
// Unified search functionality across all pages

class SearchManager {
    constructor() {
        this.searchEndpoint = 'http://localhost:3005/api/products/search';
        this.categoriesEndpoint = 'http://localhost:3005/api/categories';
        this.brandsEndpoint = 'http://localhost:3005/api/brands';
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }
    
    async init() {
        // Initialize search functionality on all pages
        this.setupHeaderSearch();
        this.setupMobileSearch();
        this.loadCategories();
        this.loadBrands();
        
        // Set up real-time search suggestions
        this.setupSearchSuggestions();
    }
    
    setupHeaderSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.redirectToSearch(e.target.value);
                }
            });
        }
    }
    
    setupMobileSearch() {
        const mobileSearchBtn = document.getElementById('nav-search');
        if (mobileSearchBtn) {
            mobileSearchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    }
    
    async loadCategories() {
        try {
            const cached = this.getFromCache('categories');
            if (cached) {
                this.categories = cached;
                return;
            }
            
            const response = await fetch(this.categoriesEndpoint);
            if (response.ok) {
                const categories = await response.json();
                this.categories = categories;
                this.setCache('categories', categories);
                this.updateCategorySelectors();
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            // Fallback categories
            this.categories = [
                { id: 1, name: 'Hamulce', slug: 'hamulce' },
                { id: 2, name: 'Filtry', slug: 'filtry' },
                { id: 3, name: 'Oleje', slug: 'oleje' },
                { id: 4, name: 'Zawieszenie', slug: 'zawieszenie' },
                { id: 5, name: 'Silnik', slug: 'silnik' },
                { id: 6, name: 'Układ wydechowy', slug: 'wydech' },
                { id: 7, name: 'Elektryka', slug: 'elektryka' },
                { id: 8, name: 'Klimatyzacja', slug: 'klimatyzacja' }
            ];
        }
    }
    
    async loadBrands() {
        try {
            const cached = this.getFromCache('brands');
            if (cached) {
                this.brands = cached;
                return;
            }
            
            const response = await fetch(this.brandsEndpoint);
            if (response.ok) {
                const brands = await response.json();
                this.brands = brands;
                this.setCache('brands', brands);
                this.updateBrandSelectors();
            }
        } catch (error) {
            console.error('Failed to load brands:', error);
            // Fallback brands
            this.brands = [
                { id: 1, name: 'Audi', slug: 'audi' },
                { id: 2, name: 'BMW', slug: 'bmw' },
                { id: 3, name: 'Mercedes', slug: 'mercedes' },
                { id: 4, name: 'Volkswagen', slug: 'volkswagen' },
                { id: 5, name: 'Ford', slug: 'ford' },
                { id: 6, name: 'Opel', slug: 'opel' },
                { id: 7, name: 'Renault', slug: 'renault' },
                { id: 8, name: 'Peugeot', slug: 'peugeot' }
            ];
        }
    }
    
    updateCategorySelectors() {
        const categorySelects = document.querySelectorAll('select[name="category"], .category-filter');
        categorySelects.forEach(select => {
            if (select.tagName === 'SELECT') {
                // Clear existing options except first
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                // Add categories
                this.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.slug;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        });
    }
    
    updateBrandSelectors() {
        const brandSelects = document.querySelectorAll('select[name="brand"], .brand-filter');
        brandSelects.forEach(select => {
            if (select.tagName === 'SELECT') {
                // Clear existing options except first
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                // Add brands
                this.brands.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.slug;
                    option.textContent = brand.name;
                    select.appendChild(option);
                });
            }
        });
    }
    
    setupSearchSuggestions() {
        const searchInputs = document.querySelectorAll('.search-input, input[type="search"]');
        searchInputs.forEach(input => {
            const suggestionsContainer = this.createSuggestionsContainer(input);
            
            input.addEventListener('input', this.debounce(async (e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    const suggestions = await this.getSuggestions(query);
                    this.showSuggestions(suggestionsContainer, suggestions, query);
                } else {
                    this.hideSuggestions(suggestionsContainer);
                }
            }, 200));
            
            input.addEventListener('blur', () => {
                setTimeout(() => this.hideSuggestions(suggestionsContainer), 150);
            });
        });
    }
    
    createSuggestionsContainer(input) {
        const container = document.createElement('div');
        container.className = 'search-suggestions';
        container.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 1000;
            display: none;
            max-height: 300px;
            overflow-y: auto;
        `;
        
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(container);
        
        return container;
    }
    
    async getSuggestions(query) {
        try {
            const cacheKey = `suggestions_${query}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;
            
            const response = await fetch(`${this.searchEndpoint}?q=${encodeURIComponent(query)}&limit=8`);
            if (response.ok) {
                const results = await response.json();
                this.setCache(cacheKey, results, 60000); // 1 minute cache
                return results;
            }
        } catch (error) {
            console.error('Failed to get suggestions:', error);
        }
        
        return [];
    }
    
    showSuggestions(container, suggestions, query) {
        if (!suggestions.length) {
            this.hideSuggestions(container);
            return;
        }
        
        container.innerHTML = suggestions.map(item => `
            <div class="suggestion-item" data-url="catalog.html?search=${encodeURIComponent(item.name)}" 
                 style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s;">
                <div style="font-weight: 600; color: #1f2937;">${this.highlightMatch(item.name, query)}</div>
                <div style="font-size: 0.8rem; color: #6b7280;">${item.category || ''} ${item.brand || ''}</div>
                <div style="font-size: 0.9rem; color: #2563eb; font-weight: 600;">${item.price ? `${item.price} EUR` : 'Zapytaj o cenę'}</div>
            </div>
        `).join('');
        
        // Add hover effects and click handlers
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = '#f3f4f6';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'white';
            });
            
            item.addEventListener('click', () => {
                window.location.href = item.dataset.url;
            });
        });
        
        container.style.display = 'block';
    }
    
    hideSuggestions(container) {
        container.style.display = 'none';
    }
    
    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark style="background: #fbbf24; padding: 0 0.2em;">$1</mark>');
    }
    
    redirectToSearch(query) {
        if (query.trim()) {
            window.location.href = `catalog.html?search=${encodeURIComponent(query.trim())}`;
        }
    }
    
    async handleSearch(query) {
        if (window.location.pathname.includes('catalog.html')) {
            // If we're on catalog page, trigger live search
            if (window.catalogSearch && typeof window.catalogSearch.performSearch === 'function') {
                window.catalogSearch.performSearch(query);
            }
        }
    }
    
    // Cache management
    setCache(key, data, expiry = this.cacheExpiry) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiry
        });
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < cached.expiry) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    // Utility function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // API to refresh data when admin adds new items
    refreshData() {
        this.clearCache();
        this.loadCategories();
        this.loadBrands();
    }
}

// Initialize search manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});

// Expose refresh function for admin panel
window.refreshSearchData = () => {
    if (window.searchManager) {
        window.searchManager.refreshData();
    }
}; 