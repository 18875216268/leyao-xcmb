/**
 * sousuo.js - 历史图片搜索功能模块
 * 负责搜索框交互和图片过滤功能
 */

// 当前搜索关键字
let currentSearchTerm = '';

// 初始化搜索功能
function initSearchFeature() {
    // 获取搜索框元素
    const searchInput = document.getElementById('history-search');
    const searchClearBtn = document.getElementById('search-clear');
    
    if (!searchInput || !searchClearBtn) {
        console.error('搜索框元素未找到');
        return;
    }
    
    // 给搜索框添加输入事件
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        currentSearchTerm = searchTerm;
        
        // 更新清除按钮可见性
        if (searchTerm.length > 0) {
            this.parentElement.classList.add('has-value');
        } else {
            this.parentElement.classList.remove('has-value');
        }
        
        // 执行搜索
        filterHistoryImages(searchTerm);
    });
    
    // 给清除按钮添加点击事件
    searchClearBtn.addEventListener('click', function() {
        searchInput.value = '';
        currentSearchTerm = '';
        searchInput.parentElement.classList.remove('has-value');
        
        // 清除搜索，显示所有图片
        filterHistoryImages('');
    });
}

// 过滤历史图片
function filterHistoryImages(searchTerm) {
    // 获取所有历史图片元素
    const historyItems = document.querySelectorAll('.history-item');
    const historyContainer = document.querySelector('.history-container');
    
    if (!historyContainer) return;
    
    // 移除之前的"无结果"提示（如果有）
    const noResultsMessage = historyContainer.querySelector('.search-no-results');
    if (noResultsMessage) {
        noResultsMessage.remove();
    }
    
    // 如果没有历史图片，不需要过滤
    if (historyItems.length === 0) return;
    
    let visibleCount = 0;
    
    // 遍历所有历史图片，根据搜索条件显示或隐藏
    historyItems.forEach(item => {
        const nameElement = item.querySelector('.history-item-name');
        if (!nameElement) return;
        
        const imageName = nameElement.textContent.toLowerCase();
        
        // 判断是否匹配搜索条件
        const shouldShow = searchTerm === '' || imageName.includes(searchTerm);
        
        // 设置元素显示或隐藏
        if (shouldShow) {
            item.dataset.filtered = 'false';
            visibleCount++;
        } else {
            item.dataset.filtered = 'true';
        }
    });
    
    // 如果搜索后没有结果，显示提示
    if (searchTerm !== '' && visibleCount === 0) {
        const noResultsElement = document.createElement('div');
        noResultsElement.className = 'search-no-results';
        noResultsElement.textContent = '没有找到匹配的图片';
        historyContainer.appendChild(noResultsElement);
    }
    
    // 触发分页更新
    if (typeof updatePagination === 'function') {
        updatePagination();
    }
}

// 获取当前搜索状态下的图片数量
function getFilteredImagesCount() {
    const historyItems = document.querySelectorAll('.history-item');
    let count = 0;
    
    historyItems.forEach(item => {
        if (item.dataset.filtered !== 'true') {
            count++;
        }
    });
    
    return count;
}

// 导出函数
window.initSearchFeature = initSearchFeature;
window.filterHistoryImages = filterHistoryImages;
window.getFilteredImagesCount = getFilteredImagesCount;