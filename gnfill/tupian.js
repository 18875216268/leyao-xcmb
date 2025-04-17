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
    
    // 默认的产品图片尺寸 (固定比例)
    const productWidth = 645;  // 固定宽度参考值
    const productHeight = 980; // 固定高度参考值
    
    // 设置网格列数
    gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // 创建产品项目
    for (let i = 1; i <= productCount; i++) {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
            <div class="product-image" data-id="product-img-${i}">
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
    }
}