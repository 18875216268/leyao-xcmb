/**
 * yulan.js - 图片预览功能
 * 用于实现头部、底部、产品区域和历史面板的图片预览功能
 */

// 使用立即执行函数表达式创建预览模块
const PreviewModule = (function() {
    // 私有变量和方法
    let previewModal = null;
    let previewImage = null;
    let previewContent = null;
    let currentScale = 1;
    let currentRotation = 0;
    
    // 拖动相关变量
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let currentX = 0;
    let currentY = 0;
    
    /**
     * 初始化预览模块
     */
    function initialize() {
        // 创建预览弹窗
        createPreviewModal();
        
        // 为所有区域添加预览功能
        setupImagePreviews();
        
        // 监听DOM变化，为新添加的元素添加预览功能
        observeDOMChanges();
    }
    
    /**
     * 创建预览弹窗
     */
    function createPreviewModal() {
        // 检查是否已存在预览弹窗
        if (document.getElementById('preview-modal')) {
            return;
        }
        
        // 创建弹窗容器
        previewModal = document.createElement('div');
        previewModal.id = 'preview-modal';
        previewModal.className = 'preview-modal';
        
        // 创建预览内容区域
        previewContent = document.createElement('div');
        previewContent.className = 'preview-content';
        
        // 创建预览图片元素
        previewImage = document.createElement('img');
        previewImage.className = 'preview-image';
        previewImage.alt = '图片预览';
        
        // 创建控制按钮容器
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'preview-controls';
        
        // 只保留旋转和关闭按钮，移除缩放按钮
        
        // 旋转按钮
        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'preview-control-btn rotate';
        rotateBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="white" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"></path></svg>';
        rotateBtn.title = '旋转';
        
        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.className = 'preview-control-btn close';
        closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>';
        closeBtn.title = '关闭';
        
        // 添加控制按钮点击事件
        rotateBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            rotate();
        });
        
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closePreview();
        });
        
        // 添加图片点击事件，阻止冒泡
        previewImage.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // 添加鼠标滚轮事件，控制缩放
        previewContent.addEventListener('wheel', function(e) {
            e.preventDefault(); // 阻止默认滚动行为
            
            if (e.deltaY < 0) {
                // 向上滚动，放大图片
                zoomIn(0.1); // 滚轮缩放增量更小，提供更精细的控制
            } else {
                // 向下滚动，缩小图片
                zoomOut(0.1);
            }
        });
        
        // 优化拖动功能 - 使图片直接跟随鼠标移动
        // 鼠标按下事件
        previewImage.addEventListener('mousedown', function(e) {
            // 取消默认的选取行为
            e.preventDefault();
            
            // 开始拖动
            isDragging = true;
            // 记录起始位置
            dragStartX = e.clientX - currentX;
            dragStartY = e.clientY - currentY;
            
            // 更改鼠标样式为抓取状态
            previewImage.style.cursor = 'grabbing';
        });
        
        // 鼠标移动事件
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                // 直接计算新位置 - 完全跟随鼠标
                currentX = e.clientX - dragStartX;
                currentY = e.clientY - dragStartY;
                
                // 立即更新图片位置，不添加过渡效果
                previewImage.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale}) rotate(${currentRotation}deg)`;
                
                // 防止选中文本
                e.preventDefault();
            }
        });
        
        // 鼠标释放事件
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                previewImage.style.cursor = 'grab';
            }
        });
        
        // 鼠标离开事件
        previewImage.addEventListener('mouseleave', function() {
            if (isDragging) {
                isDragging = false;
                previewImage.style.cursor = 'grab';
            }
        });
        
        // 当图片缩放时更改鼠标样式为可拖动状态
        previewImage.addEventListener('mouseenter', function() {
            previewImage.style.cursor = 'grab';
        });
        
        // 组装控制按钮 - 仅添加旋转和关闭按钮
        controlsContainer.appendChild(rotateBtn);
        controlsContainer.appendChild(closeBtn);
        
        // 组装DOM结构
        previewContent.appendChild(previewImage);
        previewModal.appendChild(previewContent);
        previewModal.appendChild(controlsContainer);
        document.body.appendChild(previewModal);
        
        // 添加点击事件，阻止背景点击关闭
        previewModal.addEventListener('click', function(e) {
            e.stopPropagation();
            // 不执行任何关闭操作，确保只能通过关闭按钮关闭
        });
        
        // 添加键盘事件
        document.addEventListener('keydown', function(e) {
            if (!previewModal.classList.contains('active')) return;
            
            if (e.key === 'Escape') {
                closePreview();
            } else if (e.key === '+' || e.key === '=') {
                zoomIn();
                e.preventDefault();
            } else if (e.key === '-') {
                zoomOut();
                e.preventDefault();
            } else if (e.key === 'r') {
                rotate();
                e.preventDefault();
            }
        });
    }
    
    
    /**
     * 放大图片
     * @param {number} increment - 缩放增量，默认0.2
     */
    function zoomIn(increment = 0.2) {
        currentScale += increment;
        updateImageTransform();
        
        // 更新鼠标样式
        if (currentScale > 1 && previewImage) {
            previewImage.style.cursor = 'grab';
        }
    }
    
    /**
     * 缩小图片
     * @param {number} decrement - 缩放减量，默认0.2
     */
    function zoomOut(decrement = 0.2) {
        // 设置最小缩放比例为原始大小的1/5
        const MIN_SCALE = 0.2;
        
        // 确保不会缩小到最小比例以下
        if (currentScale > MIN_SCALE + decrement) {
            // 正常缩小
            currentScale -= decrement;
            updateImageTransform();
        } else if (currentScale > MIN_SCALE) {
            // 如果减去decrement会低于最小值，则直接设为最小值
            currentScale = MIN_SCALE;
            updateImageTransform();
        }
        
        // 当图片缩小到一定程度，可以考虑修改鼠标样式
        if (currentScale <= MIN_SCALE) {
            previewImage.style.cursor = 'default';
        } else {
            previewImage.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
    }
    
    /**
     * 旋转图片
     */
    function rotate() {
        currentRotation = (currentRotation + 90) % 360;
        updateImageTransform();
    }
    
    /**
     * 更新图片变换样式
     */
    function updateImageTransform() {
        if (previewImage) {
            // 直接应用变换，不添加transition属性
            previewImage.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale}) rotate(${currentRotation}deg)`;
        }
    }
    
    /**
     * 为所有区域设置图片预览
     */
    function setupImagePreviews() {
        // 为主区域添加预览
        setupMainAreaPreviews();
        
        // 为历史面板添加预览
        setupHistoryPreviews();
    }
    
    /**
     * 为主区域(头部、底部、产品区域)设置预览
     */
    function setupMainAreaPreviews() {
        // 头部区域
        const headerImage = document.querySelector('.header-image');
        if (headerImage) {
            const img = headerImage.querySelector('#header-img');
            if (img && img.style.display !== 'none' && !img.src.includes('/api/placeholder/')) {
                addPreviewButton(headerImage, img.src);
            }
        }
        
        // 底部区域
        const footerImage = document.querySelector('.footer-image');
        if (footerImage) {
            const img = footerImage.querySelector('#footer-img');
            if (img && img.style.display !== 'none' && !img.src.includes('/api/placeholder/')) {
                addPreviewButton(footerImage, img.src);
            }
        }
        
        // 产品区域
        const productImages = document.querySelectorAll('.product-image');
        productImages.forEach(container => {
            const img = container.querySelector('img[id^="product-img-"]');
            if (img && img.style.display !== 'none' && !img.src.includes('/api/placeholder/')) {
                addPreviewButton(container, img.src);
            }
        });
    }
    
    /**
     * 为历史面板设置预览
     */
    function setupHistoryPreviews() {
        const historyThumbnails = document.querySelectorAll('.history-thumbnail');
        historyThumbnails.forEach(thumbnail => {
            const img = thumbnail.querySelector('img');
            if (img && img.src) {
                addPreviewButton(thumbnail, img.src, true);
            }
        });
    }
    
    /**
     * 添加预览按钮
     * @param {HTMLElement} container - 容器元素
     * @param {string} imgSrc - 图片源
     * @param {boolean} [isHistory=false] - 是否是历史面板
     */
    function addPreviewButton(container, imgSrc, isHistory = false) {
        // 检查是否已有预览按钮
        if (container.querySelector('.preview-btn')) {
            return;
        }
        
        // 创建预览按钮
        const previewBtn = document.createElement('div');
        previewBtn.className = 'preview-btn';
        previewBtn.title = '预览图片';
        
        // 使用提供的SVG作为图标，设置为浅灰白色
        previewBtn.innerHTML = `<svg class="preview-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <path d="M512 819.2c-118.784 0-235.52-55.296-346.112-147.456-38.912-32.768-71.68-65.536-102.4-100.352-10.24-12.288-20.48-22.528-28.672-32.768-4.096-6.144-8.192-10.24-10.24-12.288l-8.192-12.288 8.192-12.288c2.048-2.048 6.144-6.144 10.24-12.288 8.192-10.24 18.432-20.48 28.672-32.768 30.72-34.816 65.536-67.584 102.4-100.352 110.592-92.16 227.328-147.456 346.112-147.456s235.52 55.296 346.112 147.456c38.912 32.768 71.68 65.536 102.4 100.352 10.24 12.288 20.48 22.528 28.672 32.768 4.096 6.144 8.192 10.24 10.24 12.288l8.192 12.288-8.192 12.288c-2.048 2.048-6.144 6.144-10.24 12.288-8.192 10.24-18.432 20.48-28.672 32.768-30.72 34.816-65.536 67.584-102.4 100.352-110.592 92.16-227.328 147.456-346.112 147.456z m-417.792-276.48c28.672 32.768 61.44 65.536 98.304 96.256 102.4 86.016 210.944 139.264 319.488 139.264s217.088-51.2 319.488-139.264c36.864-30.72 69.632-63.488 98.304-96.256 10.24-12.288 18.432-22.528 26.624-30.72-8.192-10.24-16.384-20.48-26.624-30.72-28.672-32.768-61.44-65.536-98.304-96.256-102.4-86.016-210.944-139.264-319.488-139.264s-217.088 51.2-319.488 139.264c-36.864 30.72-69.632 63.488-98.304 96.256-10.24 12.288-18.432 22.528-26.624 30.72 6.144 10.24 16.384 20.48 26.624 30.72z m417.792 174.08c-112.64 0-204.8-92.16-204.8-204.8s92.16-204.8 204.8-204.8 204.8 92.16 204.8 204.8-92.16 204.8-204.8 204.8z m0-40.96c90.112 0 163.84-73.728 163.84-163.84s-73.728-163.84-163.84-163.84-163.84 73.728-163.84 163.84 73.728 163.84 163.84 163.84z" fill="#e0e0e0" />
        </svg>`;
        
        // 添加点击事件
        previewBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止触发其他事件
            showPreview(imgSrc);
        });
        
        // 添加到容器
        container.appendChild(previewBtn);
    }
    
    /**
     * 显示预览
     * @param {string} imgSrc - 图片源
     */
    function showPreview(imgSrc) {
        // 确保预览弹窗已创建
        if (!previewModal) {
            createPreviewModal();
        }
        
        // 重置缩放、旋转和位置
        currentScale = 1;
        currentRotation = 0;
        currentX = 0;
        currentY = 0;
        
        // 设置图片源
        previewImage.src = imgSrc;
        previewImage.style.transform = '';
        previewImage.style.cursor = 'default';
        
        // 显示弹窗
        previewModal.style.display = 'flex';
        
        // 添加激活类，触发过渡效果
        setTimeout(() => {
            previewModal.classList.add('active');
            // 禁止背景滚动
            document.body.style.overflow = 'hidden';
        }, 10);
    }
    
    /**
     * 关闭预览
     */
    function closePreview() {
        // 移除激活类，触发过渡效果
        previewModal.classList.remove('active');
        
        // 恢复背景滚动
        document.body.style.overflow = '';
        
        // 等待过渡完成后隐藏弹窗
        setTimeout(() => {
            previewModal.style.display = 'none';
            
            // 清空图片源和变换，释放内存
            previewImage.src = '';
            previewImage.style.transform = '';
            currentScale = 1;
            currentRotation = 0;
            currentX = 0;
            currentY = 0;
        }, 300);
    }
    
    /**
     * 观察DOM变化以更新预览功能
     */
    function observeDOMChanges() {
        // 创建MutationObserver实例
        const observer = new MutationObserver(function(mutations) {
            let needRefresh = false;
            
            mutations.forEach(function(mutation) {
                // 检查节点添加
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 检查是否添加了新的图片
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i];
                        if (node.nodeType === 1) { // 元素节点
                            if (node.tagName === 'IMG' || 
                                node.querySelector('img') ||
                                node.classList.contains('product-image') ||
                                node.classList.contains('history-item')) {
                                needRefresh = true;
                                break;
                            }
                        }
                    }
                }
                
                // 检查属性变化
                if (mutation.type === 'attributes') {
                    if (mutation.target.tagName === 'IMG' && 
                        (mutation.attributeName === 'style' || 
                         mutation.attributeName === 'src')) {
                        needRefresh = true;
                    }
                }
            });
            
            // 如果需要刷新，重新设置预览
            if (needRefresh) {
                // 添加延迟确保DOM已更新
                setTimeout(setupImagePreviews, 100);
            }
        });
        
        // 设置观察选项
        const config = {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'src']
        };
        
        // 开始观察整个文档
        observer.observe(document.body, config);
    }
    
    // 清理预览按钮
    function clearPreviewButtons() {
        // 移除所有预览按钮
        const previewButtons = document.querySelectorAll('.preview-btn');
        previewButtons.forEach(btn => {
            if (btn.parentNode) {
                btn.parentNode.removeChild(btn);
            }
        });
    }
    
    // 刷新预览功能
    function refreshPreviews() {
        clearPreviewButtons();
        setupImagePreviews();
    }
    
    // 暴露公共API
    return {
        init: initialize,
        refresh: refreshPreviews,
        show: showPreview,
        close: closePreview
    };
})();

// 当页面加载完成后初始化预览模块
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保其他脚本已加载
    setTimeout(function() {
        PreviewModule.init();
    }, 300);
});