/**
 * 国际化(i18n)模块
 * 负责多语言支持和语言切换
 */

// 默认显示英文
let currentLanguage = 'en-US';

// 禁用日志输出
const log = () => {};
const error = () => {};

// 语言资源
const resources = {
    'zh-CN': {
        'app_name': 'VividDH',
        'categories': '分类',
        'all_sites': '全部网站',
        'frequently_used': '常用',
        'shopping': '购物',
        'tools': '工具',
        'learning': '学习',
        'entertainment': '娱乐',
        'search_placeholder': '搜索网站...',
        'add_new': '添加网站',
        'add_new_site': '添加新网站',
        'edit_site': '编辑网站',
        'site_name': '网站名称',
        'site_url': '网站地址',
        'site_category': '网站分类',
        'site_notes': '备注信息（如账号密码等）',
        'choose_icon': '选择图标',
        'choose_file': '选择文件',
        'no_file_selected': '未选择任何文件',
        'icon_note': '不选择图标将自动获取网站favicon',
        'save': '保存',
        'cancel': '取消',
        'category_management': '分类管理',
        'new_category_name': '新分类名称',
        'add': '添加',
        'save_order': '保存排序',
        'edit': '编辑',
        'delete': '删除',
        'copy_url': '复制URL',
        'copy_password': '复制备注',
        'verify_password': '密码验证',
        'enter_master_password': '请输入主密码',
        'confirm': '确认',
        'language_switch': '切换语言',
        'import_data': '导入数据',
        'export_data': '导出数据',
        'switch_mode': '切换模式',
        'manage_categories': '管理分类',
        'no_sites_found': '未找到任何网站',
        'add_some_sites': '请添加一些网站',
        'copied_to_clipboard': '已复制到剪贴板',
        'site_added': '网站已添加',
        'site_updated': '网站已更新',
        'site_deleted': '网站已删除',
        'category_added': '分类已添加',
        'category_exists': '分类已存在',
        'categories_saved': '分类已保存',
        'import_success': '数据导入成功',
        'import_error': '数据导入失败',
        'export_success': '数据导出成功',
        'wrong_password': '密码错误',
        'access_granted': '访问已授权',
        'guest_mode': '访客模式',
        'account_mode': '账户模式',
        'no_sites_in_category': '该分类下没有网站',
        'no_results': '无搜索结果',
        'search_results': '搜索结果',
        'language_changed': '语言已切换',
        'settings': '设置',
        'dark_mode': '暗色模式',
        'light_mode': '亮色模式',
        'reset': '重置',
        'confirm_delete': '确认删除?',
        'invalid_url': '无效的URL地址',
        'invalid_icon_type': '无效的图标文件类型',
        'icon_too_large': '图标文件过大',
        'icon_read_error': '读取图标文件失败',
        'empty_sites_message': '暂无网站，点击右上角添加',
        'open_site_failed': '打开网站失败',
        'site_add_success': '网站添加成功',
        'site_add_failed': '添加网站失败',
        'site_update_success': '网站更新成功',
        'site_update_failed': '更新网站失败',
        'is_required': '是必填项',
        'data_import_success': '数据导入成功',
        'data_import_failed': '数据导入失败',
        'data_export_success': '数据导出成功',
        'encrypt_export_confirm': '是否加密导出的数据？点击确定加密，点击取消不加密',
        'url_copied': '链接已复制到剪贴板',
        'notes_copied': '备注已复制到剪贴板',
        'copy_failed': '复制失败',
        'open_site': '打开网站',
        'category_update_success': '分类更新成功',
        'category_update_failed': '分类更新失败',
        'category_delete_success': '分类删除成功',
        'category_delete_failed': '分类删除失败',
        'category_name_required': '分类名称不能为空',
        'password_error': '密码错误',
        'contains_notes': '包含备注信息',
        'feature_disabled': '该功能已禁用',
        'chinese': '中文',
        'english': '英文'
    },
    'en-US': {
        'app_name': 'VividDH',
        'categories': 'Categories',
        'all_sites': 'All Sites',
        'frequently_used': 'Frequently Used',
        'shopping': 'Shopping',
        'tools': 'Tools',
        'learning': 'Learning',
        'entertainment': 'Entertainment',
        'search_placeholder': 'Search websites...',
        'add_new': 'Add Site',
        'add_new_site': 'Add New Site',
        'edit_site': 'Edit Site',
        'site_name': 'Site Name',
        'site_url': 'Site URL',
        'site_category': 'Category',
        'site_notes': 'Notes (e.g. account info)',
        'choose_icon': 'Choose Icon',
        'choose_file': 'Choose File',
        'no_file_selected': 'No file selected',
        'icon_note': 'Leave empty to fetch favicon automatically',
        'save': 'Save',
        'cancel': 'Cancel',
        'category_management': 'Category Management',
        'new_category_name': 'New category name',
        'add': 'Add',
        'save_order': 'Save Order',
        'edit': 'Edit',
        'delete': 'Delete',
        'copy_url': 'Copy URL',
        'copy_password': 'Copy Notes',
        'verify_password': 'Verify Password',
        'enter_master_password': 'Enter master password',
        'confirm': 'Confirm',
        'language_switch': 'Switch Language',
        'import_data': 'Import Data',
        'export_data': 'Export Data',
        'switch_mode': 'Switch Mode',
        'manage_categories': 'Manage Categories',
        'no_sites_found': 'No sites found',
        'add_some_sites': 'Please add some sites',
        'copied_to_clipboard': 'Copied to clipboard',
        'site_added': 'Site added',
        'site_updated': 'Site updated',
        'site_deleted': 'Site deleted',
        'category_added': 'Category added',
        'category_exists': 'Category already exists',
        'categories_saved': 'Categories saved',
        'import_success': 'Data imported successfully',
        'import_error': 'Failed to import data',
        'export_success': 'Data exported successfully',
        'wrong_password': 'Wrong password',
        'access_granted': 'Access granted',
        'guest_mode': 'Guest Mode',
        'account_mode': 'Account Mode',
        'no_sites_in_category': 'No sites in this category',
        'no_results': 'No results',
        'search_results': 'Search Results',
        'language_changed': 'Language changed',
        'settings': 'Settings',
        'dark_mode': 'Dark Mode',
        'light_mode': 'Light Mode',
        'reset': 'Reset',
        'confirm_delete': 'Confirm delete?',
        'invalid_url': 'Invalid URL',
        'invalid_icon_type': 'Invalid icon file type',
        'icon_too_large': 'Icon file is too large',
        'icon_read_error': 'Failed to read icon file',
        'empty_sites_message': 'No sites yet, click the add button in the top right',
        'open_site_failed': 'Failed to open website',
        'site_add_success': 'Site added successfully',
        'site_add_failed': 'Failed to add site',
        'site_update_success': 'Site updated successfully',
        'site_update_failed': 'Failed to update site',
        'is_required': 'is required',
        'data_import_success': 'Data imported successfully',
        'data_import_failed': 'Failed to import data',
        'data_export_success': 'Data exported successfully',
        'encrypt_export_confirm': 'Do you want to encrypt the exported data? Click OK to encrypt, Cancel to export without encryption',
        'url_copied': 'URL copied to clipboard',
        'notes_copied': 'Notes copied to clipboard',
        'copy_failed': 'Copy failed',
        'open_site': 'Open Website',
        'category_update_success': 'Categories updated successfully',
        'category_update_failed': 'Failed to update category',
        'category_delete_success': 'Category deleted successfully',
        'category_delete_failed': 'Failed to delete category',
        'category_name_required': 'Category name is required',
        'password_error': 'Password error',
        'contains_notes': 'Contains notes',
        'feature_disabled': 'This feature is disabled',
        'chinese': 'Chinese',
        'english': 'English'
    }
};

/**
 * 获取翻译文本
 * @param {string} key - 翻译键
 * @param {object} params - 替换参数，可选
 * @returns {string} - 翻译后的文本
 */
function t(key, params) {
    const lang = resources[currentLanguage];
    let text = lang && lang[key] ? lang[key] : key;
    
    // 替换参数
    if (params) {
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
    }
    
    return text;
}

/**
 * 获取当前语言
 * @returns {string} - 当前语言代码
 */
function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * 设置语言
 * @param {string} langCode - 语言代码
 * @returns {string} - 设置后的语言代码
 */
function setLanguage(langCode) {
    if (resources[langCode]) {
        currentLanguage = langCode;
        localStorage.setItem('language', langCode);
        return langCode;
    } else {
        return currentLanguage;
    }
}

/**
 * 切换语言（在中英文之间切换）
 * @returns {string} - 切换后的语言代码
 */
function switchLanguage() {
    const newLang = currentLanguage === 'zh-CN' ? 'en-US' : 'zh-CN';
    return setLanguage(newLang);
}

/**
 * 更新页面上所有带有data-i18n属性的元素的文本
 */
function updatePageText() {
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
    
    // 更新文档标题
    document.title = t('app_name') + ' - ' + (currentLanguage === 'zh-CN' ? '您的个人网站管理中心' : 'Your Personal Website Manager');
}

// 初始化页面文本
document.addEventListener('DOMContentLoaded', updatePageText); 