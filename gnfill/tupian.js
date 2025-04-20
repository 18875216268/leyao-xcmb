/**
 * tupian.js - 功能模块(图片处理)
 * 负责图片上传、初始化产品网格、图片删除等功能
 */

// 全局变量 - 用于跟踪选中的图片
const selectedImages = new Set();

// 初始化产品网格
function initProductGrid() {
    const gridContainer = document.querySelector('.product-grid');
    gridContainer.innerHTML = ''; // 清空网格
    
    // 获取列数和产品数量
    const columns = parseInt(document.getElementById('product-columns').value) || 3;
    const productCount = parseInt(document.getElementById('product-count').value) || 9;
    
    // 获取设置面板中的宽度和高度值
    const productWidth = parseInt(document.getElementById('product-width').value) || 645;
    const productHeight = parseInt(document.getElementById('product-height').value) || 980;
    
    // 计算高宽比并应用于产品图片
    const aspectRatio = (productHeight / productWidth) * 100;
    
    // 设置网格列数
    gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // 创建产品项目
    for (let i = 1; i <= productCount; i++) {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <div class="product-image" data-id="product-img-${i}" style="padding-bottom: ${aspectRatio}%">
                <img src="/api/placeholder/${productWidth}/${productHeight}" alt="" style="display: none;" id="product-img-${i}">
                <div class="delete-btn" style="display: none;" onclick="deleteImage('product-img-${i}')">×</div>
                <label class="upload-btn" for="upload-${i}">
                    <span class="upload-icon">+</span>
                    <span class="upload-text">双击上传产品图片</span>
                    <input type="file" id="upload-${i}" style="display:none" multiple>
                </label>
            </div>
        `;
        gridContainer.appendChild(productItem);
        
        // 为新创建的文件输入添加change事件
        const fileInput = productItem.querySelector(`input[type="file"]`);
        fileInput.addEventListener('change', window.handleFileUpload || handleFileUpload);
        
        // 添加双击事件到产品图片区域，实现双击上传图片功能
        const productImage = productItem.querySelector('.product-image');
        
        // 移除上传按钮的可点击性，保留但使其不响应点击
        const uploadBtn = productImage.querySelector('.upload-btn');
        if (uploadBtn) {
            uploadBtn.style.pointerEvents = 'none';
        }
        
        // 处理双击上传
        productImage.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            const fileInput = this.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.click();
            }
        });
        
        // 处理单击选择
        productImage.addEventListener('click', function(e) {
            e.stopPropagation();
            handleImageSelection(this, e);
        });
    }

    // 添加键盘删除监听
    setupKeyboardDeleteListener();
    
    // 添加全局点击事件，清除选择
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.product-image') && 
            !e.target.closest('.header-image') && 
            !e.target.closest('.footer-image')) {
            clearAllSelections();
        }
    });
}

// 处理图片选择
function handleImageSelection(imageElement, event) {
    const imageId = imageElement.dataset.id;
    
    // 处理多选
    if (event.ctrlKey || event.metaKey) {
        // Ctrl+单击：切换选择状态
        if (selectedImages.has(imageId)) {
            selectedImages.delete(imageId);
            imageElement.classList.remove('selected');
        } else {
            selectedImages.add(imageId);
            imageElement.classList.add('selected');
        }
    } else if (event.shiftKey && selectedImages.size > 0) {
        // Shift+单击：范围选择
        const allImageElements = Array.from(document.querySelectorAll('.product-image, .header-image, .footer-image'));
        const lastSelectedId = [...selectedImages][selectedImages.size - 1];
        const lastSelectedElement = document.querySelector(`[data-id="${lastSelectedId}"]`);
        const lastSelectedIndex = allImageElements.indexOf(lastSelectedElement);
        const currentIndex = allImageElements.indexOf(imageElement);
        
        if (lastSelectedIndex !== -1) {
            // 确定选择范围
            const start = Math.min(lastSelectedIndex, currentIndex);
            const end = Math.max(lastSelectedIndex, currentIndex);
            
            // 清除现有选择
            clearAllSelections();
            
            // 选择范围内的所有图片
            for (let i = start; i <= end; i++) {
                const el = allImageElements[i];
                if (el.dataset.id) {
                    selectedImages.add(el.dataset.id);
                    el.classList.add('selected');
                }
            }
        }
    } else {
        // 普通单击：清除其他选择，只选择当前
        clearAllSelections();
        selectedImages.add(imageId);
        imageElement.classList.add('selected');
    }
}

// 清除所有图片选择
function clearAllSelections() {
    document.querySelectorAll('.product-image.selected, .header-image.selected, .footer-image.selected').forEach(el => {
        el.classList.remove('selected');
    });
    selectedImages.clear();
}

// 获取所有空白的图片占位符
function getEmptyImageSlots() {
    const emptySlots = [];
    
    // 获取所有产品图片区域
    const productImages = document.querySelectorAll('.product-image');
    
    productImages.forEach(container => {
        // 获取图片元素
        const img = container.querySelector('img');
        // 获取上传按钮
        const uploadBtn = container.querySelector('.upload-btn');
        
        // 如果图片不可见（表示该位置为空）
        if (img && img.style.display === 'none' && uploadBtn) {
            emptySlots.push({
                imgId: img.id,
                uploadBtn: uploadBtn
            });
        }
    });
    
    return emptySlots;
}

// 删除图片
function deleteImage(imgId) {
    const img = document.getElementById(imgId);
    if (img) {
        // 隐藏图片
        img.style.display = 'none';
        img.src = '';
        
        // 如果是头部或底部图片，重置样式
        if (imgId === 'header-img' || imgId === 'footer-img') {
            // 恢复默认样式
            img.style.objectFit = "";
            img.style.objectPosition = "";
            img.style.width = "";
            img.style.height = "";
            img.style.top = "";
            img.style.left = "";
            img.style.transform = "";
        }
        
        // 隐藏删除按钮
        const deleteBtn = img.nextElementSibling;
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
        
        // 显示上传按钮
        const uploadBtn = img.nextElementSibling.nextElementSibling;
        if (uploadBtn) {
            uploadBtn.style.display = 'flex';
        }
        
        // 查找对应的父容器，如果存在水印元素，也将其重置
        const containerSelector = imgId === 'header-img' ? '.header-image' : 
                                 imgId === 'footer-img' ? '.footer-image' : 
                                 `.product-image[data-id="${imgId}"]`;
        
        const container = document.querySelector(containerSelector);
        if (container) {
            // 移除选择状态
            container.classList.remove('selected');
            
            // 重置水印（仅产品图片有水印）
            if (imgId.startsWith('product-img-')) {
                const watermarkInput = container.querySelector('.watermark-input');
                if (watermarkInput) {
                    // 恢复默认水印文本
                    watermarkInput.value = '折后价：￥999';
                    // 更新保存的水印文本
                    const dataIndex = watermarkInput.getAttribute('data-index');
                    if (dataIndex && typeof watermarkTexts !== 'undefined') {
                        watermarkTexts[dataIndex] = watermarkInput.value;
                    }
                }
            }
        }
    }
}

// 新增：应用图片显示模式
function applyImageDisplayMode() {
    // 应用头部图片显示模式
    applyDisplayMode('header-img', document.getElementById('header-display').value);
    
    // 应用底部图片显示模式
    applyDisplayMode('footer-img', document.getElementById('footer-display').value);
    
    // 应用产品图片显示模式
    const productMode = document.getElementById('product-display').value;
    document.querySelectorAll('[id^="product-img-"]').forEach(img => {
        if (img.style.display !== 'none') {
            applyDisplayMode(img.id, productMode);
        }
    });
}

// 为特定图片应用显示模式
function applyDisplayMode(imgId, mode) {
    const img = document.getElementById(imgId);
    if (!img || img.style.display === 'none' || !img.src) return;
    
    // 重置所有相关样式
    img.style.objectFit = "";
    img.style.objectPosition = "";
    img.style.width = "";
    img.style.height = "";
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.transform = "";
    
    // 根据模式应用不同样式
    switch (mode) {
        case 'original': // 原图模式
            img.style.width = "auto";
            img.style.height = "auto";
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";
            img.style.position = "absolute";
            img.style.top = "50%";
            img.style.left = "50%";
            img.style.transform = "translate(-50%, -50%)";
            break;
            
        case 'stretch': // 拉伸模式
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "fill";
            break;
            
        case 'fill': // 填充模式
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            break;
            
        default:
            // 默认使用拉伸模式
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "fill";
    }
}

// 修改现有的handleFileUpload函数，上传图片后应用显示模式
window.handleFileUpload = function(event) {
    const input = event.target;
    const files = input.files;
    
    // 如果没有文件被选择，直接返回
    if (!files || files.length === 0) return;
    
    let imgId;
    let displayMode = 'stretch'; // 默认显示模式
    
    if (input.id === 'upload-header') {
        imgId = 'header-img';
        displayMode = document.getElementById('header-display').value;
    } else if (input.id === 'upload-footer') {
        imgId = 'footer-img';
        displayMode = document.getElementById('footer-display').value;
    } else {
        imgId = input.id.replace('upload-', 'product-img-');
        displayMode = document.getElementById('product-display').value;
    }
    
    // 处理第一个文件
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // 获取图片数据URL
        const imageDataUrl = e.target.result;
        
        // 保存到本地存储
        if (typeof addImageToStorage === 'function') {
            addImageToStorage(imageDataUrl, file.name);
        }
        
        // 找到对应的图片元素
        const img = document.getElementById(imgId);
        
        if (img) {
            img.src = imageDataUrl;
            img.style.display = "block";
            
            // 应用选择的显示模式
            applyDisplayMode(imgId, displayMode);
            
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
                if (typeof addImageToStorage === 'function') {
                    addImageToStorage(imageDataUrl, file.name);
                }
                
                const img = document.getElementById(slot.imgId);
                if (img) {
                    img.src = imageDataUrl;
                    img.style.display = "block";
                    
                    // 应用选择的显示模式
                    applyDisplayMode(slot.imgId, displayMode);
                    
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

/**
 * 键盘删除功能 - 监听键盘事件，删除选中的图片
 */
function setupKeyboardDeleteListener() {
    // 添加全局键盘事件监听
    document.addEventListener('keydown', function(e) {
        // 仅当按下Delete键时处理
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // 检查是否有选中的图片区域
            if (selectedImages.size > 0) {
                // 防止在输入框中按Delete键时删除图片
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                
                e.preventDefault(); // 阻止默认行为
                
                // 删除所有选中的图片
                deleteSelectedImages();
            }
        }
    });
}

/**
 * 删除所有选中的图片
 */
function deleteSelectedImages() {
    // 创建一个数组存储选中的图片ID，避免在迭代过程中修改selectedImages集合
    const imagesToDelete = [...selectedImages];
    
    // 删除计数
    let deletedCount = 0;
    
    // 逐个删除图片
    imagesToDelete.forEach(imageId => {
        // 获取图片ID
        let imgId;
        if (imageId === 'header-img' || imageId === 'footer-img') {
            imgId = imageId;
        } else if (imageId.includes('product-img-')) {
            imgId = imageId;
        } else {
            // 处理data-id格式
            const element = document.querySelector(`[data-id="${imageId}"]`);
            if (element) {
                imgId = element.dataset.id;
            }
        }
        
        // 调用删除函数
        if (imgId) {
            deleteImage(imgId);
            deletedCount++;
        }
        
        // 从选中集合中移除
        selectedImages.delete(imageId);
    });
    
    // 清除所有选择状态
    clearAllSelections();
    
    // 显示通知
    if (deletedCount > 0) {
        if (typeof showNotification === 'function') {
            showNotification(`已删除${deletedCount}张图片`, 2000);
        }
    }
}

// 导出函数
window.applyImageDisplayMode = applyImageDisplayMode;
window.applyDisplayMode = applyDisplayMode;