// ... (Keep the existing mock data and initial setup) ...

// DOM elements
const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const accountsSection = document.getElementById('accounts-section');
const transactionsSection = document.getElementById('transactions-section');
const loansSection = document.getElementById('loans-section');
const userNameSpan = document.getElementById('user-name');
const totalBalanceSpan = document.getElementById('total-balance');
const accountsList = document.getElementById('accounts-list');
const transactionsList = document.getElementById('transactions-list');
const mainNav = document.getElementById('main-nav');

// Event listeners
loginForm.addEventListener('submit', handleLogin);
document.getElementById('dashboard-link').addEventListener('click', showDashboard);
document.getElementById('accounts-link').addEventListener('click', showAccounts);
document.getElementById('transactions-link').addEventListener('click', showTransactions);
document.getElementById('loans-link').addEventListener('click', showLoans);
document.getElementById('logout-link').addEventListener('click', handleLogout);
document.getElementById('transfer-btn').addEventListener('click', showTransferModal);
document.getElementById('pay-bill-btn').addEventListener('click', showPayBillModal);

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        mainNav.style.display = 'block';
        showDashboard();
    } else {
        showError('Invalid username or password');
    }
}

function showDashboard() {
    hideAllSections();
    dashboardSection.classList.remove('hidden');
    userNameSpan.textContent = currentUser.name;
    const totalBalance = accounts
        .filter(a => a.userId === currentUser.id)
        .reduce((sum, account) => sum + account.balance, 0);
    totalBalanceSpan.textContent = totalBalance.toFixed(2);
}

function showAccounts() {
    hideAllSections();
    accountsSection.classList.remove('hidden');
    const userAccounts = accounts.filter(a => a.userId === currentUser.id);
    accountsList.innerHTML = userAccounts.map(account => `
        <div class="card">
            <h3>${account.type} Account</h3>
            <p>Balance: $${account.balance.toFixed(2)}</p>
            <button onclick="showAccountDetails(${account.id})">View Details</button>
        </div>
    `).join('');
}

function showTransactions() {
    hideAllSections();
    transactionsSection.classList.remove('hidden');
    const userAccountIds = accounts
        .filter(a => a.userId === currentUser.id)
        .map(a => a.id);
    const userTransactions = transactions.filter(t => userAccountIds.includes(t.accountId));
    transactionsList.innerHTML = userTransactions.map(transaction => `
        <div class="transaction-item">
            <span class="${transaction.type}">${transaction.type}</span>
            <span>$${transaction.amount.toFixed(2)}</span>
            <span>${transaction.date}</span>
        </div>
    `).join('');
}

function showLoans() {
    hideAllSections();
    loansSection.classList.remove('hidden');
    loansSection.innerHTML = `
        <div class="card">
            <h3>Available Loan Products</h3>
            <ul>
                <li>Personal Loan - Up to $50,000</li>
                <li>Home Loan - Up to $500,000</li>
                <li>Auto Loan - Up to $75,000</li>
            </ul>
            <button onclick="showLoanApplication()">Apply for a Loan</button>
        </div>
    `;
}

function handleLogout() {
    currentUser = null;
    hideAllSections();
    loginSection.classList.remove('hidden');
    mainNav.style.display = 'none';
    loginForm.reset();
}

function hideAllSections() {
    dashboardSection.classList.add('hidden');
    accountsSection.classList.add('hidden');
    transactionsSection.classList.add('hidden');
    loansSection.classList.add('hidden');
}

function showError(message) {
    alert(message); // Replace with a more user-friendly error display
}

function showTransferModal() {
    // Implement transfer functionality
    alert('Transfer feature coming soon!');
}

function showPayBillModal() {
    // Implement bill payment functionality
    alert('Bill payment feature coming soon!');
}

function showAccountDetails(accountId) {
    // Implement account details view
    alert(`Viewing details for account ${accountId}`);
}

function showLoanApplication() {
    // Implement loan application form
    alert('Loan application feature coming soon!');
}

// Initialize
mainNav.style.display = 'none';
