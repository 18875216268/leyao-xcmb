/**
 * lishi.js - 历史图片功能模块主文件
 * 负责图片本地存储、历史面板交互和图片复用功能
 */

// 初始图片存储对象
let imageStorage = {
    images: [],
    nextId: 1
};

// 当前待填充的选中区域索引
let currentFillIndex = 0;

// 页面加载时初始化历史面板
document.addEventListener('DOMContentLoaded', function() {
    // 初始化本地存储
    initLocalStorage();
    
    // 设置历史面板事件
    setupHistoryPanelEvents();
    
    // 加载历史图片
    loadHistoryImages();
    
    // 初始化搜索功能
    if (typeof initSearchFeature === 'function') {
        initSearchFeature();
    }
    
    // 初始化分页功能
    if (typeof initPaginationFeature === 'function') {
        initPaginationFeature();
    }
    
    // 修改全局点击事件，排除历史面板区域
    // 注意：这段代码应该在tupian.js的document.addEventListener('click')事件之后执行
    // 防止点击历史面板时清除选择状态
    setTimeout(function() {
        // 移除之前可能添加的事件监听
        const oldListeners = document.querySelectorAll('.history-panel, .history-item');
        oldListeners.forEach(el => {
            el.removeAttribute('data-event-attached');
        });
        
        // 添加历史面板的点击事件阻止冒泡
        const historyPanel = document.querySelector('.history-panel');
        if (historyPanel && !historyPanel.getAttribute('data-event-attached')) {
            historyPanel.setAttribute('data-event-attached', 'true');
            historyPanel.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡到document
            });
        }
    }, 500); // 给一点延迟确保其他脚本已加载
    
    // 修改记忆选择状态的监听
    document.addEventListener('click', function(e) {
        // 只有当点击新区域选择时，重置填充索引
        // 排除点击历史面板的情况
        if ((e.target.closest('.product-image') || 
             e.target.closest('.header-image') || 
             e.target.closest('.footer-image')) &&
            !e.target.closest('.history-panel')) {
            currentFillIndex = 0;
        }
    });
});

// 引入存储管理模块
document.write('<script src="gnfill/lishis/storage.js"></script>');

// 引入面板交互模块
document.write('<script src="gnfill/lishis/panel.js"></script>');

// 新增：引入搜索功能模块
document.write('<script src="gnfill/lishis/sousuo.js"></script>');

// 新增：引入分页功能模块
document.write('<script src="gnfill/lishis/fenye.js"></script>');