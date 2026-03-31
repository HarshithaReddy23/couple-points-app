/**
 * Data Manager for Couple Points App
 * Uses Firebase Firestore for cloud storage
 * Collections: users, couples
 */
class DataManager {
    constructor() {
        this.db = firestore;
        this.SESSION_KEY = 'cp_session';
    }

    // --- Users ---
    async getUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            const users = {};
            snapshot.forEach(function (doc) {
                users[doc.id] = doc.data();
            });
            return users;
        } catch (e) {
            console.error('getUsers error:', e);
            return {};
        }
    }

    async getUser(username) {
        try {
            const doc = await this.db.collection('users').doc(username).get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.error('getUser error:', e);
            return null;
        }
    }

    async saveUser(user) {
        try {
            await this.db.collection('users').doc(user.username).set(user);
            return true;
        } catch (e) {
            console.error('saveUser error:', e);
            return false;
        }
    }

    // --- Couples ---
    async getCouple(code) {
        try {
            const doc = await this.db.collection('couples').doc(code).get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.error('getCouple error:', e);
            return null;
        }
    }

    async saveCouple(couple) {
        try {
            await this.db.collection('couples').doc(couple.code).set(couple);
            return true;
        } catch (e) {
            console.error('saveCouple error:', e);
            return false;
        }
    }

    // --- Real-time listener for couple data ---
    onCoupleChange(code, callback) {
        return this.db.collection('couples').doc(code).onSnapshot(function (doc) {
            if (doc.exists) {
                callback(doc.data());
            }
        });
    }

    // --- Session (stays in browser sessionStorage) ---
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
    async exportData() {
        const users = await this.getUsers();
        const couplesSnapshot = await this.db.collection('couples').get();
        const couples = {};
        couplesSnapshot.forEach(function (doc) {
            couples[doc.id] = doc.data();
        });

        const data = {
            users: users,
            couples: couples,
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
        const self = this;
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = async function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.users || !data.couples) {
                        throw new Error('Invalid backup file');
                    }
                    const batch = self.db.batch();
                    for (const username of Object.keys(data.users)) {
                        batch.set(self.db.collection('users').doc(username), data.users[username]);
                    }
                    for (const code of Object.keys(data.couples)) {
                        batch.set(self.db.collection('couples').doc(code), data.couples[code]);
                    }
                    await batch.commit();
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = function () { reject(new Error('File read error')); };
            reader.readAsText(file);
        });
    }
}
