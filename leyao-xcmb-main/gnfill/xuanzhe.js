/**
 * xuanzhe.js - 图片区域选择功能
 */

// 全局变量-存储当前选中的图片区域
let selectedImageAreas = [];

// 初始化选择功能
function initSelectionFeature() {
    // 修改所有图片区域的交互行为
    setupImageAreaInteraction();
    
    // 修改历史图片点击行为
    modifyHistoryImageBehavior();
    
    // 设置全局点击事件，点击非图片区域时取消选择
    setupGlobalClickHandler();
}

// 设置图片区域交互
function setupImageAreaInteraction() {
    // 获取所有图片区域
    const headerImage = document.querySelector('.header-image');
    const footerImage = document.querySelector('.footer-image');
    const productImages = document.querySelectorAll('.product-image');
    
    const allImageAreas = [headerImage, footerImage, ...productImages];
    
    allImageAreas.forEach(area => {
        if (!area) return;
        
        // 移除现有事件
        const newArea = area.cloneNode(true);
        area.parentNode.replaceChild(newArea, area);
        
        // 获取文件上传输入元素
        const fileInput = newArea.querySelector('input[type="file"]');
        if (!fileInput) return;
        
        // 双击事件 - 触发文件上传
        newArea.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            if (fileInput) {
                fileInput.click();
            }
        });
        
        // 单击事件 - 选择区域
        newArea.addEventListener('click', function(e) {
            e.stopPropagation();
            selectImageArea(this, e);
        });
        
        // 保持文件上传事件监听
        fileInput.addEventListener('change', window.handleFileUpload || handleFileUpload);
    });
}

// 选择图片区域
function selectImageArea(area, event) {
    // 检查是否按下Ctrl或Shift键
    const isMultiSelect = event.ctrlKey || event.shiftKey;
    
    // 如果未按下多选键，先清除所有选择
    if (!isMultiSelect) {
        clearAllSelections();
    }
    
    // 切换选择状态 - 使用类来保持与悬浮相同的样式
    if (!area.classList.contains('selected-area')) {
        // 选中 - 添加类
        area.classList.add('selected-area');
        selectedImageAreas.push(area);
    } else if (isMultiSelect) {
        // 取消选中（仅在多选模式下）
        area.classList.remove('selected-area');
        const index = selectedImageAreas.indexOf(area);
        if (index !== -1) {
            selectedImageAreas.splice(index, 1);
        }
    }
    
    // Shift键多选（连续范围）
    if (event.shiftKey && selectedImageAreas.length > 1) {
        const allAreas = [...document.querySelectorAll('.header-image, .footer-image, .product-image')];
        const lastSelectedIndex = allAreas.indexOf(selectedImageAreas[selectedImageAreas.length - 2]);
        const currentIndex = allAreas.indexOf(area);
        
        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
            // 选择范围内的所有区域
            const start = Math.min(lastSelectedIndex, currentIndex);
            const end = Math.max(lastSelectedIndex, currentIndex);
            
            for (let i = start; i <= end; i++) {
                const rangeArea = allAreas[i];
                if (!rangeArea.classList.contains('selected-area')) {
                    rangeArea.classList.add('selected-area');
                    if (!selectedImageAreas.includes(rangeArea)) {
                        selectedImageAreas.push(rangeArea);
                    }
                }
            }
        }
    }
}

// 清除所有选择
function clearAllSelections() {
    document.querySelectorAll('.selected-area').forEach(area => {
        area.classList.remove('selected-area');
    });
    selectedImageAreas = [];
}

// 设置全局点击处理，点击非图片区域时取消选择
function setupGlobalClickHandler() {
    document.addEventListener('click', function(e) {
        // 检查点击的是否为图片区域
        const clickedImageArea = e.target.closest('.header-image, .footer-image, .product-image');
        if (!clickedImageArea) {
            clearAllSelections();
        }
    });
}

// 修改历史图片点击行为
function modifyHistoryImageBehavior() {
    // 监听历史面板变化，为新添加的图片绑定事件
    const historyContainer = document.querySelector('.history-container');
    if (!historyContainer) return;
    
    // 使用MutationObserver监听变化
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('history-item')) {
                        setupHistoryItemEvent(node);
                    }
                });
            }
        });
    });
    
    observer.observe(historyContainer, { childList: true });
    
    // 为现有历史图片绑定事件
    document.querySelectorAll('.history-item').forEach(item => {
        setupHistoryItemEvent(item);
    });
}

// 设置历史图片项事件
function setupHistoryItemEvent(historyItem) {
    // 克隆并替换，移除原有事件
    const clone = historyItem.cloneNode(true);
    historyItem.parentNode.replaceChild(clone, historyItem);
    
    // 获取图片数据
    const imageId = clone.getAttribute('data-image-id');
    if (!imageId) return;
    
    // 删除按钮事件
    const deleteBtn = clone.querySelector('.history-action-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (typeof removeImageFromStorage === 'function') {
                removeImageFromStorage(imageId);
            }
        });
    }
    
    // 图片点击事件
    clone.addEventListener('click', function(e) {
        // 如果点击的是删除按钮，不处理
        if (e.target.closest('.history-action-delete')) return;
        
        // 如果没有选中区域，不处理
        if (selectedImageAreas.length === 0) return;
        
        // 获取图片数据
        const image = imageStorage.images.find(img => img.id === parseInt(imageId, 10));
        if (!image) return;
        
        // 填充到第一个选中区域
        fillImageToArea(selectedImageAreas[0], image);
        
        // 移除已填充的区域
        selectedImageAreas.shift();
        
        // 如果还有选中区域，保持它们的选中状态
        if (selectedImageAreas.length === 0) {
            clearAllSelections();
        }
    });
}

// 填充图片到区域
function fillImageToArea(area, image) {
    if (!area || !image) return;
    
    // 清除选中状态
    area.classList.remove('selected-area');
    
    // 判断区域类型
    const isHeader = area.classList.contains('header-image');
    const isFooter = area.classList.contains('footer-image');
    const isProduct = area.classList.contains('product-image');
    
    let img, deleteBtn, uploadBtn;
    
    if (isHeader) {
        img = document.getElementById('header-img');
        deleteBtn = img.nextElementSibling;
        uploadBtn = deleteBtn.nextElementSibling;
    } else if (isFooter) {
        img = document.getElementById('footer-img');
        deleteBtn = img.nextElementSibling;
        uploadBtn = deleteBtn.nextElementSibling;
    } else if (isProduct) {
        img = area.querySelector('img');
        deleteBtn = img.nextElementSibling;
        uploadBtn = area.querySelector('.upload-btn');
    } else {
        return;
    }
    
    // 设置图片
    img.src = image.data;
    img.style.display = 'block';
    
    // 调整头部和底部图片样式
    if (isHeader || isFooter) {
        img.style.objectFit = 'cover';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.top = '0';
        img.style.left = '0';
        img.style.transform = 'none';
    }
    
    // 显示删除按钮，隐藏上传按钮
    deleteBtn.style.display = 'block';
    uploadBtn.style.display = 'none';
    
    // 更新水印（如果是产品图片）
    if (isProduct && typeof addWatermarksToProducts === 'function' && 
        typeof applyWatermarkSettings === 'function') {
        setTimeout(() => {
            addWatermarksToProducts();
            applyWatermarkSettings();
        }, 50);
    }
}

// 导出为全局函数
window.initSelectionFeature = initSelectionFeature;