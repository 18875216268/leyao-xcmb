/**
 * yulan.js - 图片预览功能
 * 用于实现头部、底部、产品区域和历史面板的图片预览功能
 */

// 使用立即执行函数表达式创建预览模块
const PreviewModule = (function() {
    // 私有变量和方法
    let previewModal = null;
    let previewImage = null;
    
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
        const content = document.createElement('div');
        content.className = 'preview-content';
        
        // 创建预览图片元素
        previewImage = document.createElement('img');
        previewImage.className = 'preview-image';
        previewImage.alt = '图片预览';
        
        // 创建关闭按钮
        const closeBtn = document.createElement('div');
        closeBtn.className = 'preview-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.title = '关闭预览 (ESC)';
        
        // 组装DOM结构
        content.appendChild(previewImage);
        content.appendChild(closeBtn);
        previewModal.appendChild(content);
        document.body.appendChild(previewModal);
        
        // 添加关闭事件
        closeBtn.addEventListener('click', closePreview);
        previewModal.addEventListener('click', function(e) {
            if (e.target === previewModal) {
                closePreview();
            }
        });
        
        // 添加键盘事件
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && previewModal.classList.contains('active')) {
                closePreview();
            }
        });
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
        
        // 设置图片源
        previewImage.src = imgSrc;
        
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
            
            // 清空图片源，释放内存
            previewImage.src = '';
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