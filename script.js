class CouplePointsApp {
    constructor() {
        this.currentUser = null;
        this.coupleData = null;
        this.selectedPoints = 0;
        
        // Initialize secure data manager
        this.dataManager = new DataManager();
        
        // Override notification method
        this.dataManager.showNotification = (message, type) => this.showNotification(message, type);
        
        // DOM Elements
        this.initializeElements();
        
        // Event Listeners
        this.initializeEventListeners();
        
        // Check if user is already logged in
        this.checkLoginStatus();
    }
    
    initializeElements() {
        // Pages
        this.loginPage = document.getElementById('loginPage');
        this.dashboardPage = document.getElementById('dashboardPage');
        
        // Forms
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        
        // Toggle buttons
        this.toggleBtns = document.querySelectorAll('.toggle-btn');
        
        // Dashboard elements
        this.coupleName = document.getElementById('coupleName');
        this.user1Name = document.getElementById('user1Name');
        this.user2Name = document.getElementById('user2Name');
        this.user1Points = document.getElementById('user1Points');
        this.user2Points = document.getElementById('user2Points');
        
        // Points system
        this.pointOptions = document.querySelectorAll('.point-option');
        this.reasonText = document.getElementById('reasonText');
        this.givePointsBtn = document.getElementById('givePointsBtn');
        
        // Reduce points system
        this.reduceReasonText = document.getElementById('reduceReasonText');
        this.reducePointsBtn = document.getElementById('reducePointsBtn');
        this.currentPointsDisplay = document.getElementById('currentPointsDisplay');
        
        // Action toggle
        this.actionToggleBtns = document.querySelectorAll('.action-toggle-btn');
        this.actionContents = document.querySelectorAll('.action-content');
        
        // Navigation
        this.navItems = document.querySelectorAll('.nav-item');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.logoutBtn = document.getElementById('logoutBtn');
        
        // History
        this.historyList = document.getElementById('historyList');
        
        // Profile
        this.profileUsername = document.getElementById('profileUsername');
        this.profileCoupleCode = document.getElementById('profileCoupleCode');
        this.totalGiven = document.getElementById('totalGiven');
        this.totalReceived = document.getElementById('totalReceived');
        this.totalUsed = document.getElementById('totalUsed');
        
        // Data management
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.dataInfo = document.getElementById('dataInfo');
        
        // Modal
        this.successModal = document.getElementById('successModal');
        this.modalClose = document.getElementById('modalClose');
        this.modalMessage = document.getElementById('modalMessage');
    }
    
    initializeEventListeners() {
        // Form toggle
        this.toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggleForm(btn.dataset.form));
        });
        
        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Points selection
        this.pointOptions.forEach(option => {
            option.addEventListener('click', () => this.selectPoints(option));
        });
        
        // Give points
        this.givePointsBtn.addEventListener('click', () => this.givePoints());
        
        // Reduce points
        this.reducePointsBtn.addEventListener('click', () => this.reducePoints());
        
        // Action toggle
        this.actionToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggleAction(btn.dataset.action));
        });
        
        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', () => this.switchTab(item.dataset.tab));
        });
        
        // Logout
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // Modal close
        this.modalClose.addEventListener('click', () => this.closeModal());
        
        // Data management
        this.exportBtn.addEventListener('click', () => this.exportData());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.handleImport(e));
        
        // Enter key for giving points
        this.reasonText.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.givePoints();
            }
        });
    }
    
    toggleForm(formType) {
        this.toggleBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-form="${formType}"]`).classList.add('active');
        
        this.loginForm.classList.toggle('active', formType === 'login');
        this.registerForm.classList.toggle('active', formType === 'register');
    }
    
    handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(this.loginForm);
        const username = this.dataManager.sanitizeInput(formData.get('username') || this.loginForm.querySelector('input[type="text"]').value);
        const password = this.dataManager.sanitizeInput(formData.get('password') || this.loginForm.querySelector('input[type="password"]').value);
        
        // Validate input
        const validation = this.dataManager.validateUserData({ username, password, coupleCode: '' });
        if (!validation.isValid) {
            this.showNotification(validation.errors[0], 'error');
            return;
        }
        
        const users = this.dataManager.getUsers();
        const user = users[username];
        
        if (user && user.password === password) {
            this.currentUser = user;
            this.loadCoupleData();
            this.showDashboard();
        } else {
            this.showNotification('Invalid username or password', 'error');
        }
    }
    
    handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(this.registerForm);
        const username = this.dataManager.sanitizeInput(formData.get('username') || this.registerForm.querySelectorAll('input')[0].value);
        const password = this.dataManager.sanitizeInput(formData.get('password') || this.registerForm.querySelectorAll('input')[1].value);
        const coupleCode = this.dataManager.sanitizeInput(formData.get('coupleCode') || this.registerForm.querySelectorAll('input')[2].value);
        
        // Validate input
        const validation = this.dataManager.validateUserData({ username, password, coupleCode });
        if (!validation.isValid) {
            this.showNotification(validation.errors[0], 'error');
            return;
        }
        
        const users = this.dataManager.getUsers();
        const couples = this.dataManager.getCouples();
        
        if (users[username]) {
            this.showNotification('Username already exists', 'error');
            return;
        }
        
        // Create or join couple
        let couple = couples[coupleCode];
        if (!couple) {
            // Create new couple
            couple = {
                code: coupleCode,
                name: `Couple ${coupleCode}`,
                users: [],
                pointsHistory: []
            };
            couples[coupleCode] = couple;
        }
        
        if (couple.users.length >= 2) {
            this.showNotification('This couple already has 2 members', 'error');
            return;
        }
        
        // Create user
        const user = {
            username,
            password,
            coupleCode,
            points: 0,
            totalGiven: 0,
            totalReceived: 0
        };
        
        users[username] = user;
        couple.users.push(username);
        
        // Update couple name if both users are present
        if (couple.users.length === 2) {
            couple.name = `${couple.users[0]} & ${couple.users[1]}`;
        }
        
        // Save using data manager
        if (!this.dataManager.saveUsers(users) || !this.dataManager.saveCouples(couples)) {
            this.showNotification('Error saving data', 'error');
            return;
        }
        
        this.currentUser = user;
        this.coupleData = couple;
        this.showDashboard();
        
        this.showNotification('Account created successfully!', 'success');
    }
    
    loadCoupleData() {
        this.coupleData = this.dataManager.getCouples()[this.currentUser.coupleCode];
    }
    
    showDashboard() {
        this.loginPage.classList.remove('active');
        this.dashboardPage.classList.add('active');
        
        this.updateDashboard();
        this.updateHistory();
        this.updateProfile();
    }
    
    updateDashboard() {
        // Update couple name
        this.coupleName.textContent = this.coupleData.name;
        
        // Get both users
        const users = JSON.parse(localStorage.getItem('users'));
        const user1 = users[this.coupleData.users[0]];
        const user2 = users[this.coupleData.users[1]];
        
        // Update user cards
        if (user1) {
            this.user1Name.textContent = user1.username;
            this.user1Points.textContent = user1.points;
        }
        
        if (user2) {
            this.user2Name.textContent = user2.username;
            this.user2Points.textContent = user2.points;
        }
        
        // Highlight current user
        if (this.currentUser.username === user1?.username) {
            document.querySelector('.user-card').style.background = 'linear-gradient(135deg, rgba(214, 51, 132, 0.1), rgba(240, 98, 146, 0.1))';
        } else if (this.currentUser.username === user2?.username) {
            document.querySelectorAll('.user-card')[1].style.background = 'linear-gradient(135deg, rgba(214, 51, 132, 0.1), rgba(240, 98, 146, 0.1))';
        }
    }
    
    selectPoints(option) {
        // Only select points from the active content
        const activeContent = document.querySelector('.action-content.active');
        if (!activeContent.contains(option)) return;
        
        // Clear selections from the active content only
        activeContent.querySelectorAll('.point-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedPoints = parseInt(option.dataset.points);
    }
    
    toggleAction(action) {
        this.actionToggleBtns.forEach(btn => btn.classList.remove('active'));
        this.actionContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-action="${action}"]`).classList.add('active');
        document.getElementById(`${action}Content`).classList.add('active');
        
        // Update current points display when switching to reduce
        if (action === 'reduce') {
            this.updateCurrentPointsDisplay();
        }
        
        // Reset selected points
        this.selectedPoints = 0;
    }
    
    updateCurrentPointsDisplay() {
        this.currentPointsDisplay.textContent = this.currentUser.points;
    }
    
    givePoints() {
        if (this.selectedPoints === 0) {
            this.showNotification('Please select points to give', 'error');
            return;
        }
        
        const reason = this.dataManager.sanitizeInput(this.reasonText.value.trim());
        if (!reason) {
            this.showNotification('Please provide a reason', 'error');
            return;
        }
        
        // Validate points data
        const validation = this.dataManager.validatePointsData({ points: this.selectedPoints, reason });
        if (!validation.isValid) {
            this.showNotification(validation.errors[0], 'error');
            return;
        }
        
        // Get partner
        const users = this.dataManager.getUsers();
        const partnerUsername = this.coupleData.users.find(u => u !== this.currentUser.username);
        const partner = users[partnerUsername];
        
        if (!partner) {
            this.showNotification('Partner not found', 'error');
            return;
        }
        
        // Update points
        partner.points += this.selectedPoints;
        partner.totalReceived += this.selectedPoints;
        this.currentUser.totalGiven += this.selectedPoints;
        
        // Add to history
        const historyItem = {
            from: this.currentUser.username,
            to: partnerUsername,
            points: this.selectedPoints,
            reason,
            date: new Date().toISOString()
        };
        
        this.coupleData.pointsHistory.push(historyItem);
        
        // Save using data manager
        users[partnerUsername] = partner;
        users[this.currentUser.username] = this.currentUser;
        
        const couples = this.dataManager.getCouples();
        couples[this.currentUser.coupleCode] = this.coupleData;
        
        if (!this.dataManager.saveUsers(users) || !this.dataManager.saveCouples(couples)) {
            this.showNotification('Error saving data', 'error');
            return;
        }
        
        // Show success modal
        this.showSuccessModal(`You gave ${this.selectedPoints} points to ${partnerUsername}!`);
        
        // Reset form
        this.resetPointsForm();
        
        // Update dashboard
        this.updateDashboard();
        this.updateHistory();
        this.updateProfile();
    }
    
    resetPointsForm() {
        const activeContent = document.querySelector('.action-content.active');
        activeContent.querySelectorAll('.point-option').forEach(opt => opt.classList.remove('selected'));
        
        if (activeContent.id === 'giveContent') {
            this.reasonText.value = '';
        } else {
            this.reduceReasonText.value = '';
        }
        
        this.selectedPoints = 0;
    }
    
    reducePoints() {
        if (this.selectedPoints === 0) {
            this.showNotification('Please select points to use', 'error');
            return;
        }
        
        const reason = this.dataManager.sanitizeInput(this.reduceReasonText.value.trim());
        if (!reason) {
            this.showNotification('Please provide a reason for using points', 'error');
            return;
        }
        
        // Validate points data
        const validation = this.dataManager.validatePointsData({ points: this.selectedPoints, reason });
        if (!validation.isValid) {
            this.showNotification(validation.errors[0], 'error');
            return;
        }
        
        // Check if user has enough points
        if (this.currentUser.points < this.selectedPoints) {
            this.showNotification('You don\'t have enough points!', 'error');
            return;
        }
        
        // Deduct points from current user
        this.currentUser.points -= this.selectedPoints;
        this.currentUser.totalUsed = (this.currentUser.totalUsed || 0) + this.selectedPoints;
        
        // Add to history
        const historyItem = {
            from: this.currentUser.username,
            to: 'System',
            points: -this.selectedPoints,
            reason,
            date: new Date().toISOString(),
            type: 'usage'
        };
        
        this.coupleData.pointsHistory.push(historyItem);
        
        // Save using data manager
        const users = this.dataManager.getUsers();
        users[this.currentUser.username] = this.currentUser;
        
        const couples = this.dataManager.getCouples();
        couples[this.currentUser.coupleCode] = this.coupleData;
        
        if (!this.dataManager.saveUsers(users) || !this.dataManager.saveCouples(couples)) {
            this.showNotification('Error saving data', 'error');
            return;
        }
        
        // Show success modal
        this.showSuccessModal(`You used ${this.selectedPoints} points!`);
        
        // Reset form
        this.resetPointsForm();
        
        // Update dashboard
        this.updateDashboard();
        this.updateHistory();
        this.updateProfile();
        this.updateCurrentPointsDisplay();
    }
    
    showSuccessModal(message) {
        this.modalMessage.textContent = message;
        this.successModal.classList.add('active');
    }
    
    closeModal() {
        this.successModal.classList.remove('active');
    }
    
    updateHistory() {
        this.historyList.innerHTML = '';
        
        const history = [...this.coupleData.pointsHistory].reverse();
        
        if (history.length === 0) {
            this.historyList.innerHTML = '<p style="text-align: center; color: #666;">No points history yet</p>';
            return;
        }
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(item.date);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Different styling for usage vs giving
            const isUsage = item.type === 'usage' || item.to === 'System';
            const pointsDisplay = isUsage ? `-${item.points}` : `+${item.points}`;
            const fromToText = isUsage ? `${item.from} used points` : `${item.from} → ${item.to}`;
            
            historyItem.innerHTML = `
                <div class="history-points ${isUsage ? 'usage' : 'gift'}">${pointsDisplay}</div>
                <div class="history-content">
                    <div class="history-from">${fromToText}</div>
                    <div class="history-reason">${item.reason}</div>
                    <div class="history-date">${dateStr}</div>
                </div>
            `;
            
            this.historyList.appendChild(historyItem);
        });
    }
    
    updateProfile() {
        this.profileUsername.textContent = this.currentUser.username;
        this.profileCoupleCode.textContent = `Couple Code: ${this.currentUser.coupleCode}`;
        
        // Calculate total given and received from history
        let totalGiven = 0;
        let totalReceived = 0;
        let totalUsed = 0;
        
        this.coupleData.pointsHistory.forEach(item => {
            if (item.from === this.currentUser.username) {
                if (item.type === 'usage' || item.to === 'System') {
                    totalUsed += Math.abs(item.points);
                } else {
                    totalGiven += item.points;
                }
            }
            if (item.to === this.currentUser.username) {
                totalReceived += item.points;
            }
        });
        
        this.totalGiven.textContent = totalGiven;
        this.totalReceived.textContent = totalReceived;
        this.totalUsed.textContent = totalUsed;
        
        // Update data info
        this.updateDataInfo();
    }
    
    updateDataInfo() {
        const stats = this.dataManager.getDataStats();
        if (stats) {
            this.dataInfo.innerHTML = `
                <small>Storage used: ${stats.storageUsed} | 
                Users: ${stats.totalUsers} | 
                Couples: ${stats.totalCouples} | 
                History items: ${stats.totalHistoryItems}</small>
            `;
        }
    }
    
    exportData() {
        if (this.dataManager.exportData()) {
            this.showNotification('Data exported successfully!', 'success');
        }
    }
    
    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        this.dataManager.importData(file)
            .then(() => {
                this.showNotification('Data imported successfully! Please login again.', 'success');
                this.logout();
            })
            .catch(error => {
                this.showNotification('Error importing data: ' + error.message, 'error');
            });
        
        // Reset file input
        e.target.value = '';
    }
    
    switchTab(tabName) {
        this.navItems.forEach(item => item.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    logout() {
        this.currentUser = null;
        this.coupleData = null;
        this.selectedPoints = 0;
        
        this.dashboardPage.classList.remove('active');
        this.loginPage.classList.add('active');
        
        // Reset forms
        this.loginForm.reset();
        this.registerForm.reset();
        this.toggleForm('login');
        
        this.showNotification('Logged out successfully', 'success');
    }
    
    checkLoginStatus() {
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.loadCoupleData();
            this.showDashboard();
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Style based on type
        const colors = {
            error: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
            success: 'linear-gradient(135deg, #00b894, #00cec9)',
            info: 'linear-gradient(135deg, #74b9ff, #0984e3)'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideDown 0.5s ease-out;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            background: ${colors[type] || colors.info};
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.5s ease-out';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
        
        // Save current user to session
        if (this.currentUser) {
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -100%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CouplePointsApp();
});

// Add some fun Easter eggs
document.addEventListener('keydown', (e) => {
    // Love mode - press L + O + V + E
    if (!window.loveSequence) window.loveSequence = [];
    
    window.loveSequence.push(e.key.toLowerCase());
    if (window.loveSequence.length > 4) {
        window.loveSequence.shift();
    }
    
    if (window.loveSequence.join('') === 'love') {
        document.body.style.animation = 'loveMode 2s ease-in-out';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 2000);
        window.loveSequence = [];
    }
});

// Add love mode animation
const loveModeStyle = document.createElement('style');
loveModeStyle.textContent = `
    @keyframes loveMode {
        0%, 100% { filter: hue-rotate(0deg) brightness(1); }
        25% { filter: hue-rotate(90deg) brightness(1.1); }
        50% { filter: hue-rotate(180deg) brightness(1.2); }
        75% { filter: hue-rotate(270deg) brightness(1.1); }
    }
`;
document.head.appendChild(loveModeStyle);
