/**
 * Data Manager for Couple Points App
 * Uses localStorage with keys: cp_users, cp_couples
 */
class DataManager {
    constructor() {
        this.USERS_KEY = 'cp_users';
        this.COUPLES_KEY = 'cp_couples';
        this.SESSION_KEY = 'cp_session';
    }

    // --- Users ---
    getUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.USERS_KEY)) || {};
        } catch (e) {
            console.error('getUsers error:', e);
            return {};
        }
    }

    saveUsers(users) {
        try {
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            return true;
        } catch (e) {
            console.error('saveUsers error:', e);
            return false;
        }
    }

    getUser(username) {
        return this.getUsers()[username] || null;
    }

    saveUser(user) {
        const users = this.getUsers();
        users[user.username] = user;
        return this.saveUsers(users);
    }

    // --- Couples ---
    getCouples() {
        try {
            return JSON.parse(localStorage.getItem(this.COUPLES_KEY)) || {};
        } catch (e) {
            console.error('getCouples error:', e);
            return {};
        }
    }

    saveCouples(couples) {
        try {
            localStorage.setItem(this.COUPLES_KEY, JSON.stringify(couples));
            return true;
        } catch (e) {
            console.error('saveCouples error:', e);
            return false;
        }
    }

    getCouple(code) {
        return this.getCouples()[code] || null;
    }

    saveCouple(couple) {
        const couples = this.getCouples();
        couples[couple.code] = couple;
        return this.saveCouples(couples);
    }

    // --- Session ---
    saveSession(user) {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    }

    getSession() {
        try {
            const data = sessionStorage.getItem(this.SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    clearSession() {
        sessionStorage.removeItem(this.SESSION_KEY);
    }

    // --- Export / Import ---
    exportData() {
        const data = {
            users: this.getUsers(),
            couples: this.getCouples(),
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'couple-points-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.users || !data.couples) {
                        throw new Error('Invalid backup file');
                    }
                    this.saveUsers(data.users);
                    this.saveCouples(data.couples);
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsText(file);
        });
    }

    // --- Stats ---
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return (total / 1024).toFixed(2) + ' KB';
    }
}
