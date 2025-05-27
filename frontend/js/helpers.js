// Uniwersalne helpery do użycia na każdej stronie

window.showToast = function(msg, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb';
  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => { toast.style.display = 'none'; }, 3000);
};

window.showLoader = function() {
  let loader = document.getElementById('loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'loader';
    loader.style.display = 'block';
    loader.innerHTML = '<div style="background:#fff;padding:2.5rem 2rem;border-radius:1.2rem;box-shadow:0 8px 32px #2563eb33;display:flex;align-items:center;gap:1.2rem;"><svg style="width:2.5rem;height:2.5rem;animation:spin 1s linear infinite;" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#2563eb" stroke-width="6" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)"/></svg><span style="font-size:1.2rem;font-weight:700;color:#2563eb;">Ładowanie...</span></div>';
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
};

window.hideLoader = function() {
  let loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
};

// Prosta walidacja formularza (wymagane pola)
window.validateForm = function(form) {
  if (!form.checkValidity()) {
    window.showToast('Proszę wypełnić wszystkie wymagane pola', 'error');
    return false;
  }
  return true;
}; 