
// Simple form validation
document.querySelector('form').addEventListener('submit', function(e) {
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    
    if (username.length < 3) {
        alert('Username must be at least 3 characters long');
        e.preventDefault();
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        e.preventDefault();
        return;
    }
});

// Password visibility toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🔒';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

// Escape key to go back to login page
document.addEventListener('keydown', function(e) {
    console.log('Key pressed:', e.key); // Debug log
    if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        window.location.href = '/login';
    }
});
