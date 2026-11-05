const STORAGE_KEY = "expenseTrackerTransactions";
const THEME_KEY = "expenseTrackerTheme";
const CURRENCY_KEY = "expenseTrackerCurrency";

const form = document.querySelector("#transactionForm");
const transactionList = document.querySelector("#transactionList");
const transactionCount = document.querySelector("#transactionCount");
const themeToggle = document.querySelector("#themeToggle");
const currencyToggle = document.querySelector("#currencyToggle");
const dateInput = document.querySelector("#transactionDate");
const monthFilter = document.querySelector("#monthFilter");

let currentUser = null;
let transactions = [];
let currency = localStorage.getItem(CURRENCY_KEY) || "INR";
let selectedMonth = new Date().toISOString().slice(0, 7);

function transactionsForSelectedMonth() {
    return transactions.filter(transaction => transaction.date.slice(0, 7) === selectedMonth);
}

function accountStorageKey() {
    if (!currentUser) return null;
    return `${STORAGE_KEY}:${encodeURIComponent(`${currentUser.name}\n${currentUser.password}`)}`;
}

function loadTransactions() {
    const storageKey = accountStorageKey();
    if (!storageKey) return [];
    try {
        return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch {
        return [];
    }
}

function saveTransactions() {
    const storageKey = accountStorageKey();
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(transactions));
}

function migrateLegacyTransactions() {
    const storageKey = accountStorageKey();
    if (!storageKey || localStorage.getItem(storageKey) !== null) return;

    try {
        const legacyTransactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(legacyTransactions) && legacyTransactions.length) {
            localStorage.setItem(storageKey, JSON.stringify(legacyTransactions));
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        localStorage.removeItem(STORAGE_KEY);
    }
}

function currencySymbol() {
    return currency === "INR" ? "₹" : "$";
}

function formatMoney(amount) {
    return `${currencySymbol()}${Number(amount).toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatDate(dateString) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function updateDashboard() {
    const monthlyTransactions = transactionsForSelectedMonth();
    const income = monthlyTransactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);
    const expense = monthlyTransactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);
    const investments = monthlyTransactions
        .filter(transaction => transaction.type === "investment")
        .reduce((total, transaction) => total + transaction.amount, 0);

    document.querySelector("#incomeTotal").textContent = formatMoney(income);
    document.querySelector("#expenseTotal").textContent = formatMoney(expense);
    document.querySelector("#investmentTotal").textContent = formatMoney(investments);
    document.querySelector("#balanceTotal").textContent = formatMoney(income - expense - investments);
    document.querySelector("#amountCurrency").textContent = currencySymbol();
    transactionCount.textContent = `${monthlyTransactions.length} ${monthlyTransactions.length === 1 ? "entry" : "entries"}`;
}

function renderTransactions() {
    const monthlyTransactions = transactionsForSelectedMonth();
    if (!monthlyTransactions.length) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-xmark" aria-hidden="true"></i>
                No transactions for the selected month.
            </div>`;
        return;
    }

    transactionList.innerHTML = [...monthlyTransactions]
        .sort((first, second) => second.date.localeCompare(first.date) || second.id - first.id)
        .map(transaction => {
            const isIncome = transaction.type === "income";
            const isInvestment = transaction.type === "investment";
            const sign = isIncome ? "+" : "−";
            const icon = isIncome ? "fa-arrow-down" : isInvestment ? "fa-chart-line" : "fa-arrow-up";
            return `
                <article class="transaction-item ${transaction.type}">
                    <div class="type-icon"><i class="fa-solid ${icon}" aria-hidden="true"></i></div>
                    <div class="transaction-info">
                        <strong>${escapeHtml(transaction.description)}</strong>
                        <span class="transaction-date"><i class="fa-solid fa-calendar-days" aria-hidden="true"></i>${formatDate(transaction.date)}</span>
                    </div>
                    <strong class="transaction-value">${sign}${formatMoney(transaction.amount)}</strong>
                    <button class="delete-button" type="button" data-id="${transaction.id}" aria-label="Delete ${escapeHtml(transaction.description)}">
                        <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                    </button>
                </article>`;
        }).join("");
}

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
}

function render() {
    updateDashboard();
    renderTransactions();
}

form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const description = data.get("description").trim();

    if (!description || !Number.isFinite(amount) || amount <= 0) return;

    transactions.push({
        id: Date.now(),
        description,
        amount,
        date: data.get("transactionDate"),
        type: data.get("transactionType")
    });

    saveTransactions();
    selectedMonth = data.get("transactionDate").slice(0, 7);
    monthFilter.value = selectedMonth;
    form.reset();
    dateInput.valueAsDate = new Date();
    render();
});

transactionList.addEventListener("click", event => {
    const button = event.target.closest(".delete-button");
    if (!button) return;
    transactions = transactions.filter(transaction => transaction.id !== Number(button.dataset.id));
    saveTransactions();
    render();
});

function applyTheme(theme) {
    document.body.classList.toggle("dark", theme === "dark");
    const isDark = theme === "dark";
    themeToggle.innerHTML = `<i class="fa-solid ${isDark ? "fa-sun" : "fa-moon"}" aria-hidden="true"></i>`;
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    document.querySelector('meta[name="theme-color"]').content = isDark ? "#11151d" : "#eef3f8";
}

themeToggle.addEventListener("click", () => {
    const theme = document.body.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
});

function applyCurrency() {
    currencyToggle.classList.toggle("dollar", currency === "USD");
    currencyToggle.setAttribute("aria-label", `Switch currency; currently ${currency}`);
    render();
}

currencyToggle.addEventListener("click", () => {
    currency = currency === "INR" ? "USD" : "INR";
    localStorage.setItem(CURRENCY_KEY, currency);
    applyCurrency();
});

monthFilter.addEventListener("change", () => {
    if (!monthFilter.value) return;
    selectedMonth = monthFilter.value;
    render();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
}

const savedTheme = localStorage.getItem(THEME_KEY) || "light";
dateInput.valueAsDate = new Date();
monthFilter.value = selectedMonth;
applyTheme(savedTheme);
applyCurrency();

const USERS_KEY = "expenseTrackerUsersJSON";
const SESSION_KEY = "expenseTrackerSession";
const authScreen = document.querySelector("#authScreen");
const appShell = document.querySelector("#appShell");
const signInForm = document.querySelector("#signInForm");
const signUpForm = document.querySelector("#signUpForm");
const signInMessage = document.querySelector("#signInMessage");
const signUpMessage = document.querySelector("#signUpMessage");

function loadUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setAuthView(view) {
    const signingIn = view === "signin";
    signInForm.classList.toggle("hidden", !signingIn);
    signUpForm.classList.toggle("hidden", signingIn);
    document.querySelector("#signInTab").classList.toggle("active", signingIn);
    document.querySelector("#signUpTab").classList.toggle("active", !signingIn);
    document.querySelector("#authSwitch").textContent = signingIn ? "New user? Sign up" : "Already registered? Sign in";
    signInMessage.textContent = "";
    signUpMessage.textContent = "";
}

document.querySelectorAll("[data-auth-view]").forEach(button => {
    button.addEventListener("click", () => setAuthView(button.dataset.authView));
});

document.querySelector("#authSwitch").addEventListener("click", () => {
    const signingIn = !signInForm.classList.contains("hidden");
    setAuthView(signingIn ? "signup" : "signin");
});

signInForm.querySelector(".auth-password-toggle").addEventListener("click", event => {
    const passwordInput = document.querySelector("#signInPassword");
    const revealing = passwordInput.type === "password";
    passwordInput.type = revealing ? "text" : "password";
    event.currentTarget.classList.toggle("fa-eye", !revealing);
    event.currentTarget.classList.toggle("fa-eye-slash", revealing);
});

signUpForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = document.querySelector("#registerName").value.trim();
    const password = document.querySelector("#registerPassword").value;
    const mobile = document.querySelector("#registerMobile").value.trim();
    const users = loadUsers();

    if (users.length >= 1000) {
        signUpMessage.className = "auth-message";
        signUpMessage.textContent = "Registration limit reached. Maximum 1000 users are allowed.";
        return;
    }

    const duplicateAccount = users.some(account => account.name === name && account.password === password);
    if (duplicateAccount) {
        signUpMessage.className = "auth-message";
        signUpMessage.textContent = "An account with this Name and Password already exists.";
        return;
    }

    users.push({ name, password, mobile });
    saveUsers(users);
    signUpMessage.className = "auth-message success";
    signUpMessage.textContent = "Registration successful. Please sign in.";
    signUpForm.reset();
    setTimeout(() => setAuthView("signin"), 900);
});

signInForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = document.querySelector("#signInName").value.trim();
    const password = document.querySelector("#signInPassword").value;
    const user = loadUsers().find(account => account.name === name && account.password === password);

    if (!user) {
        signInMessage.textContent = "Name or password does not match.";
        return;
    }

    currentUser = { name: user.name, password: user.password, mobile: user.mobile };
    migrateLegacyTransactions();
    transactions = loadTransactions();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, password: user.password, mobile: user.mobile }));
    showDashboard();
    render();
});

document.querySelector("#clearAllButton").addEventListener("click", () => {
    if (!transactions.length) return;
    if (!window.confirm("Clear all transactions for this account?")) return;

    transactions = [];
    saveTransactions();
    render();
});

document.querySelector("#logoutButton").addEventListener("click", () => {
    saveTransactions();
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    transactions = [];
    render();
    document.querySelector("#welcomeMessage").textContent = "";
    authScreen.classList.remove("hidden");
    appShell.classList.add("hidden");
    signInForm.reset();
    signInMessage.textContent = "";
});

function showDashboard() {
    authScreen.classList.add("hidden");
    appShell.classList.remove("hidden");
    document.querySelector("#welcomeMessage").textContent = currentUser ? `Welcome, ${currentUser.name}` : "";
    render();
}

function initializeAuthentication() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));
        const user = session && loadUsers().find(account =>
            account.name === session.name && account.password === session.password
        );
        if (user) {
            currentUser = { name: user.name, password: user.password, mobile: user.mobile };
            migrateLegacyTransactions();
            transactions = loadTransactions();
            showDashboard();
            return;
        }
    } catch {
        localStorage.removeItem(SESSION_KEY);
    }

    authScreen.classList.remove("hidden");
    appShell.classList.add("hidden");
    setAuthView(loadUsers().length ? "signin" : "signup");
}

initializeAuthentication();
