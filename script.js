// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    const db = new DataManager();
    let currentUser = null;
    let coupleData = null;
    let selectedPoints = 0;

    // --- DOM References ---
    const loginPage = document.getElementById('loginPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const coupleNameEl = document.getElementById('coupleName');
    const user1NameEl = document.getElementById('user1Name');
    const user2NameEl = document.getElementById('user2Name');
    const user1PointsEl = document.getElementById('user1Points');
    const user2PointsEl = document.getElementById('user2Points');
    const reasonText = document.getElementById('reasonText');
    const reduceReasonText = document.getElementById('reduceReasonText');
    const givePointsBtn = document.getElementById('givePointsBtn');
    const reducePointsBtn = document.getElementById('reducePointsBtn');
    const currentPointsDisplay = document.getElementById('currentPointsDisplay');
    const actionToggleBtns = document.querySelectorAll('.action-toggle-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const logoutBtn = document.getElementById('logoutBtn');
    const historyList = document.getElementById('historyList');
    const profileUsername = document.getElementById('profileUsername');
    const profileCoupleCode = document.getElementById('profileCoupleCode');
    const totalGivenEl = document.getElementById('totalGiven');
    const totalReceivedEl = document.getElementById('totalReceived');
    const totalUsedEl = document.getElementById('totalUsed');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const dataInfo = document.getElementById('dataInfo');
    const successModal = document.getElementById('successModal');
    const modalClose = document.getElementById('modalClose');
    const modalMessage = document.getElementById('modalMessage');
    const requestReasonText = document.getElementById('requestReasonText');
    const requestPointsBtn = document.getElementById('requestPointsBtn');
    const pendingRequestsEl = document.getElementById('pendingRequests');
    const requestsListEl = document.getElementById('requestsList');

    // --- Notification ---
    function notify(message, type) {
        const el = document.createElement('div');
        el.textContent = message;
        const bg = {
            error: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
            success: 'linear-gradient(135deg, #00b894, #00cec9)',
            info: 'linear-gradient(135deg, #74b9ff, #0984e3)'
        };
        el.style.cssText =
            'position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:15px 25px;' +
            'border-radius:10px;color:white;font-weight:500;z-index:1000;font-family:Poppins,sans-serif;' +
            'box-shadow:0 10px 25px rgba(0,0,0,0.2);background:' + (bg[type] || bg.info) + ';';
        document.body.appendChild(el);
        setTimeout(function () {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.5s';
            setTimeout(function () { el.remove(); }, 500);
        }, 3000);
    }

    // --- Auth Toggle ---
    toggleBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var form = btn.getAttribute('data-form');
            toggleBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            loginForm.classList.toggle('active', form === 'login');
            registerForm.classList.toggle('active', form === 'register');
        });
    });

    // --- Register ---
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(registerForm);
        var username = (fd.get('username') || '').trim();
        var password = (fd.get('password') || '').trim();
        var coupleCode = (fd.get('coupleCode') || '').trim();

        if (!username || username.length < 2) {
            return notify('Username must be at least 2 characters', 'error');
        }
        if (!password || password.length < 4) {
            return notify('Password must be at least 4 characters', 'error');
        }
        if (!coupleCode || coupleCode.length < 3) {
            return notify('Couple code must be at least 3 characters', 'error');
        }

        if (db.getUser(username)) {
            return notify('Username already exists', 'error');
        }

        var couple = db.getCouple(coupleCode);
        if (!couple) {
            couple = {
                code: coupleCode,
                name: 'Couple ' + coupleCode,
                users: [],
                pointsHistory: []
            };
        }

        if (couple.users.length >= 2) {
            return notify('This couple already has 2 members', 'error');
        }

        var user = {
            username: username,
            password: password,
            coupleCode: coupleCode,
            points: 0
        };

        couple.users.push(username);
        if (couple.users.length === 2) {
            couple.name = couple.users[0] + ' & ' + couple.users[1];
        }

        db.saveUser(user);
        db.saveCouple(couple);

        currentUser = user;
        coupleData = couple;
        db.saveSession(currentUser);
        showDashboard();
        notify('Account created successfully!', 'success');
    });

    // --- Login ---
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(loginForm);
        var username = (fd.get('username') || '').trim();
        var password = (fd.get('password') || '').trim();

        if (!username || !password) {
            return notify('Please enter both username and password', 'error');
        }

        var user = db.getUser(username);
        if (!user || user.password !== password) {
            return notify('Invalid username or password', 'error');
        }

        var couple = db.getCouple(user.coupleCode);
        if (!couple) {
            return notify('Couple data not found. Please register again.', 'error');
        }

        currentUser = user;
        coupleData = couple;
        db.saveSession(currentUser);
        showDashboard();
    });

    // --- Show Dashboard ---
    function showDashboard() {
        loginPage.classList.remove('active');
        dashboardPage.classList.add('active');
        refreshDashboard();
        refreshHistory();
        refreshProfile();
        refreshPendingRequests();
    }

    // --- Refresh Dashboard ---
    function refreshDashboard() {
        coupleNameEl.textContent = coupleData.name;

        var users = db.getUsers();
        var u1 = users[coupleData.users[0]];
        var u2 = coupleData.users[1] ? users[coupleData.users[1]] : null;

        user1NameEl.textContent = u1 ? u1.username : 'Waiting...';
        user1PointsEl.textContent = u1 ? u1.points : 0;
        user2NameEl.textContent = u2 ? u2.username : 'Waiting...';
        user2PointsEl.textContent = u2 ? u2.points : 0;

        // Highlight current user card
        var cards = document.querySelectorAll('.user-card');
        cards.forEach(function (c) { c.style.background = ''; });
        if (u1 && currentUser.username === u1.username) {
            cards[0].style.background = 'linear-gradient(135deg, rgba(214,51,132,0.1), rgba(240,98,146,0.1))';
        } else if (u2 && currentUser.username === u2.username && cards[1]) {
            cards[1].style.background = 'linear-gradient(135deg, rgba(214,51,132,0.1), rgba(240,98,146,0.1))';
        }

        // Update current user points from store (may have changed)
        currentUser = db.getUser(currentUser.username) || currentUser;
    }

    // --- Points Selection ---
    document.querySelectorAll('.point-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
            var parent = opt.closest('.action-content');
            if (!parent || !parent.classList.contains('active')) return;
            parent.querySelectorAll('.point-option').forEach(function (o) { o.classList.remove('selected'); });
            opt.classList.add('selected');
            selectedPoints = parseInt(opt.getAttribute('data-points'));
        });
    });

    // --- Action Toggle (Give / Use) ---
    actionToggleBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var action = btn.getAttribute('data-action');
            actionToggleBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            document.querySelectorAll('.action-content').forEach(function (c) { c.classList.remove('active'); });
            document.getElementById(action + 'Content').classList.add('active');
            selectedPoints = 0;
            if (action === 'reduce') {
                currentPointsDisplay.textContent = currentUser.points;
            }
        });
    });

    // --- Give Points ---
    givePointsBtn.addEventListener('click', function () {
        if (selectedPoints === 0) return notify('Please select points to give', 'error');

        var reason = reasonText.value.trim();
        if (!reason) return notify('Please provide a reason', 'error');

        var partnerName = coupleData.users.find(function (u) { return u !== currentUser.username; });
        if (!partnerName) return notify('Partner not found. Ask them to register with your couple code.', 'error');

        var partner = db.getUser(partnerName);
        if (!partner) return notify('Partner not found', 'error');

        var gave = selectedPoints;

        // Update partner points
        partner.points += gave;
        db.saveUser(partner);

        // Save history
        coupleData.pointsHistory.push({
            from: currentUser.username,
            to: partnerName,
            points: gave,
            reason: reason,
            date: new Date().toISOString()
        });
        db.saveCouple(coupleData);

        // Reset & refresh
        reasonText.value = '';
        selectedPoints = 0;
        document.querySelectorAll('#giveContent .point-option').forEach(function (o) { o.classList.remove('selected'); });
        showModal('You gave ' + gave + ' points to ' + partnerName + '!');
        refreshDashboard();
        refreshHistory();
        refreshProfile();
    });

    // --- Reduce Points ---
    reducePointsBtn.addEventListener('click', function () {
        if (selectedPoints === 0) return notify('Please select points to use', 'error');

        var reason = reduceReasonText.value.trim();
        if (!reason) return notify('Please provide a reason', 'error');

        // Refresh current user from store
        currentUser = db.getUser(currentUser.username) || currentUser;

        if (currentUser.points < selectedPoints) {
            return notify("You don't have enough points!", 'error');
        }

        currentUser.points -= selectedPoints;
        db.saveUser(currentUser);
        db.saveSession(currentUser);

        coupleData.pointsHistory.push({
            from: currentUser.username,
            to: 'System',
            points: -selectedPoints,
            reason: reason,
            date: new Date().toISOString(),
            type: 'usage'
        });
        db.saveCouple(coupleData);

        reduceReasonText.value = '';
        var used = selectedPoints;
        selectedPoints = 0;
        document.querySelectorAll('#reduceContent .point-option').forEach(function (o) { o.classList.remove('selected'); });
        currentPointsDisplay.textContent = currentUser.points;
        showModal('You used ' + used + ' points!');
        refreshDashboard();
        refreshHistory();
        refreshProfile();
    });

    // --- Request Points ---
    requestPointsBtn.addEventListener('click', function () {
        if (selectedPoints === 0) return notify('Please select how many points to request', 'error');

        var reason = requestReasonText.value.trim();
        if (!reason) return notify('Please tell your partner why you deserve these points', 'error');

        var partnerName = coupleData.users.find(function (u) { return u !== currentUser.username; });
        if (!partnerName) return notify('Partner not found. Ask them to register with your couple code.', 'error');

        // Ensure requests array exists
        if (!coupleData.requests) coupleData.requests = [];

        var req = {
            id: Date.now().toString(),
            from: currentUser.username,
            to: partnerName,
            points: selectedPoints,
            reason: reason,
            date: new Date().toISOString(),
            status: 'pending'
        };

        coupleData.requests.push(req);
        db.saveCouple(coupleData);

        var requested = selectedPoints;
        requestReasonText.value = '';
        selectedPoints = 0;
        document.querySelectorAll('#requestContent .point-option').forEach(function (o) { o.classList.remove('selected'); });
        showModal('You requested ' + requested + ' points from ' + partnerName + '!');
        refreshPendingRequests();
    });

    // --- Pending Requests ---
    function refreshPendingRequests() {
        if (!coupleData.requests) coupleData.requests = [];

        // Show only pending requests addressed to current user
        var pending = coupleData.requests.filter(function (r) {
            return r.to === currentUser.username && r.status === 'pending';
        });

        if (pending.length === 0) {
            pendingRequestsEl.style.display = 'none';
            return;
        }

        pendingRequestsEl.style.display = 'block';
        requestsListEl.innerHTML = '';

        pending.forEach(function (req) {
            var div = document.createElement('div');
            div.className = 'request-item';
            div.innerHTML =
                '<div class="request-points-badge">' + req.points + '</div>' +
                '<div class="request-info">' +
                '<div class="request-from">' + escapeHtml(req.from) + ' requests ' + req.points + ' points</div>' +
                '<div class="request-reason">' + escapeHtml(req.reason) + '</div>' +
                '</div>' +
                '<div class="request-actions">' +
                '<button class="request-accept-btn" data-id="' + req.id + '">Accept</button>' +
                '<button class="request-decline-btn" data-id="' + req.id + '">Decline</button>' +
                '</div>';
            requestsListEl.appendChild(div);
        });

        // Bind accept/decline buttons
        requestsListEl.querySelectorAll('.request-accept-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { handleRequest(btn.getAttribute('data-id'), 'accepted'); });
        });
        requestsListEl.querySelectorAll('.request-decline-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { handleRequest(btn.getAttribute('data-id'), 'declined'); });
        });
    }

    function handleRequest(reqId, action) {
        var req = coupleData.requests.find(function (r) { return r.id === reqId; });
        if (!req) return;

        req.status = action;

        if (action === 'accepted') {
            // Give points from current user (acceptor) to requester
            var requester = db.getUser(req.from);
            if (!requester) return notify('Requester not found', 'error');

            requester.points += req.points;
            db.saveUser(requester);

            // Add to history
            coupleData.pointsHistory.push({
                from: currentUser.username,
                to: req.from,
                points: req.points,
                reason: 'Accepted request: ' + req.reason,
                date: new Date().toISOString(),
                type: 'request_accepted'
            });

            notify('You gave ' + req.points + ' points to ' + req.from + '!', 'success');
        } else {
            // Add decline to history
            coupleData.pointsHistory.push({
                from: currentUser.username,
                to: req.from,
                points: 0,
                reason: 'Declined request: ' + req.reason,
                date: new Date().toISOString(),
                type: 'request_declined'
            });

            notify('Request from ' + req.from + ' declined', 'info');
        }

        db.saveCouple(coupleData);
        refreshDashboard();
        refreshHistory();
        refreshProfile();
        refreshPendingRequests();
    }

    // --- Modal ---
    function showModal(msg) {
        modalMessage.textContent = msg;
        successModal.classList.add('active');
    }
    modalClose.addEventListener('click', function () {
        successModal.classList.remove('active');
    });

    // --- History ---
    function refreshHistory() {
        historyList.innerHTML = '';
        var history = coupleData.pointsHistory.slice().reverse();
        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align:center;color:#666;">No points history yet</p>';
            return;
        }
        history.forEach(function (item) {
            var div = document.createElement('div');
            div.className = 'history-item';
            var d = new Date(item.date);
            var dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            var isUsage = item.type === 'usage';
            var isRequestAccepted = item.type === 'request_accepted';
            var isRequestDeclined = item.type === 'request_declined';
            var pts, who, cssClass;

            if (isUsage) {
                pts = item.points;
                who = item.from + ' used points';
                cssClass = 'usage';
            } else if (isRequestAccepted) {
                pts = '+' + item.points;
                who = item.from + ' accepted ' + item.to + "'s request";
                cssClass = 'gift';
            } else if (isRequestDeclined) {
                pts = '0';
                who = item.from + ' declined ' + item.to + "'s request";
                cssClass = 'usage';
            } else {
                pts = '+' + item.points;
                who = item.from + ' → ' + item.to;
                cssClass = 'gift';
            }
            div.innerHTML =
                '<div class="history-points ' + cssClass + '">' + pts + '</div>' +
                '<div class="history-content">' +
                '<div class="history-from">' + who + '</div>' +
                '<div class="history-reason">' + escapeHtml(item.reason) + '</div>' +
                '<div class="history-date">' + dateStr + '</div>' +
                '</div>';
            historyList.appendChild(div);
        });
    }

    function escapeHtml(text) {
        var d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    // --- Profile ---
    function refreshProfile() {
        profileUsername.textContent = currentUser.username;
        profileCoupleCode.textContent = 'Couple Code: ' + currentUser.coupleCode;

        var given = 0, received = 0, used = 0;
        coupleData.pointsHistory.forEach(function (item) {
            if (item.from === currentUser.username) {
                if (item.type === 'usage') {
                    used += Math.abs(item.points);
                } else {
                    given += item.points;
                }
            }
            if (item.to === currentUser.username) {
                received += item.points;
            }
        });
        totalGivenEl.textContent = given;
        totalReceivedEl.textContent = received;
        totalUsedEl.textContent = used;

        dataInfo.innerHTML = '<small>Storage used: ' + db.getStorageSize() + '</small>';
    }

    // --- Nav Tabs ---
    navItems.forEach(function (item) {
        item.addEventListener('click', function () {
            var tab = item.getAttribute('data-tab');
            navItems.forEach(function (i) { i.classList.remove('active'); });
            document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
            item.classList.add('active');
            document.getElementById(tab + 'Tab').classList.add('active');
        });
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', function () {
        currentUser = null;
        coupleData = null;
        selectedPoints = 0;
        db.clearSession();
        dashboardPage.classList.remove('active');
        loginPage.classList.add('active');
        loginForm.reset();
        registerForm.reset();
        // Reset toggle to login
        toggleBtns.forEach(function (b) { b.classList.remove('active'); });
        toggleBtns[0].classList.add('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        notify('Logged out successfully', 'success');
    });

    // --- Export / Import ---
    exportBtn.addEventListener('click', function () {
        db.exportData();
        notify('Data exported!', 'success');
    });
    importBtn.addEventListener('click', function () { importFile.click(); });
    importFile.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        db.importData(file).then(function () {
            notify('Data imported! Please login again.', 'success');
            logoutBtn.click();
        }).catch(function (err) {
            notify('Import error: ' + err.message, 'error');
        });
        e.target.value = '';
    });

    // --- Restore Session on Load ---
    var saved = db.getSession();
    if (saved) {
        var user = db.getUser(saved.username);
        if (user) {
            var couple = db.getCouple(user.coupleCode);
            if (couple) {
                currentUser = user;
                coupleData = couple;
                db.saveSession(currentUser);
                showDashboard();
            } else {
                db.clearSession();
            }
        } else {
            db.clearSession();
        }
    }
});
