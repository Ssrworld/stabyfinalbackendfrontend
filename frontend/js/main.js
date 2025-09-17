document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000'; // Your backend URL

    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const messageEl = document.getElementById('message');
    
    // Event Listeners
    registerBtn.addEventListener('click', handleRegister);
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Functions
    async function handleRegister() {
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        messageEl.textContent = data.message;
    }

    async function handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        messageEl.textContent = data.message;

        if (data.token) {
            localStorage.setItem('token', data.token);
            showDashboard();
        }
    }

    function handleLogout() {
        localStorage.removeItem('token');
        showAuth();
    }

    function showDashboard() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        // In a real app, you would fetch user data here and populate the dashboard
        messageEl.textContent = 'Logged in successfully!';
    }

    function showAuth() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
        messageEl.textContent = 'You have been logged out.';
    }

    // Check if user is already logged in
    if (localStorage.getItem('token')) {
        showDashboard();
    }
});