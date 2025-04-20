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
            
            // 确定显示模式
            let displayMode = 'stretch'; // 默认显示模式
            
            if (elementId === 'header-img') {
                displayMode = document.getElementById('header-display').value;
            } else if (elementId === 'footer-img') {
                displayMode = document.getElementById('footer-display').value;
            } else if (elementId.startsWith('product-img-')) {
                displayMode = document.getElementById('product-display').value;
            }
            
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
    // fillNextSelectedArea 函数的剩余部分:
    if (currentFillIndex >= selectedElements.length) {
        currentFillIndex = 0;
    }
}

// 处理图片上传，扩展原有的handleFileUpload函数以支持本地存储 
window.handleFileUpload = function(event) {
    const input = event.target;
    const files = input.files;
    
    // 如果没有文件被选择，直接返回
    if (!files || files.length === 0) return;
    
    let imgId;
    
    if (input.id === 'upload-header') {
        imgId = 'header-img';
    } else if (input.id === 'upload-footer') {
        imgId = 'footer-img';
    } else {
        imgId = input.id.replace('upload-', 'product-img-');
    }
    
    // 处理第一个文件
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // 获取图片数据URL
        const imageDataUrl = e.target.result;
        
        // 保存到本地存储
        addImageToStorage(imageDataUrl, file.name);
        
        // 找到对应的图片元素
        const img = document.getElementById(imgId);
        
        if (img) {
            img.src = imageDataUrl;
            img.style.display = "block";
            
            // 针对头部和底部图片，设置填满方式为cover
            if (imgId === 'header-img' || imgId === 'footer-img') {
                img.style.objectFit = "cover";
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.top = "0";
                img.style.left = "0";
                img.style.transform = "none";
            }
            
            // 隐藏上传按钮
            const uploadBtn = input.parentElement;
            uploadBtn.style.display = "none";
            
            // 显示删除按钮
            const deleteBtn = img.nextElementSibling;
            if (deleteBtn && deleteBtn.classList.contains('delete-btn')) {
                deleteBtn.style.display = "block";
            }
        }
    };
    
    reader.readAsDataURL(file);
    
    // 如果选择了多个文件，尝试填充其他空白区域
    if (files.length > 1) {
        // 查找当前空白图片位置
        const emptySlots = getEmptyImageSlots();
        
        // 跳过第一个文件（已经处理）并处理剩余的
        const remainingFiles = Math.min(files.length - 1, emptySlots.length);
        
        for (let i = 0; i < remainingFiles; i++) {
            const file = files[i + 1]; // +1 跳过第一个文件
            const slot = emptySlots[i];
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // 保存到本地存储
                const imageDataUrl = e.target.result;
                addImageToStorage(imageDataUrl, file.name);
                
                const img = document.getElementById(slot.imgId);
                if (img) {
                    img.src = imageDataUrl;
                    img.style.display = "block";
                    
                    // 隐藏上传按钮
                    const uploadBtn = slot.uploadBtn;
                    uploadBtn.style.display = "none";
                    
                    // 显示删除按钮
                    const deleteBtn = img.nextElementSibling;
                    if (deleteBtn && deleteBtn.classList.contains('delete-btn')) {
                        deleteBtn.style.display = "block";
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    }
};