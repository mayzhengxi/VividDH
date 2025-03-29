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
            // 应用当前语言到页面
            this.updatePageLanguage();
            
            // 初始化语言选择下拉框
            this.initLanguageSelect();
        } catch (error) {
            console.error('初始化语言设置失败:', error);
        }
    }
    
    /**
     * 初始化语言选择下拉框
     */
    initLanguageSelect() {
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            // 设置下拉框当前值为当前语言
            const currentLang = getCurrentLanguage();
            languageSelect.value = currentLang;
            
            // 监听语言选择变化
            this.safeAddEventListener(languageSelect, 'change', () => {
                const selectedLang = languageSelect.value;
                this.handleLanguageChange(selectedLang);
            });
        }
    }
    
    /**
     * 处理语言变更
     * @param {string} langCode - 语言代码
     */
    handleLanguageChange(langCode) {
        console.log('切换语言到:', langCode);
        
        // 设置语言
        if (typeof setLanguage === 'function') {
            setLanguage(langCode);
        } else {
            console.error('语言切换功能不可用');
            this.showNotification('语言切换功能不可用', 'error');
            return;
        }
        
        // 使用i18n.js中的updatePageText函数更新页面文本
        updatePageText();
        
        // 重新渲染界面
        this.renderCategoryMenu();
        this.renderSites();
        
        // 显示通知
        this.showNotification(t('language_changed'), 'success');
    }
    
    /**
     * 更新页面中所有文本为当前语言
     */
    updatePageLanguage() {
        // 使用i18n.js中的updatePageText函数
        if (typeof updatePageText === 'function') {
            updatePageText();
        } else {
            // 后备方案
            // 更新所有带有data-i18n属性的元素
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                el.textContent = t(key);
            });
            
            // 更新所有带有data-i18n-placeholder属性的输入框
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                el.placeholder = t(key);
            });
            
            // 更新页面标题
            document.title = t('app_name') + ' - ' + (getCurrentLanguage() === 'zh-CN' ? '您的个人网站管理中心' : 'Your Personal Website Manager');
        }
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
        
        // 使用事件委托处理模态框关闭按钮事件
        // 这样即使模态框是动态创建的也能正确响应
        this.safeAddEventListener(document, 'click', (e) => {
            // 检查点击的是否是关闭按钮
            if (e.target.classList.contains('close-btn') || 
                e.target.parentElement.classList.contains('close-btn') ||
                e.target.classList.contains('cancel-btn')) {
                
                // 查找最近的模态框
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    
                    // 重置编辑模式
                    this.state.isEditing = false;
                } else {
                    // 如果找不到特定模态框，关闭所有模态框
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                    // 重置编辑模式
                    this.state.isEditing = false;
                }
            }
            
            // 点击文档任何地方关闭右键菜单
            if (this.dom.contextMenu && this.dom.contextMenu.style.display === 'block') {
                // 如果点击的不是右键菜单本身及其子元素
                if (!this.dom.contextMenu.contains(e.target)) {
                    this.dom.contextMenu.style.display = 'none';
                }
            }
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
        try {
            console.log('初始化UI...');
            
            // 确保事件绑定只执行一次
            this.bindEvents();
            
            // 渲染分类菜单
            this.renderCategoryMenu();
            
            // 渲染网站列表
            this.renderSites();
            
            // 检查是否有权访问敏感数据
            this.checkSensitiveAccess();
            
            // 初始化文件选择按钮
            this.initFileUpload();
            
            console.log('UI初始化完成');
        } catch (error) {
            console.error('UI初始化失败:', error);
        }
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
        // 将中文分类名转换为对应的国际化键名
        const categoryMap = {
            '常用': 'frequently_used',
            '购物': 'shopping',
            '工具': 'tools',
            '学习': 'learning',
            '娱乐': 'entertainment'
        };
        
        return categoryMap[category] || category;
    }
    
    /**
     * 切换分类
     * @param {string} category - 分类名称
     */
    changeCategory(category) {
        this.state.currentCategory = category;
        
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
            console.error('无法找到站点网格容器');
            return;
        }
        
        let sites = [];
        
        if (this.state.searchQuery) {
            sites = dataManager.searchSites(this.state.searchQuery);
        } else if (this.state.currentCategory === 'ALL') {
            sites = dataManager.getAllSites();
        } else {
            sites = dataManager.getSitesByCategory(this.state.currentCategory);
        }
        
        this.state.currentSites = sites;
        
        if (sites.length === 0) {
            this.dom.sitesGrid.innerHTML = `<div class="empty-message">${t('no_sites_found')}<br><small>${t('add_some_sites')}</small></div>`;
            return;
        }
        
        let html = '';
        sites.forEach(site => {
            // 获取图标URL或使用默认图标
            let iconUrl = site.iconUrl || this.getFaviconUrl(site.url);
            
            // 准备备选图标源，用于在主图标加载失败时切换
            const urlObj = new URL(site.url);
            const domain = urlObj.hostname;
            const fallbackIcons = [
                `${urlObj.protocol}//${domain}/favicon.ico`,
                `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
                `https://icons.duckduckgo.com/ip3/${domain}.ico`,
                `https://favicon.yandex.net/favicon/${domain}`
            ];
            
            // 准备默认错误处理图标 (Base64编码避免SVG转义问题)
            const defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMWU4OGU1Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTEgMTcuOTNjLTMuOTUtLjQ5LTctMy44NS03LTcuOTMgMC0uNjIuMDgtMS4yMS4yMS0xLjc5TDkgMTV2MWMwIDEuMS45IDIgMiAydjEuOTN6bTYuOS0yLjU0Yy0uMjYtLjgxLTEtMS4zOS0xLjktMS4zOWgtMXYtM2MwLS41NS0uNDUtMS0xLTFIOHYtMmgyYy41NSAwIDEtLjQ1IDEtMVY3aDJjMS4xIDAgMi0uOSAyLTJ2LS40MWMyLjkzIDEuMTkgNSA0LjA2IDUgNy40MSAwIDIuMDgtLjggMy45Ny0yLjEgNS4zOXoiLz48L3N2Zz4=';
            
            // 创建一个函数，生成图标的onerror处理脚本，自动尝试下一个图标源
            const generateIconFallbackScript = (icons, defaultFallback) => {
                let script = '';
                icons.forEach((icon, index) => {
                    if (index < icons.length - 1) {
                        script += `this.onerror=function(){this.src='${icons[index+1]}';this.onerror=`;
                    }
                });
                // 添加最终的错误处理
                script += `function(){this.src='${defaultFallback}';this.onerror=null;};`;
                // 闭合所有嵌套的函数调用
                for (let i = 0; i < icons.length - 1; i++) {
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
                    this.dom.contextMenu.style.display = 'block';
                    
                    // 确保菜单不超出视口边界
                    const menuWidth = this.dom.contextMenu.offsetWidth || 180;
                    const menuHeight = this.dom.contextMenu.offsetHeight || 150;
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    let left = e.pageX;
                    let top = e.pageY;
                    
                    if (left + menuWidth > viewportWidth) {
                        left = viewportWidth - menuWidth - 5;
                    }
                    
                    if (top + menuHeight > viewportHeight) {
                        top = viewportHeight - menuHeight - 5;
                    }
                    
                    this.dom.contextMenu.style.left = `${left}px`;
                    this.dom.contextMenu.style.top = `${top}px`;
                }
            });
            
            // 添加触摸设备长按支持
            let touchTimeout;
            card.addEventListener('touchstart', (e) => {
                touchTimeout = setTimeout(() => {
                    this.state.selectedSiteId = id;
                    
                    if (this.dom.contextMenu) {
                        const rect = card.getBoundingClientRect();
                        this.dom.contextMenu.style.display = 'block';
                        this.dom.contextMenu.style.left = `${rect.left + rect.width/2 - 90}px`;
                        this.dom.contextMenu.style.top = `${rect.top + rect.height}px`;
                    }
                }, 500);
            });
            
            card.addEventListener('touchend', () => {
                clearTimeout(touchTimeout);
            });
            
            card.addEventListener('touchmove', () => {
                clearTimeout(touchTimeout);
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
            // 1. 直接从网站获取favicon.ico (最常见的favicon名称)
            const directFavicon = `${urlObj.protocol}//${domain}/favicon.ico`;
            
            // 2. 使用Google的favicon服务
            const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            
            // 3. 使用DuckDuckGo的favicon服务
            const ddgFavicon = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
            
            // 4. 使用Yandex的favicon服务
            const yandexFavicon = `https://favicon.yandex.net/favicon/${domain}`;
            
            // 创建图像预加载系统
            this.preloadImage(directFavicon, googleFavicon, ddgFavicon, yandexFavicon);
            
            // 首先尝试Google的服务，因为它提供大尺寸图标
            return googleFavicon;
        } catch (e) {
            console.error('获取网站图标失败:', e);
            return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMWU4OGU1Ij48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTEgMTcuOTNjLTMuOTUtLjQ5LTctMy44NS03LTcuOTMgMC0uNjIuMDgtMS4yMS4yMS0xLjc5TDkgMTV2MWMwIDEuMS45IDIgMiAydjEuOTN6bTYuOS0yLjU0Yy0uMjYtLjgxLTEtMS4zOS0xLjktMS4zOWgtMXYtM2MwLS41NS0uNDUtMS0xLTFIOHYtMmgyYy41NSAwIDEtLjQ1IDEtMVY3aDJjMS4xIDAgMi0uOSAyLTJ2LS40MWMyLjkzIDEuMTkgNSA0LjA2IDUgNy40MSAwIDIuMDgtLjggMy45Ny0yLjEgNS4zOXoiLz48L3N2Zz4=';
        }
    }
    
    /**
     * 预加载多个图像，找到第一个可用的作为备选
     * 这有助于在第一个图标加载失败时快速切换到备用图标
     * @param {...string} urls - 图像URL列表
     */
    preloadImage(...urls) {
        // 保存站点图标的加载状态
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
        
        // 打开弹窗
        if (this.dom.addSiteModal) {
            this.dom.addSiteModal.style.display = 'flex';
        }
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
        
        // 验证URL格式
        let validUrl = siteUrl;
        if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
            validUrl = 'https://' + validUrl;
        }
        
        try {
            // 测试URL是否有效
            new URL(validUrl);
        } catch (e) {
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
            if (this.dom.addSiteModal) {
                this.dom.addSiteModal.style.display = 'none';
            }
            
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
        if (this.dom.categoryModal) {
            this.dom.categoryModal.style.display = 'flex';
            
            // 确保关闭按钮可以正常工作
            const closeBtn = this.dom.categoryModal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    this.dom.categoryModal.style.display = 'none';
                };
            }
        }
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
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result;
                    if (typeof content !== 'string') return;
                    
                    // 导入非加密数据
                    if (dataManager.importData(content, false)) {
                        this.showNotification(t('data_import_success'), 'success');
                        this.init();
                    } else {
                        this.showNotification(t('data_import_failed'), 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        // 在防重复执行标记重置之前点击，确保只执行一次
        input.click();
    }
    
    /**
     * 处理导出数据
     */
    handleExportData() {
        console.log('处理导出数据');
        
        // 直接导出非加密数据
        const exportData = dataManager.exportData(false);
        this.downloadData(exportData, 'navigation_station_data.json');
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
}

// 导出单例实例
const uiRenderer = new UIRenderer(); 