/**
 * 数据管理模块
 * 负责本地存储、导入导出、数据加密等
 */
class DataManager {
    constructor() {
        // 禁用日志输出
        this.log = () => {};
        this.error = () => {};
        
        // 存储键名
        this.storageKeys = {
            sites: 'navigationStationSites',
            categories: 'navigationStationCategories',
            backups: 'navigationStationBackups',
            settings: 'navigationStationSettings'
        };
        
        // 数据结构
        this.data = {
            sites: [],
            categories: ['常用'],
            backups: [],
            settings: {
                backupInterval: 7, // 默认7天自动备份
                maxBackups: 3,     // 默认保留3个备份
                lastBackup: null,   // 上次备份时间
                masterPassword: null, // 主密码 (加密后存储)
                mode: 'guest'      // 默认访客模式
            }
        };
        
        // 加载数据
        this.loadData();
    }
    
    /**
     * 加载数据
     */
    loadData() {
        try {
            // 加载网站数据
            const sitesData = localStorage.getItem(this.storageKeys.sites);
            if (sitesData) {
                this.data.sites = JSON.parse(sitesData);
            }
            
            // 加载分类数据
            const categoriesData = localStorage.getItem(this.storageKeys.categories);
            if (categoriesData) {
                this.data.categories = JSON.parse(categoriesData);
            }
            
            // 加载备份数据
            const backupsData = localStorage.getItem(this.storageKeys.backups);
            if (backupsData) {
                this.data.backups = JSON.parse(backupsData);
            }
            
            // 加载设置数据
            const settingsData = localStorage.getItem(this.storageKeys.settings);
            if (settingsData) {
                this.data.settings = {...this.data.settings, ...JSON.parse(settingsData)};
            }
        } catch (error) {
            // 加载数据失败时使用默认数据
            this.data = {
                sites: [],
                categories: ['常用'],
                backups: [],
                settings: {
                    backupInterval: 7,
                    maxBackups: 3,
                    lastBackup: null,
                    masterPassword: null,
                    mode: 'guest'
                }
            };
        }
    }
    
    /**
     * 保存数据到本地存储
     */
    saveData() {
        try {
            // 保存网站数据
            localStorage.setItem(this.storageKeys.sites, JSON.stringify(this.data.sites));
            
            // 保存分类数据
            localStorage.setItem(this.storageKeys.categories, JSON.stringify(this.data.categories));
            
            // 保存备份数据
            localStorage.setItem(this.storageKeys.backups, JSON.stringify(this.data.backups));
            
            // 保存设置数据
            localStorage.setItem(this.storageKeys.settings, JSON.stringify(this.data.settings));
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * 设置自动备份
     */
    setupAutoBackup() {
        // 检查是否需要备份
        const now = new Date();
        const lastBackup = this.data.settings.lastBackup ? new Date(this.data.settings.lastBackup) : null;
        
        if (!lastBackup || (now - lastBackup) / (1000 * 60 * 60 * 24) >= this.data.settings.backupInterval) {
            this.backup();
        }
    }
    
    /**
     * 备份当前数据
     */
    backup() {
        const backupData = {
            sites: [...this.data.sites],
            categories: [...this.data.categories],
            timestamp: new Date().toISOString()
        };
        
        this.data.backups.unshift(backupData);
        
        // 限制备份数量
        if (this.data.backups.length > this.data.settings.maxBackups) {
            this.data.backups = this.data.backups.slice(0, this.data.settings.maxBackups);
        }
        
        // 更新最后备份时间
        this.data.settings.lastBackup = new Date().toISOString();
        
        // 保存到本地存储
        this.saveData();
    }
    
    /**
     * 从备份恢复数据
     * @param {number} index - 备份索引
     * @returns {boolean} - 是否恢复成功
     */
    restoreFromBackup(index) {
        if (index >= 0 && index < this.data.backups.length) {
            const backup = this.data.backups[index];
            
            // 先备份当前数据
            this.backup();
            
            // 恢复数据
            this.data.sites = [...backup.sites];
            this.data.categories = [...backup.categories];
            
            // 保存到本地存储
            this.saveData();
            
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取所有网站
     * @returns {Array} - 网站列表
     */
    getAllSites() {
        return [...this.data.sites];
    }
    
    /**
     * 按分类获取网站
     * @param {string} category - 分类名称
     * @returns {Array} - 筛选后的网站列表
     */
    getSitesByCategory(category) {
        return this.data.sites.filter(site => site.category === category);
    }
    
    /**
     * 搜索网站
     * @param {string} query - 搜索关键词
     * @returns {Array} - 搜索结果
     */
    searchSites(query) {
        const lowerQuery = query.toLowerCase();
        return this.data.sites.filter(site => 
            site.name.toLowerCase().includes(lowerQuery) || 
            site.url.toLowerCase().includes(lowerQuery)
        );
    }
    
    /**
     * 添加网站
     * @param {Object} site - 网站信息
     * @returns {boolean} - 是否添加成功
     */
    addSite(site) {
        try {
            // 验证必要字段
            if (!site.name || !site.url) {
                this.error('添加网站失败: 名称和URL是必填项');
                return false;
            }
            
            // 修复URL格式
            if (!site.url.match(/^https?:\/\//)) {
                site.url = 'https://' + site.url;
            }
            
            // 添加ID和访问次数
            const newSite = {
                ...site,
                id: 'site_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                visits: 0,
                lastVisit: null,
                dateAdded: new Date().toISOString()
            };
            
            // 处理分类
            if (!newSite.category || !this.data.categories.includes(newSite.category)) {
                newSite.category = this.data.categories[0]; // 使用第一个分类作为默认
            }
            
            // 加密敏感数据
            if (newSite.notes && this.data.settings.masterPassword && this.data.settings.mode === 'account') {
                newSite.notes = this.encryptText(newSite.notes, this.data.settings.masterPassword);
                newSite.isEncrypted = true;
            }
            
            // 添加网站
            this.data.sites.push(newSite);
            
            // 保存到本地存储
            this.saveData();
            
            return true;
        } catch (e) {
            this.error('添加网站出错:', e);
            return false;
        }
    }
    
    /**
     * 更新网站
     * @param {string} id - 网站ID
     * @param {Object} updates - 更新内容
     * @returns {boolean} - 是否更新成功
     */
    updateSite(id, updates) {
        try {
            const index = this.data.sites.findIndex(site => site.id === id);
            
            if (index === -1) {
                this.error('更新网站失败: 找不到ID为', id, '的网站');
                return false;
            }
            
            // 验证必要字段
            if ((!updates.name && !this.data.sites[index].name) || 
                (!updates.url && !this.data.sites[index].url)) {
                this.error('更新网站失败: 名称和URL是必填项');
                return false;
            }
            
            // 修复URL格式
            if (updates.url && !updates.url.match(/^https?:\/\//)) {
                updates.url = 'https://' + updates.url;
            }
            
            // 处理敏感数据
            if (updates.notes !== undefined) {
                // 如果旧数据是加密的，先获取原始值
                const originalSite = this.data.sites[index];
                if (originalSite.isEncrypted && originalSite.notes && 
                    this.data.settings.masterPassword && this.data.settings.mode === 'account') {
                    try {
                        // 尝试解密原始笔记（这里假设已经验证过密码）
                        const decryptedOldNotes = this.decryptText(originalSite.notes, this.data.settings.masterPassword);
                        
                        // 只有当新笔记与解密后的旧笔记不同时才更新
                        if (updates.notes !== decryptedOldNotes) {
                            if (updates.notes && this.data.settings.masterPassword && this.data.settings.mode === 'account') {
                                updates.notes = this.encryptText(updates.notes, this.data.settings.masterPassword);
                                updates.isEncrypted = true;
                            } else {
                                updates.isEncrypted = false;
                            }
                        } else {
                            // 笔记没有变化，保持原样
                            delete updates.notes;
                        }
                    } catch (e) {
                        this.error('解密旧笔记失败:', e);
                        // 如果解密失败，直接使用新的笔记
                        if (updates.notes && this.data.settings.masterPassword && this.data.settings.mode === 'account') {
                            updates.notes = this.encryptText(updates.notes, this.data.settings.masterPassword);
                            updates.isEncrypted = true;
                        } else {
                            updates.isEncrypted = false;
                        }
                    }
                } else if (updates.notes && this.data.settings.masterPassword && this.data.settings.mode === 'account') {
                    // 新的敏感数据需要加密
                    updates.notes = this.encryptText(updates.notes, this.data.settings.masterPassword);
                    updates.isEncrypted = true;
                } else {
                    updates.isEncrypted = false;
                }
            }
            
            // 更新网站
            this.data.sites[index] = {
                ...this.data.sites[index],
                ...updates,
                lastUpdated: new Date().toISOString()
            };
            
            // 保存到本地存储
            this.saveData();
            
            return true;
        } catch (e) {
            this.error('更新网站出错:', e);
            return false;
        }
    }
    
    /**
     * 删除网站
     * @param {string} id - 网站ID
     * @returns {boolean} - 是否删除成功
     */
    deleteSite(id) {
        const index = this.data.sites.findIndex(site => site.id === id);
        
        if (index === -1) {
            this.error('删除网站失败: 找不到ID为', id, '的网站');
            return false;
        }
        
        // 删除网站
        this.data.sites.splice(index, 1);
        
        // 保存到本地存储
        this.saveData();
        
        return true;
    }
    
    /**
     * 增加网站访问次数
     * @param {string} id - 网站ID
     */
    incrementVisits(id) {
        const index = this.data.sites.findIndex(site => site.id === id);
        
        if (index !== -1) {
            // 增加访问次数
            this.data.sites[index].visits = (this.data.sites[index].visits || 0) + 1;
            this.data.sites[index].lastVisit = new Date().toISOString();
            
            // 保存到本地存储
            this.saveData();
        }
    }
    
    /**
     * 获取所有分类
     * @returns {Array} - 分类列表
     */
    getCategories() {
        return [...this.data.categories];
    }
    
    /**
     * 添加分类
     * @param {string} name - 分类名称
     * @returns {boolean} - 是否添加成功
     */
    addCategory(name) {
        // 验证名称
        if (!name) {
            this.error('添加分类失败: 名称不能为空');
            return false;
        }
        
        // 检查是否已存在
        if (this.data.categories.includes(name)) {
            this.error('添加分类失败: 分类已存在');
            return false;
        }
        
        // 添加分类
        this.data.categories.push(name);
        
        // 保存到本地存储
        this.saveData();
        
        return true;
    }
    
    /**
     * 更新分类
     * @param {number} index - 分类索引
     * @param {string} newName - 新分类名称
     * @returns {boolean} - 是否更新成功
     */
    updateCategory(index, newName) {
        // 验证索引
        if (index < 0 || index >= this.data.categories.length) {
            this.error('更新分类失败: 索引超出范围');
            return false;
        }
        
        // 验证名称
        if (!newName) {
            this.error('更新分类失败: 名称不能为空');
            return false;
        }
        
        // 检查是否已存在
        if (this.data.categories.includes(newName)) {
            this.error('更新分类失败: 分类名称已存在');
            return false;
        }
        
        const oldName = this.data.categories[index];
        
        // 更新分类名称
        this.data.categories[index] = newName;
        
        // 更新相关网站的分类
        this.data.sites.forEach(site => {
            if (site.category === oldName) {
                site.category = newName;
            }
        });
        
        // 保存到本地存储
        this.saveData();
        
        return true;
    }
    
    /**
     * 删除分类
     * @param {number} index - 分类索引
     * @returns {boolean} - 是否删除成功
     */
    deleteCategory(index) {
        // 验证索引
        if (index < 0 || index >= this.data.categories.length) {
            this.error('删除分类失败: 索引超出范围');
            return false;
        }
        
        const categoryName = this.data.categories[index];
        
        // 是否为最后一个分类
        if (this.data.categories.length === 1) {
            this.error('删除分类失败: 必须保留至少一个分类');
            return false;
        }
        
        // 删除分类
        this.data.categories.splice(index, 1);
        
        // 设置一个默认分类用于替换已删除的分类
        const defaultCategory = this.data.categories[0];
        
        // 更新相关网站的分类
        this.data.sites.forEach(site => {
            if (site.category === categoryName) {
                site.category = defaultCategory;
            }
        });
        
        // 保存到本地存储
        this.saveData();
        
        return true;
    }
    
    /**
     * 更新分类顺序
     * @param {Array} newOrder - 新的分类顺序
     * @returns {boolean} - 是否更新成功
     */
    updateCategoryOrder(newOrder) {
        // 验证输入
        if (!Array.isArray(newOrder) || newOrder.length !== this.data.categories.length) {
            this.error('更新分类顺序失败: 输入无效');
            return false;
        }
        
        // 验证是否包含所有分类
        const allCategoriesIncluded = this.data.categories.every(category => newOrder.includes(category));
        if (!allCategoriesIncluded) {
            this.error('更新分类顺序失败: 缺少部分分类');
            return false;
        }
        
        // 更新分类顺序
        this.data.categories = [...newOrder];
        
        // 保存到本地存储
        this.saveData();
        
        return true;
    }
    
    /**
     * 设置主密码
     * @param {string} password - 主密码
     * @returns {boolean} - 是否设置成功
     */
    setMasterPassword(password) {
        if (!password) {
            this.error('设置主密码失败: 密码不能为空');
            return false;
        }
        
        try {
            // 将密码哈希后存储
            const hashedPassword = CryptoJS.SHA256(password).toString();
            this.data.settings.masterPassword = hashedPassword;
            
            // 保存到本地存储
            this.saveData();
            
            return true;
        } catch (e) {
            this.error('设置主密码失败:', e);
            return false;
        }
    }
    
    /**
     * 验证主密码
     * @param {string} password - 待验证的密码
     * @returns {boolean} - 是否验证成功
     */
    verifyMasterPassword(password) {
        if (!this.data.settings.masterPassword) {
            this.error('验证主密码失败: 未设置主密码');
            return false;
        }
        
        try {
            // 计算密码哈希
            const hashedPassword = CryptoJS.SHA256(password).toString();
            
            // 比较哈希值
            return hashedPassword === this.data.settings.masterPassword;
        } catch (e) {
            this.error('验证主密码失败:', e);
            return false;
        }
    }
    
    /**
     * 切换模式（访客/账户）
     * @param {string} mode - 模式名称（'guest'或'account'）
     * @returns {boolean} - 是否切换成功
     */
    switchMode(mode) {
        if (mode !== 'guest' && mode !== 'account') {
            this.error('切换模式失败: 无效的模式名称');
            return false;
        }
        
        // 如果切换到账户模式但未设置主密码
        if (mode === 'account' && !this.data.settings.masterPassword) {
            this.error('切换模式失败: 未设置主密码');
            return false;
        }
        
        // 切换模式
        this.data.settings.mode = mode;
        
        // 保存到本地存储
        this.saveData();
        
        return true;
    }
    
    /**
     * 获取当前模式
     * @returns {string} - 当前模式（'guest'或'account'）
     */
    getMode() {
        return this.data.settings.mode;
    }
    
    /**
     * 导出数据
     * @param {boolean} encrypt - 是否加密
     * @param {string} password - 加密密码（如果加密）
     * @returns {string} - 导出的数据（JSON字符串）
     */
    exportData(encrypt = false, password = null) {
        // 构建导出数据
        const exportData = {
            sites: this.data.sites,
            categories: this.data.categories,
            exportTime: new Date().toISOString(),
            version: '1.0'
        };
        
        // 将数据转换为JSON字符串
        let dataString = JSON.stringify(exportData, null, 2);
        
        // 是否加密
        if (encrypt && password) {
            try {
                return this.encryptText(dataString, password);
            } catch (e) {
                this.error('导出加密数据失败:', e);
                return dataString;
            }
        }
        
        return dataString;
    }
    
    /**
     * 导入数据
     * @param {string} data - 导入的数据
     * @param {boolean} isEncrypted - 数据是否加密
     * @param {string} password - 解密密码（如果加密）
     * @returns {boolean} - 是否导入成功
     */
    importData(data, isEncrypted = false, password = null) {
        try {
            let jsonData;
            
            // 是否需要解密
            if (isEncrypted && password) {
                try {
                    const decrypted = this.decryptText(data, password);
                    jsonData = JSON.parse(decrypted);
                } catch (e) {
                    this.error('解密数据失败:', e);
                    return false;
                }
            } else {
                jsonData = JSON.parse(data);
            }
            
            // 验证数据结构
            if (!jsonData.sites || !Array.isArray(jsonData.sites) || 
                !jsonData.categories || !Array.isArray(jsonData.categories)) {
                this.error('导入数据失败: 数据结构无效');
                return false;
            }
            
            // 备份当前数据
            this.backup();
            
            // 导入数据
            this.data.sites = jsonData.sites;
            this.data.categories = jsonData.categories;
            
            // 保存到本地存储
            this.saveData();
            
            return true;
        } catch (e) {
            this.error('导入数据失败:', e);
            return false;
        }
    }
    
    /**
     * 加密文本
     * @param {string} text - 待加密的文本
     * @param {string} password - 加密密码
     * @returns {string} - 加密后的文本
     */
    encryptText(text, password) {
        return CryptoJS.AES.encrypt(text, password).toString();
    }
    
    /**
     * 解密文本
     * @param {string} encryptedText - 加密的文本
     * @param {string} password - 解密密码
     * @returns {string} - 解密后的文本
     */
    decryptText(encryptedText, password) {
        const bytes = CryptoJS.AES.decrypt(encryptedText, password);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
    
    /**
     * 获取常用网站（访问次数最多的前N个）
     * @param {number} limit - 返回的数量限制
     * @returns {Array} - 常用网站列表
     */
    getFrequentSites(limit = 10) {
        return [...this.data.sites]
            .sort((a, b) => (b.visits || 0) - (a.visits || 0))
            .slice(0, limit);
    }
    
    /**
     * 获取最近访问的网站
     * @param {number} limit - 返回的数量限制
     * @returns {Array} - 最近访问的网站列表
     */
    getRecentSites(limit = 10) {
        return [...this.data.sites]
            .filter(site => site.lastVisit)
            .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
            .slice(0, limit);
    }
}

// 创建单例实例
const dataManager = new DataManager(); 