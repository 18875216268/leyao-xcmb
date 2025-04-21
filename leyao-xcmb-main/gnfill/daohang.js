/**
 * daohang.js - UI操作相关模块
 * 包含UI交互、设置应用等功能
 */

// 应用整体框架设置
function applyContainerSettings() {
    const containerWidth = document.getElementById('container-width').value;
    const headerHeight = document.getElementById('header-height').value;
    const footerHeight = document.getElementById('footer-height').value;
    
    // 获取容器元素
    const container = document.querySelector('.container');
    
    // 应用宽度
    container.style.maxWidth = `${containerWidth}px`;
    
    // 应用头部高度
    const headerImage = document.querySelector('.header-image');
    headerImage.style.height = `${headerHeight}px`;
    
    // 应用底部高度
    const footerImage = document.querySelector('.footer-image');
    footerImage.style.height = `${footerHeight}px`;
    
    // 固定边角圆润度为15px
    container.style.borderRadius = '15px';
    
    // 固定阴影为强烈
    container.style.boxShadow = '0 0 25px rgba(0, 0, 0, 0.2)';
    
    // 更新头部和底部占位图
    const headerImg = document.getElementById('header-img');
    const footerImg = document.getElementById('footer-img');
    
    // 保存当前状态
    const headerSrc = headerImg.src;
    const headerWasDisplayed = headerImg.style.display !== 'none';
    const footerSrc = footerImg.src;
    const footerWasDisplayed = footerImg.style.display !== 'none';
    
    // 更新头部占位图尺寸
    headerImg.src = `/api/placeholder/${containerWidth}/${headerHeight}`;
    
    // 更新底部占位图尺寸
    footerImg.src = `/api/placeholder/${containerWidth}/${footerHeight}`;
    
    // 恢复用户上传的头部图片
    if (headerWasDisplayed && headerSrc && !headerSrc.includes('/api/placeholder/')) {
        headerImg.src = headerSrc;
        headerImg.style.display = 'block';
        
        // 显示删除按钮
        const deleteBtn = headerImg.nextElementSibling;
        if (deleteBtn && deleteBtn.classList.contains('delete-btn')) {
            deleteBtn.style.display = 'block';
        }
        
        // 隐藏上传按钮
        const uploadBtn = deleteBtn.nextElementSibling;
        if (uploadBtn && uploadBtn.classList.contains('upload-btn')) {
            uploadBtn.style.display = 'none';
        }
    }
    
    // 恢复用户上传的底部图片
    if (footerWasDisplayed && footerSrc && !footerSrc.includes('/api/placeholder/')) {
        footerImg.src = footerSrc;
        footerImg.style.display = 'block';
        
        // 显示删除按钮
        const deleteBtn = footerImg.nextElementSibling;
        if (deleteBtn && deleteBtn.classList.contains('delete-btn')) {
            deleteBtn.style.display = 'block';
        }
        
        // 隐藏上传按钮
        const uploadBtn = deleteBtn.nextElementSibling;
        if (uploadBtn && uploadBtn.classList.contains('upload-btn')) {
            uploadBtn.style.display = 'none';
        }
    }
}

// 添加折叠面板功能 - 修改为支持完全隐藏面板
// 添加折叠面板功能 - 使用新设计的按钮
function setupPanelToggle() {
    console.log("开始创建折叠按钮");
    
    // 确保之前没有创建过按钮
    const existingButton = document.querySelector('.toggle-panel-container');
    if (existingButton) {
        existingButton.remove();
    }
    
    // 创建独立的折叠/展开按钮容器 - 使用新样式
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'toggle-panel-container expanded';
    
    const toggleIcon = document.createElement('div');
    toggleIcon.className = 'toggle-panel-icon';
    
    toggleContainer.appendChild(toggleIcon);
    document.body.appendChild(toggleContainer);
    
    // 获取设置面板和预览容器
    const settingsPanel = document.querySelector('.settings-panel');
    const previewContainer = document.querySelector('.preview-container');
    
    // 初始设置预览容器的边距
    previewContainer.style.marginLeft = '250px';
    
    // 设置面板宽度常量
    const PANEL_WIDTH = 250;
    
    // 添加点击事件
    toggleContainer.addEventListener('click', function(e) {
        console.log("折叠按钮被点击");
        e.stopPropagation(); // 防止事件冒泡
        
        const isCollapsed = !settingsPanel.classList.contains('collapsed');
        
        if (isCollapsed) {
            // 收起面板
            settingsPanel.classList.add('collapsed');
            previewContainer.classList.add('expanded');
            toggleContainer.classList.remove('expanded');
            toggleContainer.classList.add('collapsed');
            
            // 更新预览容器边距
            previewContainer.style.marginLeft = '0';
        } else {
            // 展开面板
            settingsPanel.classList.remove('collapsed');
            previewContainer.classList.remove('expanded');
            toggleContainer.classList.add('expanded');
            toggleContainer.classList.remove('collapsed');
            
            // 恢复预览容器边距
            previewContainer.style.marginLeft = '250px';
        }
    });
    
    console.log("折叠按钮设置完成");
}

// 应用产品设置
function applyProductSettings() {
    const columns = document.getElementById('product-columns').value;
    const gap = document.getElementById('product-gap').value;
    const newCount = parseInt(document.getElementById('product-count').value);
    const currentCount = document.querySelectorAll('.product-item').length;
    
    // 保存当前所有图片的URL，以便重建网格后恢复
    const savedImages = [];
    const productImages = document.querySelectorAll('.product-image img');
    productImages.forEach(img => {
        savedImages.push({
            id: img.id,
            src: img.src,
            displayed: img.style.display !== 'none'
        });
    });
    
    // 更新网格布局
    const productGrid = document.querySelector('.product-grid');
    productGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    productGrid.style.gap = `${gap}px`;
    
    // 如果产品数量发生变化，重新生成网格
    if (newCount !== currentCount) {
        // 修复：如果存在saveAllWatermarkTexts函数，先保存所有水印文本
        if (typeof saveAllWatermarkTexts === 'function') {
            saveAllWatermarkTexts();
        }
        
        initProductGrid();
        
        // 恢复保存的图片
        savedImages.forEach(savedImg => {
            if (savedImg.displayed && document.getElementById(savedImg.id)) {
                const img = document.getElementById(savedImg.id);
                img.src = savedImg.src;
                img.style.display = 'block';
                
                // 重新显示删除按钮
                const deleteBtn = img.nextElementSibling;
                if (deleteBtn && deleteBtn.classList.contains('delete-btn')) {
                    deleteBtn.style.display = 'block';
                }
                
                // 隐藏上传按钮
                const uploadBtn = deleteBtn.nextElementSibling;
                if (uploadBtn && uploadBtn.classList.contains('upload-btn')) {
                    uploadBtn.style.display = 'none';
                }
            }
        });
        
        // 修复：添加对addWatermarksToProducts的调用，确保为新的图片区域创建水印元素
        addWatermarksToProducts();
        
        // 应用水印设置
        applyWatermarkSettings();
    }
}

// 设置所有事件监听器
function setupEventListeners() {
    // 头部和底部文件上传监听 - 保留但不再添加单击事件
    document.getElementById('upload-header').addEventListener('change', handleFileUpload);
    document.getElementById('upload-footer').addEventListener('change', handleFileUpload);
    
    // 不再为头部和底部区域添加双击事件监听，已在zhu.js的setupHeaderFooterSelection中处理
}

// 导出模板函数
function exportTemplate() {
    // 获取当前设置
    const containerWidth = document.getElementById('container-width').value;
    const headerHeight = document.getElementById('header-height').value;
    const footerHeight = document.getElementById('footer-height').value;
    const shadowStyle = '0 0 25px rgba(0, 0, 0, 0.2)'; // 固定为强烈阴影
    
    // 创建一个新的HTML文档
    let exportDoc = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>产品宣传模板</title>
    <style>
    /* 样式设置 */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    }
    
    body {
        background-color: ${document.body.style.backgroundColor || '#f0f0f0'};
        padding: 20px;
    }
    
    .container {
        max-width: ${containerWidth}px;
        margin: 0 auto;
        box-shadow: ${shadowStyle};
        background-color: white;
        border-radius: 15px;
        overflow: hidden;
    }
    
    /* 头部样式 */
    .header-wrapper {
        width: 100%;
        padding: 0;
        margin: 0;
    }
    
    .header-image {
        width: 100%;
        height: ${headerHeight}px;
        position: relative;
        background-color: #f0f0f0;
        overflow: hidden;
    }
    
    .header-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    /* 网格布局 */
    .product-grid {
        display: grid;
        grid-template-columns: repeat(${document.getElementById('product-columns').value}, 1fr);
        gap: ${document.getElementById('product-gap').value}px;
        padding: 20px;
        justify-items: center; /* 确保产品在每个网格单元格中居中 */
    }
    
    .product-item {
        width: 100%; /* 使框架能够响应调整 */
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin: 0 auto; /* 确保在网格单元格中居中 */
    }
    
    .product-image {
        width: 100%;
        height: 0;
        padding-bottom: 152%; /* 固定宽高比 980/645=1.52 */
        position: relative;
        overflow: hidden;
        background-color: #f0f0f0;
    }
    
    .product-image img {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        object-fit: contain;
    }
    
    /* 底部信息样式 */
    .footer-wrapper {
        width: 100%;
        padding: 0;
        margin: 0;
    }
    
    .footer-image {
        width: 100%;
        height: ${footerHeight}px;
        position: relative;
        background-color: #f0f0f0;
        overflow: hidden;
    }
    
    .footer-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .upload-btn {
        display: none; /* 在导出版本中隐藏上传按钮 */
    }

    /* 响应式布局调整 */
    @media (max-width: 1200px) {
        .product-item {
            max-width: 100%;
        }
    }
    </style>
</head>
<body>
    <div class="container">
        <!-- 头部区域 -->
        <div class="header-wrapper">
            <div class="header-image">
                <img src="${document.getElementById('header-img').src}" alt="头部宣传图">
            </div>
        </div>
        
        <!-- 产品网格 -->
        <div class="product-grid">
`;
}