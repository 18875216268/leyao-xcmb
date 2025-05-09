/**
 * fenye.js - 历史图片分页功能模块
 * 负责分页导航和动态页码显示
 */

// 分页设置
const ITEMS_PER_PAGE = 10; // 每页显示的图片数量，修改为10张
let currentPage = 1; // 当前页码
let totalPages = 1; // 总页数

// 初始化分页功能
// 初始化分页功能
function initPaginationFeature() {
    // 获取分页相关元素
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const paginationNumbers = document.querySelector('.pagination-numbers');
    
    if (!prevBtn || !nextBtn || !paginationNumbers) {
        console.error('分页元素未找到');
        return;
    }
    
    // 上一页按钮点击事件
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    });
    
    // 下一页按钮点击事件
    nextBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    });
    
    // 添加面板宽度变化监听
    const historyPanel = document.querySelector('.history-panel');
    if (historyPanel) {
        // 使用ResizeObserver监听面板尺寸变化
        const resizeObserver = new ResizeObserver(entries => {
            // 当面板宽度变化时更新分页
            updatePagination();
        });
        resizeObserver.observe(historyPanel);
    }
    
    // 监听窗口大小变化，可能间接影响面板尺寸
    window.addEventListener('resize', function() {
        updatePagination();
    });
    
    // 初始化分页
    updatePagination();
}

// 更新分页
function updatePagination() {
    // 计算总页数（仅包括未被过滤的图片）
    const filteredCount = getFilteredImagesCount();
    totalPages = Math.max(1, Math.ceil(filteredCount / ITEMS_PER_PAGE));
    
    // 如果当前页超出范围，调整到最后一页
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    
    // 更新分页按钮状态
    updatePaginationButtons();
    
    // 更新页码显示
    updatePageNumbers();
    
    // 更新图片显示
    updateVisibleItems();
    
    // 在分页更新后滚动到容器顶部
    scrollToTopOfContainer();
}

// 更新分页按钮状态
function updatePaginationButtons() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (!prevBtn || !nextBtn) return;
    
    // 上一页按钮是否禁用
    prevBtn.disabled = currentPage <= 1;
    
    // 下一页按钮是否禁用
    nextBtn.disabled = currentPage >= totalPages;
}

// 更新页码显示
// 修改后
function updatePageNumbers() {
    const paginationNumbers = document.querySelector('.pagination-numbers');
    if (!paginationNumbers) return;
    
    // 清空现有页码
    paginationNumbers.innerHTML = '';
    
    // 根据历史面板宽度计算可显示的页码数量
    const historyPanel = document.querySelector('.history-panel');
    const panelWidth = historyPanel ? historyPanel.offsetWidth : 180;
    
    // 每个页码按钮宽度约30px(包含margin)，计算可以显示多少个
    // 留出一定空间给前后导航按钮
    const availableWidth = panelWidth - 90; // 减去前后导航按钮和一些边距
    const maxButtons = Math.max(3, Math.floor(availableWidth / 30)); // 至少显示3个按钮
    
    // 根据可显示数量确定页码范围
    let startPage = Math.max(1, currentPage - Math.floor((maxButtons - 1) / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // 调整起始页以充分利用可用按钮数量
    if (endPage - startPage + 1 < maxButtons && startPage > 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // 生成页码按钮
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('div');
        pageBtn.className = 'page-number';
        pageBtn.textContent = i;
        
        // 标记当前页
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        
        // 添加点击事件
        pageBtn.addEventListener('click', function() {
            goToPage(i);
        });
        
        paginationNumbers.appendChild(pageBtn);
    }
}

// 更新可见图片项 - 现在保留滚动条，但仍然使用分页控制显示
function updateVisibleItems() {
    const historyItems = document.querySelectorAll('.history-item');
    if (historyItems.length === 0) return;
    
    // 先隐藏所有搜索过滤掉的图片
    historyItems.forEach(item => {
        if (item.dataset.filtered === 'true') {
            item.style.display = 'none';
        } else {
            // 先将所有未过滤的图片显示出来
            item.style.display = 'block';
        }
    });
    
    // 获取所有可见的图片（未被过滤的）
    const visibleItems = Array.from(historyItems).filter(item => item.dataset.filtered !== 'true');
    
    // 计算当前页的图片范围
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE - 1;
    
    // 遍历所有可见图片，隐藏不在当前页范围内的
    visibleItems.forEach((item, index) => {
        if (index < startIndex || index > endIndex) {
            item.style.display = 'none';
        } else {
            item.style.display = 'block';
        }
    });
}

// 滚动到容器顶部
function scrollToTopOfContainer() {
    const historyContainer = document.querySelector('.history-container');
    if (historyContainer) {
        historyContainer.scrollTop = 0;
    }
}

// 跳转到指定页
function goToPage(pageNumber) {
    // 确保页码在有效范围内
    if (pageNumber < 1 || pageNumber > totalPages) {
        return;
    }
    
    // 更新当前页码
    currentPage = pageNumber;
    
    // 更新分页UI
    updatePagination();
}

// 重置分页状态
function resetPagination() {
    currentPage = 1;
    updatePagination();
}

// 导出函数
window.initPaginationFeature = initPaginationFeature;
window.updatePagination = updatePagination;
window.resetPagination = resetPagination;
window.goToPage = goToPage;