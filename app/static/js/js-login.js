
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

// Form submission loading state
document.getElementById('loginForm').addEventListener('submit', function(e) {
    const btn = document.getElementById('loginBtn');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    console.log('Form submitted:', { username, hasPassword: !!password });
    
    if (!username || !password) {
        e.preventDefault();
        alert('Please enter both username and password');
        return;
    }
    
    btn.classList.add('loading');
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    
    // Re-enable after 5 seconds (in case of error)
    setTimeout(() => {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.textContent = 'Login';
    }, 5000);
});

// Add focus effects
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
});

// Auto-focus username field
document.getElementById('username').focus();

// Escape key to go back to index page
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        window.location.href = '/';
    }
});
