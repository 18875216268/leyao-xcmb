/**
 * panel.js - 历史面板交互模块
 * 负责历史面板的UI交互和图片应用功能
 */

// 设置历史面板事件
// 设置历史面板事件
// 设置历史面板事件
// 设置历史面板事件
function setupHistoryPanelEvents() {
    // 获取面板元素
    const historyPanel = document.querySelector('.history-panel');
    if (!historyPanel) {
        console.error('未找到历史面板元素');
        return;
    }
    
    const previewContainer = document.querySelector('.preview-container');
    
    // 初始宽度
    // 直接获取CSS变量的值为初始宽度，而非硬编码
    let currentWidth = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--history-panel-width')) || 180;
    
    // 将默认宽度添加为CSS变量，便于按钮位置计算
    document.documentElement.style.setProperty('--panel-width', currentWidth + 'px');
    
    // 将历史面板默认设置为折叠状态
    historyPanel.classList.add('collapsed');
    
    // 调整预览容器的初始样式
    previewContainer.classList.remove('history-expanded');
    previewContainer.classList.add('history-collapsed');
    previewContainer.style.marginRight = '0';
    
    // 添加左侧调整大小功能
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    historyPanel.appendChild(resizeHandle);
    
    let isResizing = false;
    let startX, startWidth;
    
    resizeHandle.addEventListener('mousedown', function(e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = historyPanel.offsetWidth;
        
        // 添加临时全局事件
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
        
        // 添加调整大小中的样式
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    
    function handleResize(e) {
        if (!isResizing) return;
        
        // 计算新宽度
        const newWidth = startWidth - (e.clientX - startX);
        
        // 限制最小和最大宽度
        if (newWidth >= 180 && newWidth <= 400) {
            // 更新CSS变量，所有使用该变量的元素都会自动更新
            document.documentElement.style.setProperty('--history-panel-width', newWidth + 'px');
            currentWidth = newWidth;
            
            // 更新分页导航
            if (typeof updatePagination === 'function') {
                updatePagination();
            }
        }
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        
        // 移除临时样式
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
    
    // 监听来自新增展开按钮的展开事件
    document.addEventListener('expandHistoryPanel', function() {
        if (historyPanel.classList.contains('collapsed')) {
            // 展开面板
            historyPanel.classList.remove('collapsed');
            previewContainer.classList.add('history-expanded');
            previewContainer.classList.remove('history-collapsed');
            
            // 恢复之前的宽度
            historyPanel.style.width = currentWidth + 'px';
            previewContainer.style.marginRight = currentWidth + 'px';
        }
    });
    
    // 当窗口大小改变时，更新CSS变量
    window.addEventListener('resize', function() {
        document.documentElement.style.setProperty('--panel-width', historyPanel.offsetWidth + 'px');
        
        // 更新分页
        if (typeof updatePagination === 'function') {
            updatePagination();
        }
    });
}

// 依次填充到选中区域
function fillNextSelectedArea(image) {
    // 获取所有选中的图片区域
    const selectedElements = document.querySelectorAll('.product-image.selected, .header-image.selected, .footer-image.selected');
    
    // 如果没有选中任何区域，提示用户先选择
    if (selectedElements.length === 0) {
        // 使用通知提示用户
        if (typeof showNotification === 'function') {
            showNotification('请先选择要填充图片的区域');
        } else {
            alert('请先选择要填充图片的区域');
        }
        return;
    }
    
    // 确保索引在有效范围内
    if (currentFillIndex >= selectedElements.length) {
        currentFillIndex = 0;
    }
    
    // 获取当前要填充的元素
    const element = selectedElements[currentFillIndex];
    const elementId = element.dataset.id;
    
    if (elementId) {
        const img = document.getElementById(elementId);
        if (img) {
            // 设置图片
            img.src = image.data;
            img.style.display = "block";
            
            // 历史面板应用图片时固定使用原图/原比例显示
            const displayMode = 'original';
            
            // 应用显示模式
            if (typeof applyDisplayMode === 'function') {
                applyDisplayMode(elementId, displayMode);
            }
            
            // 隐藏上传按钮
            const uploadBtn = element.querySelector('.upload-btn');
            if (uploadBtn) {
                uploadBtn.style.display = 'none';
            }
            
            // 显示删除按钮
            const deleteBtn = img.nextElementSibling;
            if (deleteBtn && deleteBtn.classList.contains('delete-btn')) {
                deleteBtn.style.display = 'block';
            }
            
            // 应用水印设置
            if (typeof addWatermarksToProducts === 'function' && 
                typeof applyWatermarkSettings === 'function') {
                addWatermarksToProducts();
                applyWatermarkSettings();
            }
            
            // 显示通知
            if (typeof showNotification === 'function') {
                showNotification('图片已应用到选中区域');
            }
        }
    }
    
    // 移动到下一个索引
    currentFillIndex++;
    
    // 如果已经填充完所有选中区域，重置索引
    if (currentFillIndex >= selectedElements.length) {
        currentFillIndex = 0;
    }
}