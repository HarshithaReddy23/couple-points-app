/**
 * Secure Data Manager for Couple Points App
 * Handles all data operations with validation, backup, and recovery
 */
class DataManager {
    constructor() {
        this.USERS_KEY = 'couple_points_users';
        this.COUPLES_KEY = 'couple_points_couples';
        this.BACKUP_KEY = 'couple_points_backup';
        this.VERSION_KEY = 'couple_points_version';
        
        this.currentVersion = '1.0.0';
        this.maxHistoryItems = 1000;
        this.maxBackupAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        this.initialize();
    }
    
    initialize() {
        this.createBackup();
        this.cleanupOldData();
        this.migrateData();
    }
    
    /**
     * Sanitize input data to prevent XSS and injection
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .trim()
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
    
    /**
     * Validate user data
     */
    validateUserData(userData) {
        const errors = [];
        
        if (!userData.username || typeof userData.username !== 'string') {
            errors.push('Username is required');
        } else if (userData.username.length < 2 || userData.username.length > 20) {
            errors.push('Username must be 2-20 characters');
        } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }
        
        if (!userData.password || typeof userData.password !== 'string') {
            errors.push('Password is required');
        } else if (userData.password.length < 4 || userData.password.length > 50) {
            errors.push('Password must be 4-50 characters');
        }
        
        if (!userData.coupleCode || typeof userData.coupleCode !== 'string') {
            errors.push('Couple code is required');
        } else if (userData.coupleCode.length < 3 || userData.coupleCode.length > 10) {
            errors.push('Couple code must be 3-10 characters');
        } else if (!/^[a-zA-Z0-9]+$/.test(userData.coupleCode)) {
            errors.push('Couple code can only contain letters and numbers');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Validate points data
     */
    validatePointsData(pointsData) {
        const errors = [];
        
        if (!pointsData.points || typeof pointsData.points !== 'number') {
            errors.push('Points must be a number');
        } else if (Math.abs(pointsData.points) > 100) {
            errors.push('Points cannot exceed 100 in a single transaction');
        }
        
        if (!pointsData.reason || typeof pointsData.reason !== 'string') {
            errors.push('Reason is required');
        } else if (pointsData.reason.length < 1 || pointsData.reason.length > 200) {
            errors.push('Reason must be 1-200 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Get all users
     */
    getUsers() {
        try {
            const data = localStorage.getItem(this.USERS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting users:', error);
            return this.restoreFromBackup('users');
        }
    }
    
    /**
     * Save users data
     */
    saveUsers(users) {
        try {
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            this.createBackup();
            return true;
        } catch (error) {
            console.error('Error saving users:', error);
            this.showNotification('Error saving user data', 'error');
            return false;
        }
    }
    
    /**
     * Get all couples
     */
    getCouples() {
        try {
            const data = localStorage.getItem(this.COUPLES_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error getting couples:', error);
            return this.restoreFromBackup('couples');
        }
    }
    
    /**
     * Save couples data
     */
    saveCouples(couples) {
        try {
            localStorage.setItem(this.COUPLES_KEY, JSON.stringify(couples));
            this.createBackup();
            return true;
        } catch (error) {
            console.error('Error saving couples:', error);
            this.showNotification('Error saving couple data', 'error');
            return false;
        }
    }
    
    /**
     * Create backup of all data
     */
    createBackup() {
        try {
            const backup = {
                timestamp: Date.now(),
                version: this.currentVersion,
                users: this.getUsers(),
                couples: this.getCouples()
            };
            
            localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            return false;
        }
    }
    
    /**
     * Restore data from backup
     */
    restoreFromBackup(type) {
        try {
            const backup = localStorage.getItem(this.BACKUP_KEY);
            if (!backup) return {};
            
            const backupData = JSON.parse(backup);
            
            if (type === 'users') {
                return backupData.users || {};
            } else if (type === 'couples') {
                return backupData.couples || {};
            }
            
            return backupData;
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return {};
        }
    }
    
    /**
     * Clean up old data
     */
    cleanupOldData() {
        try {
            const couples = this.getCouples();
            
            Object.keys(couples).forEach(coupleCode => {
                const couple = couples[coupleCode];
                
                // Limit history items
                if (couple.pointsHistory && couple.pointsHistory.length > this.maxHistoryItems) {
                    couple.pointsHistory = couple.pointsHistory.slice(-this.maxHistoryItems);
                }
                
                // Remove inactive couples (older than 30 days)
                if (couple.pointsHistory && couple.pointsHistory.length > 0) {
                    const lastActivity = new Date(couple.pointsHistory[couple.pointsHistory.length - 1].date);
                    const now = new Date();
                    
                    if (now - lastActivity > this.maxBackupAge) {
                        delete couples[coupleCode];
                    }
                }
            });
            
            this.saveCouples(couples);
        } catch (error) {
            console.error('Error cleaning up data:', error);
        }
    }
    
    /**
     * Migrate data to new version
     */
    migrateData() {
        try {
            const currentVersion = localStorage.getItem(this.VERSION_KEY);
            
            if (currentVersion !== this.currentVersion) {
                // Perform migration logic here
                console.log('Migrating data to version', this.currentVersion);
                localStorage.setItem(this.VERSION_KEY, this.currentVersion);
            }
        } catch (error) {
            console.error('Error migrating data:', error);
        }
    }
    
    /**
     * Export data for backup
     */
    exportData() {
        try {
            const data = {
                version: this.currentVersion,
                exportDate: new Date().toISOString(),
                users: this.getUsers(),
                couples: this.getCouples()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `couple-points-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Error exporting data', 'error');
            return false;
        }
    }
    
    /**
     * Import data from backup
     */
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (!data.users || !data.couples) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Create backup before importing
                    this.createBackup();
                    
                    // Import data
                    this.saveUsers(data.users);
                    this.saveCouples(data.couples);
                    
                    resolve(true);
                } catch (error) {
                    console.error('Error importing data:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Clear all data (for testing/reset)
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.USERS_KEY);
            localStorage.removeItem(this.COUPLES_KEY);
            localStorage.removeItem(this.BACKUP_KEY);
            localStorage.removeItem(this.VERSION_KEY);
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
    
    /**
     * Get data statistics
     */
    getDataStats() {
        try {
            const users = this.getUsers();
            const couples = this.getCouples();
            
            let totalUsers = Object.keys(users).length;
            let totalCouples = Object.keys(couples).length;
            let totalHistoryItems = 0;
            
            Object.values(couples).forEach(couple => {
                if (couple.pointsHistory) {
                    totalHistoryItems += couple.pointsHistory.length;
                }
            });
            
            return {
                totalUsers,
                totalCouples,
                totalHistoryItems,
                storageUsed: this.getStorageSize()
            };
        } catch (error) {
            console.error('Error getting data stats:', error);
            return null;
        }
    }
    
    /**
     * Get storage size
     */
    getStorageSize() {
        try {
            let totalSize = 0;
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }
            
            return (totalSize / 1024).toFixed(2) + ' KB';
        } catch (error) {
            console.error('Error calculating storage size:', error);
            return 'Unknown';
        }
    }
    
    /**
     * Show notification (to be implemented by main app)
     */
    showNotification(message, type = 'info') {
        // This will be overridden by the main app
        console.log(`[${type}] ${message}`);
    }
}

// Export for use in main app
window.DataManager = DataManager;
