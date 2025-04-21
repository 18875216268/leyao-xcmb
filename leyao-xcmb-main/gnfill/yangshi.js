/**
 * yulan.js - 图片预览功能模块
 * 提供历史图片预览和全屏查看功能
 */

// 创建全局命名空间，防止与其他模块冲突
window.YuLan = (function() {
    // 私有变量
    let isPreviewActive = false;
    let previewContainer = null;
    
    /**
     * 初始化预览功能
     * 在页面中创建预览容器并设置相关事件
     */
    function initialize() {
        // 防止重复初始化
        if (document.getElementById('image-preview-container')) return;
        
        // 创建预览容器
        previewContainer = document.createElement('div');
        previewContainer.id = 'image-preview-container';
        previewContainer.className = 'image-preview-container';
        
        // 创建预览背景（用于点击关闭）
        const previewBackground = document.createElement('div');
        previewBackground.className = 'preview-background';
        previewContainer.appendChild(previewBackground);
        
        // 创建预览内容区域
        const previewContent = document.createElement('div');
        previewContent.className = 'preview-content';
        previewContainer.appendChild(previewContent);
        
        // 创建关闭按钮
        const closeButton = document.createElement('div');
        closeButton.className = 'preview-close-btn';
        closeButton.innerHTML = '×';
        closeButton.title = '关闭预览 (ESC)';
        previewContent.appendChild(closeButton);
        
        // 创建图片元素
        const previewImage = document.createElement('img');
        previewImage.className = 'preview-image';
        previewContent.appendChild(previewImage);
        
        // 添加到页面但先隐藏
        document.body.appendChild(previewContainer);
        
        // 添加关闭事件
        closeButton.addEventListener('click', closePreview);
        previewBackground.addEventListener('click', closePreview);
        
        // 添加键盘事件监听（ESC关闭）
        document.addEventListener('keydown', handleKeydown);
        
        // 初始隐藏
        previewContainer.style.display = 'none';
        isPreviewActive = false;
        
        console.log('图片预览功能已初始化');
    }
    
    /**
     * 处理键盘事件
     * @param {KeyboardEvent} e - 键盘事件对象
     */
    function handleKeydown(e) {
        // 仅在预览激活时处理
        if (!isPreviewActive) return;
        
        // ESC键关闭预览
        if (e.key === 'Escape') {
            closePreview();
        }
    }
    
    /**
     * 显示图片预览
     * @param {string} imageUrl - 图片URL或Data URL
     * @param {string} [altText='图片预览'] - 图片替代文本
     */
    function showPreview(imageUrl, altText = '图片预览') {
        // 确保容器已初始化
        if (!previewContainer) {
            initialize();
        }
        
        // 更新图片
        const previewImage = previewContainer.querySelector('.preview-image');
        if (previewImage) {
            previewImage.src = imageUrl;
            previewImage.alt = altText;
            
            // 图片加载错误处理
            previewImage.onerror = function() {
                this.src = '/api/placeholder/400/300';
                this.alt = '图片加载失败';
                console.error('预览图片加载失败:', imageUrl);
            };
        }
        
        // 显示预览容器
        previewContainer.style.display = 'flex';
        
        // 延迟一点点再添加active类，确保过渡动画正常工作
        setTimeout(() => {
            previewContainer.classList.add('active');
            isPreviewActive = true;
            
            // 禁止背景滚动
            document.body.style.overflow = 'hidden';
        }, 10);
    }
    
    /**
     * 关闭图片预览
     */
    function closePreview() {
        if (!previewContainer) return;
        
        // 移除活动状态（触发淡出动画）
        previewContainer.classList.remove('active');
        isPreviewActive = false;
        
        // 恢复背景滚动
        document.body.style.overflow = '';
        
        // 延迟后完全隐藏
        setTimeout(() => {
            previewContainer.style.display = 'none';
            
            // 清空图片源，释放内存
            const previewImage = previewContainer.querySelector('.preview-image');
            if (previewImage) {
                previewImage.src = '';
                previewImage.alt = '';
            }
        }, 300); // 等待过渡动画完成
    }
    
    /**
     * 为DOM元素添加预览功能
     * @param {HTMLElement} element - 需要添加预览功能的元素
     * @param {string|Function} imageSource - 图片URL或返回图片URL的函数
     */
    function addPreviewButton(element, imageSource) {
        // 确保元素相对定位
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        // 创建预览按钮
        const previewBtn = document.createElement('div');
        previewBtn.className = 'preview-btn';
        previewBtn.title = '预览图片';
        previewBtn.innerHTML = '<span class="preview-icon">🔍</span>';
        
        // 添加到元素中
        element.appendChild(previewBtn);
        
        // 添加点击事件
        previewBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止触发父元素事件
            
            // 获取图片URL
            let imgUrl;
            if (typeof imageSource === 'function') {
                imgUrl = imageSource();
            } else {
                imgUrl = imageSource;
            }
            
            // 显示预览
            if (imgUrl) {
                showPreview(imgUrl);
            }
        });
        
        return previewBtn;
    }
    
    /**
     * 为历史面板图片添加预览功能
     */
    function setupHistoryImagePreviews() {
        // 初始化预览容器
        initialize();
        
        // 监听历史面板变化
        const historyContainer = document.querySelector('.history-container');
        if (!historyContainer) return;
        
        // 使用MutationObserver监听新添加的历史图片
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('history-item')) {
                            addPreviewToHistoryItem(node);
                        }
                    });
                }
            });
        });
        
        // 开始观察
        observer.observe(historyContainer, { childList: true });
        
        // 处理现有的历史图片项
        document.querySelectorAll('.history-item').forEach(item => {
            addPreviewToHistoryItem(item);
        });
    }
    
    /**
     * 为单个历史图片项添加预览功能
     * @param {HTMLElement} historyItem - 历史图片项元素
     */
    function addPreviewToHistoryItem(historyItem) {
        // 检查是否已有预览按钮
        if (historyItem.querySelector('.preview-btn')) return;
        
        // 获取缩略图容器
        const thumbnail = historyItem.querySelector('.history-thumbnail');
        if (!thumbnail) return;
        
        // 获取图片元素
        const img = thumbnail.querySelector('img');
        if (!img) return;
        
        // 添加预览按钮
        addPreviewButton(thumbnail, () => img.src);
    }
    
    // 暴露公共API
    return {
        init: initialize,
        show: showPreview,
        close: closePreview,
        addButton: addPreviewButton,
        setupHistoryPreviews: setupHistoryImagePreviews
    };
})();

// 在页面加载完成后初始化预览功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化预览功能
    YuLan.init();
    
    // 为历史面板图片添加预览功能
    if (document.querySelector('.history-container')) {
        YuLan.setupHistoryPreviews();
    }
});