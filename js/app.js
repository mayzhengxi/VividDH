/**
 * 导航站主应用
 * 负责初始化应用、设置路由和加载样例数据
 */
class App {
    /**
     * 构造函数
     */
    constructor() {
        // 禁用日志输出
        this.log = () => {};
        this.error = () => {};
        
        // 确保只初始化一次
        if (window.app) {
            return window.app;
        }
        
        // 应用初始化
        this.init();
        
        // 保存实例引用
        window.app = this;
    }

    /**
     * 初始化应用
     */
    init() {
        // 确保DOM完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    /**
     * 设置应用
     */
    setupApp() {
        try {
            // 确保DOM已完全加载
            
            // 防止重复初始化
            if (window.uiRenderer) {
                // UIRenderer实例已存在，跳过重复初始化
            } else {
                // 1. 初始化UI渲染器（会自动绑定事件）
                window.uiRenderer = new UIRenderer();
            }
            
            // 2. 第一次访问加载样例数据
            this.loadSampleData();
            
            // 3. 进行UI初始化（渲染界面）
            if (uiRenderer) {
                uiRenderer.init();
            }
            
            // 4. 设置路由
            this.setupRouting();
            
            // 5. 显示网站介绍弹窗
            setTimeout(() => {
                try {
                    if (uiRenderer) {
                        this.showIntroduction();
                    }
                } catch (err) {
                    // 错误处理
                }
            }, 500);
        } catch (error) {
            // 应用初始化失败处理
        }
    }
    
    /**
     * 显示网站介绍弹窗
     */
    showIntroduction() {
        // 创建介绍弹窗
        const introModal = document.createElement('div');
        introModal.className = 'modal intro-modal';
        introModal.id = 'introModal';
        introModal.style.display = 'flex';
        
        // 网站介绍内容
        const introContent = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Welcome to VividDH</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body" style="text-align: left; line-height: 1.6;">
                    <h3>Your Personal Website Manager</h3>
                    <p>VividDH is a convenient tool to organize and access your favorite websites. You can:</p>
                    <ul>
                        <li><strong>Save websites</strong> with names, URLs, and custom notes</li>
                        <li><strong>Organize sites</strong> into categories for easy access</li>
                        <li><strong>Search</strong> through your collection quickly</li>
                        <li><strong>Import and export</strong> your data for backup or transfer</li>
                    </ul>
                    <h3>Getting Started</h3>
                    <p>To add your first website, click the <strong>+</strong> button in the top navigation bar. You can manage your categories by clicking the <strong>Manage Categories</strong> button.</p>
                    <p>All your data is stored locally in your browser and never sent to any server.</p>
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn primary-btn" id="introCloseBtn">Get Started</button>
                    </div>
                </div>
            </div>
        `;
        
        introModal.innerHTML = introContent;
        document.body.appendChild(introModal);
        
        // 绑定关闭按钮事件
        const closeBtn = document.querySelector('#introModal .close-btn');
        const introCloseBtn = document.getElementById('introCloseBtn');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                introModal.style.display = 'none';
                setTimeout(() => introModal.remove(), 300);
            });
        }
        
        if (introCloseBtn) {
            introCloseBtn.addEventListener('click', () => {
                introModal.style.display = 'none';
                setTimeout(() => introModal.remove(), 300);
            });
        }
        
        // 点击模态框外部关闭
        introModal.addEventListener('click', (e) => {
            if (e.target === introModal) {
                introModal.style.display = 'none';
                setTimeout(() => introModal.remove(), 300);
            }
        });
    }

    /**
     * 设置路由
     */
    setupRouting() {
        // 初始根据URL哈希值选择分类
        this.handleHashChange();
        
        // 防止重复绑定事件
        if (!this._hashChangeHandlerBound) {
            // 监听哈希值变化
            window.addEventListener('hashchange', this.handleHashChange.bind(this));
            this._hashChangeHandlerBound = true;
        }
    }

    /**
     * 处理哈希值变化
     */
    handleHashChange() {
        try {
            let hash = window.location.hash;
            
            // 如果URL中有分类标识，则切换到对应分类
            if (hash.startsWith('#category=')) {
                const category = decodeURIComponent(hash.replace('#category=', ''));
                if (category && uiRenderer) {
                    uiRenderer.changeCategory(category);
                }
            } else if (hash === '#all' || hash === '') {
                // 默认显示全部
                if (uiRenderer) {
                    uiRenderer.changeCategory('全部');
                }
            }
        } catch (error) {
            // 处理哈希变化时出错处理
        }
    }

    /**
     * 加载样例数据
     */
    loadSampleData() {
        try {
            // 检查是否有网站数据，如果没有则加载样例数据
            const sites = dataManager.getSites();
            if (sites.length === 0) {
                // 添加样例分类
                const categories = ['常用', '购物', '工具', '学习', '娱乐'];
                categories.forEach(category => dataManager.addCategory(category));
                
                // 添加样例网站
                const sampleSites = [
                    {
                        name: '百度',
                        url: 'https://www.baidu.com',
                        category: '常用',
                        icon: 'https://www.baidu.com/favicon.ico'
                    },
                    {
                        name: '谷歌',
                        url: 'https://www.google.com',
                        category: '常用',
                        icon: 'https://www.google.com/favicon.ico'
                    },
                    {
                        name: '淘宝',
                        url: 'https://www.taobao.com',
                        category: '购物',
                        icon: 'https://www.taobao.com/favicon.ico'
                    },
                    {
                        name: '京东',
                        url: 'https://www.jd.com',
                        category: '购物',
                        icon: 'https://www.jd.com/favicon.ico'
                    },
                    {
                        name: '知乎',
                        url: 'https://www.zhihu.com',
                        category: '工具',
                        icon: 'https://www.zhihu.com/favicon.ico'
                    },
                    {
                        name: 'GitHub',
                        url: 'https://github.com',
                        category: '工具',
                        icon: 'https://github.com/favicon.ico'
                    },
                    {
                        name: '哔哩哔哩',
                        url: 'https://www.bilibili.com',
                        category: '娱乐',
                        icon: 'https://www.bilibili.com/favicon.ico'
                    },
                    {
                        name: '腾讯视频',
                        url: 'https://v.qq.com',
                        category: '娱乐',
                        icon: 'https://v.qq.com/favicon.ico'
                    }
                ];
                
                sampleSites.forEach(site => dataManager.addSite(site));
            }
        } catch (error) {
            // 加载样例数据出错处理
        }
    }
}

// 创建应用实例 - 仅在未创建时创建
if (!window.app) {
    window.app = new App();
} 