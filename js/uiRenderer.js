/**
 * UI渲染模块
 * 负责DOM操作、事件绑定和动态渲染UI
 */
class UIRenderer {
    constructor() {
        // 替换控制台日志为空函数
        this.log = () => {};
        this.error = () => {};
        
        // 保存已绑定的事件，防止重复绑定
        this._boundEvents = new Set();
        
        // 防止函数重复执行的标志
        this._isExecuting = {
            addSite: false,
            importData: false,
            exportData: false,
            switchMode: false,
            categoryModal: false
        };
        
        // DOM元素缓存
        this.dom = {
            sitesGrid: document.getElementById('sitesGrid') || document.querySelector('.sites-grid'),
            searchInput: document.getElementById('searchInput'),
            categoryMenu: document.getElementById('categoryMenu'),
            currentCategoryTitle: document.getElementById('currentCategoryTitle'),
            addSiteBtn: document.getElementById('addSiteBtn'),
            addSiteModal: document.getElementById('addSiteModal'),
            addSiteForm: document.getElementById('addSiteForm'),
            addSiteModalTitle: document.getElementById('addSiteModalTitle'),
            categoryModal: document.getElementById('categoryModal'),
            categoryList: document.getElementById('categoryList'),
            newCategoryName: document.getElementById('newCategoryName'),
            addCategoryBtn: document.getElementById('addCategoryBtn'),
            saveCategoriesBtn: document.getElementById('saveCategoriesBtn'),
            contextMenu: document.getElementById('contextMenu'),
            notification: document.getElementById('notification'),
            passwordModal: document.getElementById('passwordModal'),
            passwordForm: document.getElementById('passwordForm'),
            siteCategory: document.getElementById('siteCategory'),
            importData: document.getElementById('importData'),
            exportData: document.getElementById('exportData'),
            manageCategories: document.getElementById('manageCategories'),
            switchMode: document.getElementById('switchMode'),
            languageSelect: document.getElementById('languageSelect')
        };
        
        // 当前状态
        this.state = {
            currentCategory: 'ALL',
            currentSites: [],
            selectedSiteId: null,
            draggedCategory: null,
            draggedCategoryIndex: -1,
            passwordCallback: null,
            editMode: false,
            isEditing: false,  // 控制是添加还是编辑模式
            searchQuery: '',
            eventsBound: false // 标记事件是否已绑定
        };
        
        // 初始化语言
        this.initLanguage();
        
        // 隐藏模式切换按钮
        if (this.dom.switchMode) {
            this.dom.switchMode.style.display = 'none';
        }
    }
    
    /**
     * 防止重复执行装饰器
     * @param {string} functionName - 函数名
     * @param {Function} fn - 要执行的函数
     * @param {number} delay - 防抖延迟
     * @returns {Function} - 包装后的函数
     */
    preventDoubleExecution(functionName, fn, delay = 500) {
        return (...args) => {
            if (this._isExecuting[functionName]) {
                return;
            }
            
            this._isExecuting[functionName] = true;
            
            try {
                fn.apply(this, args);
            } catch (error) {
                // 出错时仍然记录到控制台，便于调试
                console.error(`函数 ${functionName} 执行错误:`, error);
            } finally {
                // 延迟一段时间后重置状态，防止短时间内重复点击
                setTimeout(() => {
                    this._isExecuting[functionName] = false;
                }, delay);
            }
        };
    }

    /**
     * 安全地添加事件监听器，确保不会重复绑定
     * @param {Element} element - DOM元素
     * @param {string} eventType - 事件类型
     * @param {Function} handler - 处理函数
     */
    safeAddEventListener(element, eventType, handler) {
        if (!element) return;
        
        // 创建唯一标识符
        const eventId = `${element.id || 'unknown'}_${eventType}`;
        
        // 如果已经绑定过这个事件，先移除
        if (this._boundEvents.has(eventId)) {
            return;
        }
        
        // 绑定事件并记录
        element.addEventListener(eventType, handler);
        this._boundEvents.add(eventId);
    }
    
    /**
     * 初始化语言设置
     */
    initLanguage() {
        try {
            // 从本地存储获取用户保存的语言设置
            const savedLang = localStorage.getItem('language');
            if (savedLang && (savedLang === 'zh-CN' || savedLang === 'en-US')) {
                if (typeof setLanguage === 'function') {
                    setLanguage(savedLang);
                }
            }
            
            // 应用当前语言到页面
            this.updatePageLanguage();
            
            // 初始化语言选择下拉框
            this.initLanguageSelect();
        } catch (error) {
            // 初始化失败时使用默认语言
            if (typeof setLanguage === 'function') {
                setLanguage('en-US');
            }
            this.updatePageLanguage();
        }
    }
    
    /**
     * 初始化语言选择下拉框
     */
    initLanguageSelect() {
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            try {
                // 设置下拉框当前值为当前语言
                const currentLang = typeof getCurrentLanguage === 'function' ? 
                    getCurrentLanguage() : 'en-US';
                languageSelect.value = currentLang;
                
                // 监听语言选择变化
                this.safeAddEventListener(languageSelect, 'change', () => {
                    const selectedLang = languageSelect.value;
                    this.handleLanguageChange(selectedLang);
                });
            } catch (error) {
                // 出错时使用默认语言
                languageSelect.value = 'en-US';
            }
        }
    }
    
    /**
     * 处理语言变更
     * @param {string} langCode - 语言代码
     */
    handleLanguageChange(langCode) {
        if (!langCode || (langCode !== 'zh-CN' && langCode !== 'en-US')) {
            this.showNotification(t('language_changed') || 'Language change failed', 'error');
            return;
        }
        
        try {
            // 设置语言
            if (typeof setLanguage === 'function') {
                setLanguage(langCode);
            } else {
                this.showNotification(t('feature_disabled') || 'Language switching is disabled', 'error');
                return;
            }
            
            // 使用i18n.js中的updatePageText函数更新页面文本
            if (typeof updatePageText === 'function') {
                updatePageText();
            }
            
            // 重新渲染界面
            this.renderCategoryMenu();
            this.renderSites();
            
            // 显示通知
            this.showNotification(t('language_changed') || 'Language changed', 'success');
        } catch (error) {
            this.showNotification(t('feature_disabled') || 'Language switching failed', 'error');
        }
    }
    
    /**
     * 更新页面中所有文本为当前语言
     */
    updatePageLanguage() {
        try {
            // 使用i18n.js中的updatePageText函数
            if (typeof updatePageText === 'function') {
                updatePageText();
            } else {
                // 后备方案
                this.updatePageTextManually();
            }
            
            // 更新分类菜单和网站卡片中的分类名称
            this.renderCategoryMenu();
            this.renderSites();
            
            // 更新文档标题
            document.title = typeof t === 'function' ? 
                t('app_name') + ' - ' + (getCurrentLanguage() === 'zh-CN' ? '您的个人网站管理中心' : 'Your Personal Website Manager') : 
                'VividDH - Your Personal Website Manager';
        } catch (error) {
            // 出错处理
        }
    }
    
    /**
     * 手动更新页面文本（作为后备方案）
     */
    updatePageTextManually() {
        if (typeof t !== 'function') return;
        
        // 更新所有带有data-i18n属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                el.textContent = t(key);
            }
        });
        
        // 更新所有带有data-i18n-placeholder属性的元素的placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                el.placeholder = t(key);
            }
        });
        
        // 更新所有带有data-i18n-title属性的元素的title
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                el.title = t(key);
            }
        });
        
        // 更新带有title属性的功能按钮
        document.querySelectorAll('.function-btn').forEach(btn => {
            const title = btn.getAttribute('data-function');
            if (title) {
                btn.setAttribute('title', t(title));
            }
        });
    }
    
    /**
     * 绑定所有事件处理器
     * 确保只绑定一次
     */
    bindEvents() {
        // 防止重复绑定事件
        if (this.state.eventsBound) {
            return;
        }
        
        // 搜索框输入事件
        if (this.dom.searchInput) {
            this.safeAddEventListener(this.dom.searchInput, 'input', () => {
                this.state.searchQuery = this.dom.searchInput.value.trim();
                this.renderSites();
            });
        }
        
        // 添加网站按钮点击事件 - 使用防重复机制
        if (this.dom.addSiteBtn) {
            const safeOpenModal = this.preventDoubleExecution('addSite', () => {
                this.openAddSiteModal();
            });
            
            this.safeAddEventListener(this.dom.addSiteBtn, 'click', safeOpenModal);
        }
        
        // 添加网站表单提交事件
        if (this.dom.addSiteForm) {
            const safeHandleAddSite = this.preventDoubleExecution('addSite', (e) => {
                e.preventDefault();
                this.handleAddSite(e);
            });
            
            this.safeAddEventListener(this.dom.addSiteForm, 'submit', safeHandleAddSite);
        }
        
        // 点击页面任意位置关闭右键菜单
        document.addEventListener('click', (e) => {
            if (this.dom.contextMenu && this.dom.contextMenu.style.display === 'block') {
                // 如果点击的不是菜单内部元素，则关闭菜单
                if (!this.dom.contextMenu.contains(e.target)) {
                    this.dom.contextMenu.style.display = 'none';
                }
            }
        });
        
        // 按下ESC键关闭任何打开的模态框或右键菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // 关闭右键菜单
                if (this.dom.contextMenu) {
                    this.dom.contextMenu.style.display = 'none';
                }
                
                // 关闭所有模态框
                document.querySelectorAll('.modal').forEach(modal => {
                    if (modal.style.display !== 'none') {
                        modal.style.display = 'none';
                    }
                });
            }
        });
        
        // 点击关闭按钮关闭模态框
        document.querySelectorAll('.modal .close-btn, .modal .cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // 点击模态框外部区域关闭模态框
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // 修正z-index问题，确保顶部的模态框有最高z-index
        const adjustZIndex = () => {
            const modals = [...document.querySelectorAll('.modal')].filter(m => 
                m.style.display && m.style.display !== 'none');
            modals.forEach((modal, i) => {
                modal.style.zIndex = 1000 + i;
            });
        };
        
        // 监听模态框显示变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style') {
                    adjustZIndex();
                }
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            observer.observe(modal, { attributes: true });
        });
        
        // 分类管理按钮点击
        if (this.dom.manageCategories) {
            const safeOpenCategoryModal = this.preventDoubleExecution('categoryModal', () => {
                this.openCategoryModal();
            });
            
            this.safeAddEventListener(this.dom.manageCategories, 'click', safeOpenCategoryModal);
        }
        
        // 添加分类按钮点击
        if (this.dom.addCategoryBtn) {
            this.safeAddEventListener(this.dom.addCategoryBtn, 'click', () => {
                this.handleAddCategory();
            });
        }
        
        // 保存分类按钮点击
        if (this.dom.saveCategoriesBtn) {
            this.safeAddEventListener(this.dom.saveCategoriesBtn, 'click', () => {
                this.handleSaveCategories();
            });
        }
        
        // 导入数据按钮点击
        if (this.dom.importData) {
            const safeImportData = this.preventDoubleExecution('importData', () => {
                this.handleImportData();
            });
            
            this.safeAddEventListener(this.dom.importData, 'click', safeImportData);
        }
        
        // 导出数据按钮点击
        if (this.dom.exportData) {
            const safeExportData = this.preventDoubleExecution('exportData', () => {
                this.handleExportData();
            });
            
            this.safeAddEventListener(this.dom.exportData, 'click', safeExportData);
        }
        
        // 禁用模式切换功能
        if (this.dom.switchMode) {
            this.dom.switchMode.style.display = 'none';
        }
        
        // 密码验证表单提交
        if (this.dom.passwordForm) {
            this.safeAddEventListener(this.dom.passwordForm, 'submit', (e) => {
                e.preventDefault();
                this.handlePasswordVerify(e);
            });
        }
        
        // 右键菜单点击事件
        const menuEdit = document.getElementById('menuEdit');
        const menuDelete = document.getElementById('menuDelete');
        const menuCopyUrl = document.getElementById('menuCopyUrl');
        const menuCopyPassword = document.getElementById('menuCopyPassword');
        
        if (menuEdit) this.safeAddEventListener(menuEdit, 'click', () => this.handleEditSite());
        if (menuDelete) this.safeAddEventListener(menuDelete, 'click', () => this.handleDeleteSite());
        if (menuCopyUrl) this.safeAddEventListener(menuCopyUrl, 'click', () => this.handleCopyUrl());
        if (menuCopyPassword) this.safeAddEventListener(menuCopyPassword, 'click', () => this.handleCopyPassword());
        
        // 语言选择变更事件
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            this.safeAddEventListener(languageSelect, 'change', () => {
                const selectedLang = languageSelect.value;
                this.handleLanguageChange(selectedLang);
            });
        }
        
        // 移动设备触发分类显示
        this.initCategoryMenuToggle();
        
        // 标记事件已绑定
        this.state.eventsBound = true;
    }

    /**
     * 初始化分类菜单切换按钮
     */
    initCategoryMenuToggle() {
        const categoryBtn = document.querySelector('.category-btn');
        const sidebar = document.querySelector('.sidebar');
        
        if (categoryBtn && sidebar) {
            this.safeAddEventListener(categoryBtn, 'click', () => {
                sidebar.classList.toggle('open');
            });
            
            // 点击页面其他地方关闭侧边栏（仅在移动设备上）
            this.safeAddEventListener(document, 'click', (e) => {
                const isClickInsideSidebar = sidebar.contains(e.target);
                const isClickOnToggleBtn = categoryBtn.contains(e.target);
                
                if (!isClickInsideSidebar && !isClickOnToggleBtn && window.innerWidth <= 992) {
                    sidebar.classList.remove('open');
                }
            });
        }
    }
    
    /**
     * 初始化UI
     */
    init() {
        // 初始化当前分类
        this.state.currentCategory = 'ALL';

        // 渲染分类菜单
        this.renderCategoryMenu();
        
        // 初始渲染所有网站
        this.renderSites();
        
        // 绑定事件
        this.bindEvents();
        
        // 检查敏感访问权限
        this.checkSensitiveAccess();
        
        // 设置自动备份
        dataManager.setupAutoBackup();
        
        // 返回当前实例，支持链式调用
        return this;
    }
    
    /**
     * 检查是否有权访问敏感数据
     */
    checkSensitiveAccess() {
        // 如果没有主密码或访客模式，禁用复制密码功能
        const menuCopyPassword = document.getElementById('menuCopyPassword');
        if (menuCopyPassword) {
            const hidePasswordMenu = !dataManager.data.settings.masterPassword || dataManager.getMode() === 'guest';
            menuCopyPassword.style.display = hidePasswordMenu ? 'none' : 'block';
        }
    }
    
    /**
     * 渲染分类菜单
     */
    renderCategoryMenu() {
        const categories = dataManager.getCategories();
        const categoryMenu = document.getElementById('categoryMenu');
        
        if (!categoryMenu) {
            console.error('找不到分类菜单元素');
            return;
        }
        
        // 使用语言无关的全局分类标识符
        const ALL_CATEGORY = 'ALL';
        
        let html = `<div class="category-item ${this.state.currentCategory === ALL_CATEGORY ? 'active' : ''}" data-category="${ALL_CATEGORY}">
                        <i class="fas fa-globe"></i>
                        <span>${t('all_sites')}</span>
                    </div>`;
        
        categories.forEach(category => {
            // 尝试翻译分类名称，如果没有对应翻译则直接显示原名
            const translatedCategory = t(this.getCategoryTranslationKey(category));
            
            html += `
                <div class="category-item ${this.state.currentCategory === category ? 'active' : ''}" data-category="${category}">
                    <i class="fas fa-folder"></i>
                    <span>${translatedCategory}</span>
                </div>
            `;
        });
        
        categoryMenu.innerHTML = html;
        
        // 绑定分类点击事件
        categoryMenu.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.changeCategory(category);
                
                // 在移动设备上点击分类后关闭侧边栏
                if (window.innerWidth <= 992) {
                    const sidebar = document.querySelector('.sidebar');
                    if (sidebar) {
                        sidebar.classList.remove('open');
                    }
                }
            });
        });
        
        // 更新分类下拉选择框
        if (this.dom.siteCategory) {
            this.dom.siteCategory.innerHTML = '';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                // 使用翻译后的分类名称
                option.textContent = t(this.getCategoryTranslationKey(category));
                this.dom.siteCategory.appendChild(option);
            });
        }
    }
    
    /**
     * 获取分类的翻译键名
     * @param {string} category - 分类名称
     * @returns {string} - 翻译键名
     */
    getCategoryTranslationKey(category) {
        // 检查分类是否已经是翻译键
        if (category === 'frequently_used' || category === 'shopping' || 
            category === 'tools' || category === 'learning' || category === 'entertainment') {
            return category;
        }
        
        // 基于中英文值反向查找翻译键
        const reverseMap = {
            // 中文分类名映射
            '常用': 'frequently_used',
            '购物': 'shopping',
            '工具': 'tools',
            '学习': 'learning',
            '娱乐': 'entertainment',
            // 英文分类名映射
            'Frequently Used': 'frequently_used',
            'Shopping': 'shopping',
            'Tools': 'tools',
            'Learning': 'learning',
            'Entertainment': 'entertainment'
        };
        
        // 返回找到的翻译键或原始分类名
        return reverseMap[category] || category;
    }
    
    /**
     * 切换分类
     * @param {string} category - 分类名称
     */
    changeCategory(category) {
        // 统一将"全部"处理为"ALL"常量，保持内部一致性
        if (category === '全部') {
            category = 'ALL';
        }
        
        this.state.currentCategory = category;
        
        // 清除搜索查询，确保搜索框显示为空
        if (this.state.searchQuery && this.dom.searchInput) {
            this.state.searchQuery = '';
            this.dom.searchInput.value = '';
        }
        
        // 更新当前分类标题
        if (this.dom.currentCategoryTitle) {
            if (category === 'ALL') {
                this.dom.currentCategoryTitle.textContent = t('all_sites');
            } else {
                // 使用翻译资源显示分类名称
                this.dom.currentCategoryTitle.textContent = t(this.getCategoryTranslationKey(category));
            }
        }
        
        this.renderSites();
        
        // 更新URL哈希
        const hashCategory = category === 'ALL' ? 'all' : 'category=' + encodeURIComponent(category);
        window.location.hash = hashCategory;
    }
    
    /**
     * 渲染网站列表
     */
    renderSites() {
        if (!this.dom.sitesGrid) {
            return;
        }
        
        let sites = [];
        
        if (this.state.searchQuery) {
            // 如果有搜索查询，优先使用搜索结果
            sites = dataManager.searchSites(this.state.searchQuery);
            // 更新分类标题以显示搜索状态
            if (this.dom.currentCategoryTitle) {
                this.dom.currentCategoryTitle.textContent = t('search_results');
            }
        } else if (this.state.currentCategory === 'ALL' || this.state.currentCategory === '全部') {
            // 处理全部网站类别（兼容旧的"全部"值)
            sites = dataManager.getAllSites();
            if (this.dom.currentCategoryTitle) {
                this.dom.currentCategoryTitle.textContent = t('all_sites');
            }
        } else {
            // 获取指定分类的网站
            sites = dataManager.getSitesByCategory(this.state.currentCategory);
        }
        
        this.state.currentSites = sites;
        
        if (sites.length === 0) {
            this.dom.sitesGrid.innerHTML = `<div class="empty-message">${t('no_sites_found')}<br><small>${t('add_some_sites')}</small></div>`;
            return;
        }
        
        let html = '';
        sites.forEach(site => {
            // 获取图标URL
            let iconUrl = site.iconUrl || this.getFaviconUrl(site.url);
            
            // 构建备选图标源数组
            let fallbackIcons = [];
            try {
                const urlObj = new URL(site.url);
                const domain = urlObj.hostname;
                
                // 添加备选图标源
                fallbackIcons = [
                    iconUrl, // 首选
                    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`, // Google (高质量)
                    `https://icon.horse/icon/${domain}`, // icon.horse (备选服务)
                    `${urlObj.protocol}//${domain}/favicon.ico` // 直接访问网站favicon
                ];
                
                // 过滤掉重复的URL
                fallbackIcons = [...new Set(fallbackIcons)];
            } catch (e) {
                // URL无效时使用默认图标
                fallbackIcons = [iconUrl];
            }
            
            // 准备默认错误处理图标 (Base64编码避免SVG转义问题)
            const defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMWU4OGU1Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTEgMTcuOTNjLTMuOTUtLjQ5LTctMy44NS03LTcuOTMgMC0uNjIuMDgtMS4yMS4yMS0xLjc5TDkgMTV2MWMwIDEuMS45IDIgMiAydjEuOTN6bTYuOS0yLjU0Yy0uMjYtLjgxLTEtMS4zOS0xLjktMS4zOWgtMXYtM2MwLS41NS0uNDUtMS0xLTFIOHYtMmgyYy41NSAwIDEtLjQ1IDEtMVY3aDJjMS4xIDAgMi0uOSAyLTJ2LS40MWMyLjkzIDEuMTkgNSA0LjA2IDUgNy40MSAwIDIuMDgtLjggMy45Ny0yLjEgNS4zOXoiLz48L3N2Zz4=';
            
            // 创建一个函数，生成图标的onerror处理脚本，自动尝试下一个图标源
            const generateIconFallbackScript = (icons, defaultFallback) => {
                // 简化错误处理逻辑，减少嵌套层级
                let safeIcons = Array.isArray(icons) ? icons.filter(url => url) : [];
                if (safeIcons.length === 0) {
                    return `this.onerror=null;this.src='${defaultFallback}';`;
                }
                
                // 使用URL对象检查URL格式是否有效
                safeIcons = safeIcons.filter(url => {
                    try {
                        new URL(url);
                        return true;
                    } catch(e) {
                        return false;
                    }
                });
                
                // 最多使用三个备选图标，避免过长的链式调用
                safeIcons = safeIcons.slice(0, 3);
                
                if (safeIcons.length === 0) {
                    return `this.onerror=null;this.src='${defaultFallback}';`;
                }
                
                // 构建错误处理脚本
                let script = '';
                safeIcons.forEach((icon, index) => {
                    if (index < safeIcons.length - 1) {
                        script += `this.onerror=function(){this.src='${safeIcons[index+1]}';`;
                    } else {
                        script += `this.onerror=function(){this.src='${defaultFallback}';this.onerror=null;};`;
                    }
                });
                
                // 添加闭合括号
                for (let i = 0; i < safeIcons.length - 1; i++) {
                    script += `};`;
                }
                
                return script;
            };
            
            // 生成错误处理脚本
            const errorScript = generateIconFallbackScript(fallbackIcons, defaultIcon);
            
            // 格式化URL显示（去掉http://和https://前缀，限制长度）
            let displayUrl = site.url.replace(/^https?:\/\//, '');
            if (displayUrl.length > 30) {
                displayUrl = displayUrl.substring(0, 27) + '...';
            }
            
            // 格式化备注信息（如果存在）
            let notesDisplay = '';
            if (site.notes) {
                // 裁剪备注，避免过长
                const notesText = site.notes.length > 50 ? site.notes.substring(0, 47) + '...' : site.notes;
                notesDisplay = `
                    <div class="site-notes-content">
                        <div class="notes-label">${t('site_notes')}:</div>
                        <div class="notes-text">${notesText}</div>
                    </div>
                `;
            }
            
            // 显示访问次数
            const visitsCount = site.visits || 0;
            
            html += `
                <div class="site-card" data-id="${site.id}">
                    <div class="site-header">
                        <div class="site-icon-container">
                            <img src="${iconUrl}" alt="${site.name}" class="site-icon" loading="lazy" onerror="${errorScript}">
                        </div>
                        <div class="site-info">
                            <div class="site-name" title="${site.name}">${site.name}</div>
                            <div class="site-url" title="${site.url}">${displayUrl}</div>
                        </div>
                    </div>
                    
                    <div class="site-details">
                        ${notesDisplay}
                        <div class="site-meta">
                            <div class="site-category">
                                <i class="fas fa-folder"></i> ${t(this.getCategoryTranslationKey(site.category))}
                            </div>
                            <div class="site-visits">
                                <i class="fas fa-eye"></i> ${visitsCount}
                            </div>
                        </div>
                    </div>
                    
                    <div class="site-actions">
                        <button class="action-btn open-btn" title="${t('open_site')}">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="action-btn copy-url-btn" title="${t('copy_url')}">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-btn edit-btn" title="${t('edit')}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        this.dom.sitesGrid.innerHTML = html;
        
        // 绑定网站卡片点击事件
        this.dom.sitesGrid.querySelectorAll('.site-card').forEach(card => {
            const id = card.dataset.id;
            const site = sites.find(s => s.id === id);
            
            if (!site) return;
            
            // 打开网站按钮
            const openBtn = card.querySelector('.open-btn');
            if (openBtn) {
                openBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止冒泡
                    try {
                        // 增加访问次数
                        dataManager.incrementVisits(site.id);
                        // 在新标签页打开网站
                        window.open(site.url, '_blank');
                    } catch (err) {
                        console.error('打开网站失败:', err);
                        this.showNotification(t('open_site_failed'), 'error');
                    }
                });
            }
            
            // 复制URL按钮
            const copyUrlBtn = card.querySelector('.copy-url-btn');
            if (copyUrlBtn) {
                copyUrlBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止冒泡
                    navigator.clipboard.writeText(site.url)
                        .then(() => {
                            this.showNotification(t('url_copied'), 'success');
                        })
                        .catch(() => {
                            this.showNotification(t('copy_failed'), 'error');
                        });
                });
            }
            
            // 编辑按钮
            const editBtn = card.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止冒泡
                    this.state.selectedSiteId = site.id;
                    this.handleEditSite();
                });
            }
            
            // 右键菜单
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.state.selectedSiteId = id;
                
                // 显示右键菜单
                if (this.dom.contextMenu) {
                    // 首先隐藏菜单以便能得到其实际尺寸
                    this.dom.contextMenu.style.opacity = '0';
                    this.dom.contextMenu.style.display = 'block';
                    
                    // 获取菜单尺寸和视口尺寸
                    setTimeout(() => {
                        const menuWidth = this.dom.contextMenu.offsetWidth || 180;
                        const menuHeight = this.dom.contextMenu.offsetHeight || 150;
                        const viewportWidth = window.innerWidth;
                        const viewportHeight = window.innerHeight;
                        
                        // 计算合适的位置
                        let left = e.clientX; // 使用clientX而非pageX来避免滚动位置影响
                        let top = e.clientY;
                        
                        // 确保右键菜单不超出屏幕
                        if (left + menuWidth > viewportWidth) {
                            left = viewportWidth - menuWidth - 5;
                        }
                        
                        if (top + menuHeight > viewportHeight) {
                            top = viewportHeight - menuHeight - 5;
                        }
                        
                        // 确保右键菜单不会出现在屏幕外
                        left = Math.max(5, left);
                        top = Math.max(5, top);
                        
                        // 设置位置并显示
                        this.dom.contextMenu.style.left = `${left}px`;
                        this.dom.contextMenu.style.top = `${top}px`;
                        this.dom.contextMenu.style.opacity = '1';
                    }, 0);
                }
            });
            
            // 添加触摸设备长按支持
            let touchTimeout;
            let touchStartX, touchStartY;
            
            card.addEventListener('touchstart', (e) => {
                if (e.touches.length !== 1) return; // 只处理单指触摸
                
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                
                touchTimeout = setTimeout(() => {
                    this.state.selectedSiteId = id;
                    
                    if (this.dom.contextMenu) {
                        // 首先隐藏菜单以便能得到其实际尺寸
                        this.dom.contextMenu.style.opacity = '0';
                        this.dom.contextMenu.style.display = 'block';
                        
                        setTimeout(() => {
                            // 获取元素位置
                            const rect = card.getBoundingClientRect();
                            const menuWidth = this.dom.contextMenu.offsetWidth || 180;
                            const menuHeight = this.dom.contextMenu.offsetHeight || 150;
                            const viewportWidth = window.innerWidth;
                            const viewportHeight = window.innerHeight;
                            
                            // 在触摸位置显示菜单
                            let left = touchStartX;
                            let top = touchStartY;
                            
                            // 确保右键菜单不超出屏幕
                            if (left + menuWidth > viewportWidth) {
                                left = viewportWidth - menuWidth - 5;
                            }
                            
                            if (top + menuHeight > viewportHeight) {
                                top = viewportHeight - menuHeight - 5;
                            }
                            
                            // 确保右键菜单不会出现在屏幕外
                            left = Math.max(5, left);
                            top = Math.max(5, top);
                            
                            // 设置位置并显示
                            this.dom.contextMenu.style.left = `${left}px`;
                            this.dom.contextMenu.style.top = `${top}px`;
                            this.dom.contextMenu.style.opacity = '1';
                            
                            // 提供触觉反馈（如果支持）
                            if (window.navigator && window.navigator.vibrate) {
                                window.navigator.vibrate(50);
                            }
                        }, 0);
                    }
                }, 500);
            });
            
            card.addEventListener('touchend', () => {
                clearTimeout(touchTimeout);
            });
            
            card.addEventListener('touchmove', (e) => {
                // 只有当移动距离超过阈值时才取消长按
                if (e.touches.length !== 1) {
                    clearTimeout(touchTimeout);
                    return;
                }
                
                const moveX = e.touches[0].clientX;
                const moveY = e.touches[0].clientY;
                const moveThreshold = 10; // 10px移动阈值
                
                if (Math.abs(moveX - touchStartX) > moveThreshold || 
                    Math.abs(moveY - touchStartY) > moveThreshold) {
                    clearTimeout(touchTimeout);
                }
            });
        });
    }
    
    /**
     * 获取网站favicon URL，尝试多种服务提高成功率
     * @param {string} url - 网站URL
     * @returns {string} - favicon URL
     */
    getFaviconUrl(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            
            // 使用多个favicon服务，按照可靠性排序
            // 返回Google服务，它通常提供最好的兼容性
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch (e) {
            // 出错时使用默认图标，避免在控制台输出错误信息
            return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMWU4OGU1Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTEgMTcuOTNjLTMuOTUtLjQ5LTctMy44NS03LTcuOTMgMC0uNjIuMDgtMS4yMS4yMS0xLjc5TDkgMTV2MWMwIDEuMS45IDIgMiAydjEuOTN6bTYuOS0yLjU0Yy0uMjYtLjgxLTEtMS4zOS0xLjktMS4zOWgtMXYtM2MwLS41NS0uNDUtMS0xLTFIOHYtMmgyYy41NSAwIDEtLjQ1IDEtMVY3aDJjMS4xIDAgMi0uOSAyLTJ2LS40MWMyLjkzIDEuMTkgNSA0LjA2IDUgNy40MSAwIDIuMDgtLjggMy45Ny0yLjEgNS4zOXoiLz48L3N2Zz4=';
        }
    }
    
    /**
     * 预加载多个图像，找到第一个可用的作为备选
     * 这有助于在第一个图标加载失败时快速切换到备用图标
     * @param {...string} urls - 图像URL列表
     */
    preloadImage(...urls) {
        // 只在开发环境中进行图标预加载，减少生产环境的网络请求
        // 因为我们已经在图像元素上使用了onerror处理
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            if (!this._faviconCache) {
                this._faviconCache = new Map();
            }
            
            urls.forEach(url => {
                // 避免重复预加载
                if (this._faviconCache.has(url)) {
                    return;
                }
                
                const img = new Image();
                img.onload = () => {
                    this._faviconCache.set(url, true);
                };
                img.onerror = () => {
                    this._faviconCache.set(url, false);
                };
                img.src = url;
            });
        }
    }
    
    /**
     * 打开添加网站弹窗
     */
    openAddSiteModal() {
        // 设置为添加模式
        this.state.isEditing = false;
        
        // 更新标题
        if (this.dom.addSiteModalTitle) {
            this.dom.addSiteModalTitle.textContent = t('add_new_site');
        }
        
        // 重置表单
        if (this.dom.addSiteForm) {
            this.dom.addSiteForm.reset();
        }
        
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = t('no_file_selected');
        }
        
        // 使用通用函数打开模态框
        this.showModal(this.dom.addSiteModal);
    }
    
    /**
     * 处理添加网站提交
     * @param {Event} e - 事件对象
     */
    handleAddSite(e) {
        e.preventDefault();
        
        // 获取表单数据
        const siteName = document.getElementById('siteName')?.value?.trim();
        const siteUrl = document.getElementById('siteUrl')?.value?.trim();
        const siteCategory = document.getElementById('siteCategory')?.value;
        const siteNotes = document.getElementById('siteNotes')?.value?.trim();
        
        // 验证必填字段
        if (!siteName) {
            this.showNotification(t('site_name') + ' ' + t('is_required'), 'error');
            return;
        }
        
        if (!siteUrl) {
            this.showNotification(t('site_url') + ' ' + t('is_required'), 'error');
            return;
        }
        
        // 使用 dataManager 验证和修复 URL
        const validUrl = dataManager.validateAndFixUrl(siteUrl);
        if (!validUrl) {
            this.showNotification(t('invalid_url'), 'error');
            return;
        }
        
        const site = {
            name: siteName,
            url: validUrl,
            category: siteCategory,
            notes: siteNotes
        };
        
        // 处理自定义图标
        const iconFile = document.getElementById('siteIcon')?.files[0];
        if (iconFile) {
            // 验证文件类型
            if (!iconFile.type.startsWith('image/')) {
                this.showNotification(t('invalid_icon_type'), 'error');
                return;
            }
            
            // 验证文件大小
            if (iconFile.size > 2 * 1024 * 1024) { // 2MB
                this.showNotification(t('icon_too_large'), 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                site.iconUrl = e.target.result;
                
                if (this.state.isEditing) {
                    this.completeUpdateSite(this.state.selectedSiteId, site);
                } else {
                    this.completeSiteAdd(site);
                }
            };
            reader.onerror = () => {
                this.showNotification(t('icon_read_error'), 'error');
            };
            reader.readAsDataURL(iconFile);
        } else {
            // 获取网站 favicon
            site.iconUrl = this.getFaviconUrl(validUrl);
            
            if (this.state.isEditing) {
                this.completeUpdateSite(this.state.selectedSiteId, site);
            } else {
                this.completeSiteAdd(site);
            }
        }
    }
    
    /**
     * 完成网站添加
     * @param {object} site - 网站对象
     */
    completeSiteAdd(site) {
        if (dataManager.addSite(site)) {
            // 关闭弹窗
            this.hideModal(this.dom.addSiteModal);
            
            // 显示成功提示
            this.showNotification(t('site_add_success'), 'success');
            
            // 重新渲染
            this.renderSites();
        } else {
            this.showNotification(t('site_add_failed'), 'error');
        }
    }
    
    /**
     * 打开分类管理弹窗
     */
    openCategoryModal() {
        this.renderCategoryList();
        this.showModal(this.dom.categoryModal);
    }
    
    /**
     * 渲染分类列表
     */
    renderCategoryList() {
        if (!this.dom.categoryList) {
            console.error('分类列表DOM元素未找到');
            return;
        }
        
        const categories = dataManager.getCategories();
        let html = '';
        
        categories.forEach((category, index) => {
            html += `
                <div class="category-list-item" draggable="true" data-index="${index}">
                    <div class="drag-handle"><i class="fas fa-grip-lines"></i></div>
                    <div class="category-name">${category}</div>
                    <div class="category-actions">
                        <button class="edit-btn" data-index="${index}"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        
        this.dom.categoryList.innerHTML = html;
        
        // 绑定编辑和删除按钮
        this.dom.categoryList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                const category = categories[index];
                const newName = prompt(t('enter_new_category'), category);
                if (newName && newName !== category) {
                    if (dataManager.updateCategory(index, newName)) {
                        this.renderCategoryList();
                        this.showNotification(t('category_update_success'), 'success');
                    } else {
                        this.showNotification(t('category_update_failed'), 'error');
                    }
                }
            });
        });
        
        this.dom.categoryList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                const category = categories[index];
                if (confirm(t('confirm_delete_category', {category: category}))) {
                    if (dataManager.deleteCategory(index)) {
                        this.renderCategoryList();
                        this.showNotification(t('category_delete_success'), 'success');
                    } else {
                        this.showNotification(t('category_delete_failed'), 'error');
                    }
                }
            });
        });
        
        // 拖拽排序
        this.setupDragAndDrop();
    }
    
    /**
     * 设置拖拽排序功能
     */
    setupDragAndDrop() {
        if (!this.dom.categoryList) return;
        
        const listItems = this.dom.categoryList.querySelectorAll('.category-list-item');
        
        listItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.state.draggedCategory = item;
                this.state.draggedCategoryIndex = parseInt(item.dataset.index);
                setTimeout(() => {
                    item.classList.add('dragging');
                }, 0);
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.state.draggedCategory = null;
                this.state.draggedCategoryIndex = -1;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.state.draggedCategory !== item) {
                    item.classList.add('drag-over');
                }
            });
            
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                if (this.state.draggedCategory !== item) {
                    const targetIndex = parseInt(item.dataset.index);
                    const categories = dataManager.getCategories();
                    const movedCategory = categories[this.state.draggedCategoryIndex];
                    
                    // 从数组中移除拖动的项
                    categories.splice(this.state.draggedCategoryIndex, 1);
                    // 插入到新位置
                    categories.splice(targetIndex, 0, movedCategory);
                    
                    // 更新数据
                    dataManager.updateCategoryOrder(categories);
                    
                    // 重新渲染
                    this.renderCategoryList();
                }
            });
        });
    }
    
    /**
     * 处理添加分类
     */
    handleAddCategory() {
        if (!this.dom.newCategoryName) return;
        
        const name = this.dom.newCategoryName.value.trim();
        if (name) {
            if (dataManager.addCategory(name)) {
                this.dom.newCategoryName.value = '';
                this.renderCategoryList();
                this.renderCategoryMenu();
                this.showNotification(t('category_add_success'), 'success');
            } else {
                this.showNotification(t('category_add_failed'), 'error');
            }
        } else {
            this.showNotification(t('category_name_required'), 'error');
        }
    }
    
    /**
     * 处理保存分类
     */
    handleSaveCategories() {
        if (this.dom.categoryModal) {
            this.dom.categoryModal.style.display = 'none';
        }
        this.renderCategoryMenu();
        this.showNotification(t('category_update_success'), 'success');
    }
    
    /**
     * 处理编辑网站
     */
    handleEditSite() {
        const id = this.state.selectedSiteId;
        if (!id) return;
        
        const site = dataManager.getAllSites().find(s => s.id === id);
        
        if (site) {
            // 设置为编辑模式
            this.state.isEditing = true;
            
            // 更新弹窗标题
            if (this.dom.addSiteModalTitle) {
                this.dom.addSiteModalTitle.textContent = t('edit_site');
            }
            
            // 重置表单
            if (this.dom.addSiteForm) {
                this.dom.addSiteForm.reset();
            }
            
            const fileNameDisplay = document.getElementById('fileNameDisplay');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = t('no_file_selected');
            }
            
            // 填充表单数据
            const siteNameInput = document.getElementById('siteName');
            const siteUrlInput = document.getElementById('siteUrl');
            const siteCategoryInput = document.getElementById('siteCategory');
            const siteNotesInput = document.getElementById('siteNotes');
            
            if (siteNameInput) siteNameInput.value = site.name;
            if (siteUrlInput) siteUrlInput.value = site.url;
            if (siteCategoryInput) siteCategoryInput.value = site.category;
            
            // 直接填充备注信息，无需密码验证
            if (siteNotesInput) siteNotesInput.value = site.notes || '';
            this.openEditModal();
        }
        
        // 关闭右键菜单
        if (this.dom.contextMenu) {
            this.dom.contextMenu.style.display = 'none';
        }
    }
    
    /**
     * 打开编辑模态框
     */
    openEditModal() {
        // 打开模态框
        if (this.dom.addSiteModal) {
            this.dom.addSiteModal.style.display = 'flex';
        }
    }
    
    /**
     * 完成更新网站
     * @param {string} id - 网站ID
     * @param {object} updates - 更新内容
     */
    completeUpdateSite(id, updates) {
        if (dataManager.updateSite(id, updates)) {
            // 关闭弹窗
            if (this.dom.addSiteModal) {
                this.dom.addSiteModal.style.display = 'none';
            }
            
            // 显示成功提示
            this.showNotification(t('site_update_success'), 'success');
            
            // 重新渲染
            this.renderSites();
            
            // 重置编辑模式
            this.state.isEditing = false;
        } else {
            this.showNotification(t('site_update_failed'), 'error');
        }
    }
    
    /**
     * 处理删除网站
     */
    handleDeleteSite() {
        const id = this.state.selectedSiteId;
        if (!id) return;
        
        const site = dataManager.getAllSites().find(s => s.id === id);
        
        if (site && confirm(t('confirm_delete_site', {site: site.name}))) {
            if (dataManager.deleteSite(id)) {
                this.showNotification(t('site_delete_success'), 'success');
                this.renderSites();
            } else {
                this.showNotification(t('site_delete_failed'), 'error');
            }
        }
        
        // 关闭右键菜单
        if (this.dom.contextMenu) {
            this.dom.contextMenu.style.display = 'none';
        }
    }
    
    /**
     * 处理复制URL
     */
    handleCopyUrl() {
        const id = this.state.selectedSiteId;
        if (!id) return;
        
        const site = dataManager.getAllSites().find(s => s.id === id);
        
        if (site) {
            navigator.clipboard.writeText(site.url)
                .then(() => {
                    this.showNotification(t('url_copied'), 'success');
                })
                .catch(() => {
                    this.showNotification(t('copy_failed'), 'error');
                });
        }
        
        // 关闭右键菜单
        if (this.dom.contextMenu) {
            this.dom.contextMenu.style.display = 'none';
        }
    }
    
    /**
     * 处理复制密码
     */
    handleCopyPassword() {
        const id = this.state.selectedSiteId;
        if (!id) return;
        
        const site = dataManager.getAllSites().find(s => s.id === id);
        
        if (site && site.notes) {
            // 直接复制备注内容，无需密码验证
            navigator.clipboard.writeText(site.notes)
                .then(() => {
                    this.showNotification(t('notes_copied'), 'success');
                })
                .catch(() => {
                    this.showNotification(t('copy_failed'), 'error');
                });
        } else {
            this.showNotification(t('no_notes'), 'error');
        }
        
        // 关闭右键菜单
        if (this.dom.contextMenu) {
            this.dom.contextMenu.style.display = 'none';
        }
    }
    
    /**
     * 请求密码
     * @param {Function} callback - 密码验证成功后的回调函数
     */
    requestPassword(callback) {
        this.state.passwordCallback = callback;
        if (this.dom.passwordForm) {
            this.dom.passwordForm.reset();
        }
        if (this.dom.passwordModal) {
            this.dom.passwordModal.style.display = 'flex';
            
            // 确保关闭按钮可以正常工作
            const closeBtn = this.dom.passwordModal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    this.dom.passwordModal.style.display = 'none';
                };
            }
        }
    }
    
    /**
     * 处理密码验证
     * @param {Event} e - 事件对象
     */
    handlePasswordVerify(e) {
        e.preventDefault();
        
        const masterPassword = document.getElementById('masterPassword')?.value;
        if (!masterPassword) return;
        
        if (dataManager.verifyMasterPassword(masterPassword)) {
            if (this.dom.passwordModal) {
                this.dom.passwordModal.style.display = 'none';
            }
            if (this.state.passwordCallback) {
                this.state.passwordCallback(masterPassword);
                this.state.passwordCallback = null;
            }
        } else {
            this.showNotification(t('password_error'), 'error');
        }
    }
    
    /**
     * 处理导入数据
     */
    handleImportData() {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,application/json';
        
        // 监听文件选择
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // 检查文件大小
            if (file.size > 10 * 1024 * 1024) { // 10MB
                this.showNotification(t('import_error') + ': ' + '文件过大', 'error');
                return;
            }
            
            // 添加导入中提示
            this.showNotification(t('importing_data'), 'info');
            
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const data = event.target.result;
                
                // 检测是否为加密数据
                const isEncrypted = data.startsWith('U2F') || data.includes('AES');
                
                if (isEncrypted) {
                    // 弹出密码输入框
                    const password = prompt(t('enter_import_password'));
                    if (password === null) return; // 用户取消
                    
                    // 尝试导入
                    if (dataManager.importData(data, true, password)) {
                        this.showNotification(t('import_success'), 'success');
                        this.renderCategoryMenu();
                        this.renderSites();
                    } else {
                        this.showNotification(t('import_error'), 'error');
                    }
                } else {
                    // 非加密数据直接导入
                    if (dataManager.importData(data)) {
                        this.showNotification(t('import_success'), 'success');
                        this.renderCategoryMenu();
                        this.renderSites();
                    } else {
                        this.showNotification(t('import_error'), 'error');
                    }
                }
            };
            
            reader.onerror = () => {
                this.showNotification(t('import_error'), 'error');
            };
            
            // 读取文件
            reader.readAsText(file);
        });
        
        // 触发文件选择
        fileInput.click();
    }
    
    /**
     * 处理导出数据
     */
    handleExportData() {
        // 询问是否包含备份历史
        const includeBackups = confirm(t('include_backups_confirm'));
        
        // 询问是否加密
        const encrypt = confirm(t('encrypt_export_confirm'));
        
        let password = null;
        if (encrypt) {
            // 弹出密码输入框
            password = prompt(t('enter_export_password'));
            if (password === null) return; // 用户取消
            
            // 确认密码
            const confirmPassword = prompt(t('confirm_export_password'));
            if (confirmPassword !== password) {
                this.showNotification(t('password_mismatch'), 'error');
                return;
            }
        }
        
        // 导出数据
        const data = dataManager.exportData(encrypt, password, includeBackups);
        
        // 生成文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `vividDH_export_${timestamp}${encrypt ? '_encrypted' : ''}.json`;
        
        // 下载数据
        this.downloadData(data, filename);
        
        this.showNotification(t('export_success'), 'success');
    }
    
    /**
     * 下载数据
     * @param {string} data - 要下载的数据
     * @param {string} filename - 文件名
     */
    downloadData(data, filename) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(t('data_export_success'), 'success');
    }
    
    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型（'success'或'error'）
     */
    showNotification(message, type) {
        if (!this.dom.notification) {
            console.error('通知元素未找到');
            return;
        }
        
        const notification = this.dom.notification;
        const messageElement = notification.querySelector('.notification-message');
        
        if (!messageElement) {
            console.error('通知消息元素未找到');
            return;
        }
        
        notification.className = 'notification ' + type;
        messageElement.textContent = message;
        
        notification.style.display = 'block';
        
        // 3秒后自动消失
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    /**
     * 初始化文件上传按钮
     */
    initFileUpload() {
        const chooseFileBtn = document.getElementById('chooseFileBtn');
        const siteIcon = document.getElementById('siteIcon');
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        
        if (chooseFileBtn && siteIcon) {
            chooseFileBtn.addEventListener('click', () => {
                siteIcon.click();
            });
            
            if (siteIcon && fileNameDisplay) {
                siteIcon.addEventListener('change', (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        fileNameDisplay.textContent = file.name;
                    } else {
                        fileNameDisplay.textContent = t('no_file_selected');
                    }
                });
            }
        }
    }

    /**
     * 显示模态框
     * @param {Element|string} modal - 模态框元素或ID
     */
    showModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        
        if (!modal) return;
        
        // 确保所有其他模态框关闭
        document.querySelectorAll('.modal').forEach(m => {
            if (m !== modal && m.style.display !== 'none') {
                m.style.display = 'none';
            }
        });
        
        // 显示模态框
        modal.style.display = 'flex';
        
        // 触发显示事件
        const event = new CustomEvent('modalshow', { bubbles: true });
        modal.dispatchEvent(event);
    }
    
    /**
     * 隐藏模态框
     * @param {Element|string} modal - 模态框元素或ID
     */
    hideModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        
        if (!modal) return;
        
        // 隐藏模态框
        modal.style.display = 'none';
        
        // 触发隐藏事件
        const event = new CustomEvent('modalhide', { bubbles: true });
        modal.dispatchEvent(event);
    }
    
    /**
     * 隐藏所有模态框
     */
    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.hideModal(modal);
        });
    }
}

// 导出单例实例
const uiRenderer = new UIRenderer(); 