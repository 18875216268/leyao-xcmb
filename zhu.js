/**
 * zhu.js - 主JS文件
 * 负责加载模块和初始化应用
 */

// 初始化函数 - 加载所有模块并设置默认参数
document.addEventListener('DOMContentLoaded', function() {
    // 1. 初始化产品网格
    initProductGrid();
    
    // 2. a.设置事件监听器
    setupEventListeners();
    
    // 2. b.添加水印元素到产品图片
    addWatermarksToProducts();
    
    // 2. c.设置面板折叠功能
    setupPanelToggle();
    
    // 3. 为所有设置项添加实时更新监听
    setupAutoApplyListeners();
    
    // 4. 应用设置
    applyContainerSettings();
    applyProductSettings();
    applyGlobalSettings();
    
    // 5. 先延迟一点应用水印设置，确保值被正确应用
    setTimeout(applyWatermarkSettings, 100);
    
    // 6. 确保历史面板初始化
    if (typeof initLocalStorage === 'function') {
        setTimeout(function() {
            initLocalStorage();
            if (typeof loadHistoryImages === 'function') {
                loadHistoryImages();
            }
        }, 200);
    }
    
    // 7. 初始化头部和底部区域的选择功能
    setupHeaderFooterSelection();
    
    // 8. 初始化通知系统
    initNotification();
    
    // 9. 加载默认头部和底部图片
    loadDefaultHeaderFooterImages();
    
    // 10. 初始化下载按钮
    initDownloadButton();
});

// 初始化头部和底部区域的选择和上传功能
function setupHeaderFooterSelection() {
    // 为头部区域添加自定义属性和事件
    const headerWrapper = document.querySelector('.header-image');
    if (headerWrapper) {
        headerWrapper.setAttribute('data-id', 'header-img');
        
        // 移除上传按钮的可点击性，保留但使其不响应点击
        const uploadBtn = headerWrapper.querySelector('.upload-btn');
        if (uploadBtn) {
            uploadBtn.style.pointerEvents = 'none';
            // 更改文本提示
            const uploadText = uploadBtn.querySelector('.upload-text');
            if (uploadText) {
                uploadText.textContent = '双击上传头部宣传图';
            }
        }
        
        // 添加单击选择事件
        headerWrapper.addEventListener('click', function(e) {
            e.stopPropagation();
            handleImageSelection(this, e);
        });
        
        // 添加双击上传事件
        headerWrapper.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            const fileInput = this.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.click();
            }
        });
    }
    
    // 为底部区域添加自定义属性和事件
    const footerWrapper = document.querySelector('.footer-image');
    if (footerWrapper) {
        footerWrapper.setAttribute('data-id', 'footer-img');
        
        // 移除上传按钮的可点击性，保留但使其不响应点击
        const uploadBtn = footerWrapper.querySelector('.upload-btn');
        if (uploadBtn) {
            uploadBtn.style.pointerEvents = 'none';
            // 更改文本提示
            const uploadText = uploadBtn.querySelector('.upload-text');
            if (uploadText) {
                uploadText.textContent = '双击上传底部标签图';
            }
        }
        
        // 添加单击选择事件
        footerWrapper.addEventListener('click', function(e) {
            e.stopPropagation();
            handleImageSelection(this, e);
        });
        
        // 添加双击上传事件
        footerWrapper.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            const fileInput = this.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.click();
            }
        });
    }
}

// 应用全局设置
function applyGlobalSettings() {
    const exteriorBgColor = document.getElementById('exterior-background').value;
    const interiorBgColor = document.getElementById('interior-background').value;

    // 设置内部背景色
    const container = document.querySelector('.container');
    container.style.backgroundColor = interiorBgColor;
}

// 设置自动应用监听器
function setupAutoApplyListeners() {
    // 整体框架设置自动应用
    document.getElementById('container-width').addEventListener('input', applyContainerSettings);
    document.getElementById('header-height').addEventListener('input', applyContainerSettings);
    document.getElementById('footer-height').addEventListener('input', applyContainerSettings);

    // 产品设置自动应用
    document.getElementById('product-columns').addEventListener('change', applyProductSettings);
    document.getElementById('product-gap').addEventListener('input', applyProductSettings);
    document.getElementById('product-count').addEventListener('input', applyProductSettings);
    
    // 背景颜色设置自动应用
    document.getElementById('exterior-background').addEventListener('input', applyGlobalSettings);
    document.getElementById('interior-background').addEventListener('input', applyGlobalSettings);
    
    // 水印设置自动应用
    document.getElementById('watermark-enabled').addEventListener('change', applyWatermarkSettings);
    document.getElementById('watermark-color').addEventListener('input', applyWatermarkSettings);
    document.getElementById('watermark-weight').addEventListener('change', applyWatermarkSettings);
    document.getElementById('watermark-size').addEventListener('input', applyWatermarkSettings);
    document.getElementById('watermark-border-color').addEventListener('input', applyWatermarkSettings);
    document.getElementById('watermark-border').addEventListener('input', applyWatermarkSettings);
    document.getElementById('watermark-angle').addEventListener('input', applyWatermarkSettings);
}

// 重新初始化产品网格函数，增加添加水印的功能
function reinitProductGrid() {
    initProductGrid();
    addWatermarksToProducts();
    applyWatermarkSettings();
    setupHeaderFooterSelection(); // 确保头部和底部区域也重新初始化
}

// 通知系统
let notificationContainer = null;
let activeNotifications = [];
let notificationCounter = 0;

// 初始化通知容器
function initNotification() {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
}

// 显示通知
function showNotification(message, duration = 2000) {
    // 确保容器已初始化
    if (!notificationContainer) {
        initNotification();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.id = 'notification-' + notificationCounter++;
    notification.style.opacity = '0';
    
    // 添加到容器
    notificationContainer.appendChild(notification);
    activeNotifications.push(notification);
    
    // 重新排列所有通知
    rearrangeNotifications();
    
    // 显示通知
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // 设置消失定时器
    setTimeout(() => {
        // 通知开始淡出并向上移动
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-50px)';
        
        // 从活动通知列表中移除
        const index = activeNotifications.indexOf(notification);
        if (index > -1) {
            activeNotifications.splice(index, 1);
        }
        
        // 动画完成后移除DOM元素
        setTimeout(() => {
            if (notification.parentNode) {
                notificationContainer.removeChild(notification);
            }
            // 重新排列剩余通知
            rearrangeNotifications();
        }, 500);
    }, duration);
}

// 重新排列通知位置
function rearrangeNotifications() {
    // 不需要特别的排列，CSS的flex布局会自动处理
}

// 加载默认头部和底部图片
function loadDefaultHeaderFooterImages() {
    // 检查头部默认图片
    loadImageWithFallback('img/头部.jpg', 'header-img', '头部');
    
    // 检查底部默认图片
    loadImageWithFallback('img/底部.jpg', 'footer-img', '底部');
}

// 加载图片并处理可能的错误
function loadImageWithFallback(imgPath, targetId, imageName) {
    const img = document.getElementById(targetId);
    if (!img) return;

    // 检查图片是否已经有内容
    if (img.src && img.src !== '' && !img.src.includes('/api/placeholder/')) {
        // 图片已经有内容，不需要加载默认图片
        return;
    }
    
    // 创建临时图片对象来检查图片是否存在
    const tempImg = new Image();
    tempImg.onload = function() {
        // 图片存在，应用它
        img.src = imgPath;
        img.style.display = 'block';
        
        // 隐藏上传按钮
        const imgContainer = img.closest('.header-image, .footer-image');
        if (imgContainer) {
            const uploadBtn = imgContainer.querySelector('.upload-btn');
            if (uploadBtn) {
                uploadBtn.style.display = 'none';
            }
        }
        
        // 显示删除按钮
        const deleteBtn = img.nextElementSibling;
        if (deleteBtn && deleteBtn.classList.contains('delete-btn')) {
            deleteBtn.style.display = 'block';
        }
        
        // 保存到历史记录
        if (typeof addImageToStorage === 'function') {
            tempImg.onload = null; // 防止循环
            fetch(imgPath)
                .then(response => response.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = function() {
                        addImageToStorage(reader.result, imageName);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(error => {
                    console.error('无法获取默认图片数据:', error);
                });
        }
    };
    
    tempImg.onerror = function() {
        // 图片不存在，不做任何处理
        console.log(`默认${imageName}图片不存在: ${imgPath}`);
    };
    
    // 开始加载图片
    tempImg.src = imgPath;
}

// 初始化下载按钮
function initDownloadButton() {
    // 创建下载按钮
    const downloadButton = document.createElement('div');
    downloadButton.className = 'fixed-download-button';
    
    // 检查历史面板状态，设置初始位置类
    const historyPanel = document.querySelector('.history-panel');
    if (historyPanel && !historyPanel.classList.contains('collapsed')) {
        downloadButton.classList.add('with-panel');
    }
    
    // 添加图标
    downloadButton.innerHTML = `<img src="img/下载.png" alt="下载">`;
    
    // 添加点击事件
    downloadButton.addEventListener('click', downloadFrameAsImage);
    
    // 添加到页面
    document.body.appendChild(downloadButton);
    
    // 监听历史面板状态变化
    listenToHistoryPanelChanges(downloadButton);
}

// 监听历史面板状态变化
function listenToHistoryPanelChanges(downloadButton) {
    // 监听切换按钮点击
    const toggleContainer = document.querySelector('.toggle-history-container');
    if (toggleContainer) {
        toggleContainer.addEventListener('click', function() {
            // 延迟执行以确保面板状态已更新
            setTimeout(() => {
                const historyPanel = document.querySelector('.history-panel');
                if (historyPanel) {
                    if (historyPanel.classList.contains('collapsed')) {
                        downloadButton.classList.remove('with-panel');
                    } else {
                        downloadButton.classList.add('with-panel');
                    }
                }
            }, 50);
        });
    }
    
    // 监听面板宽度变化
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            // 更新CSS变量，按钮位置会自动跟随
            const width = entry.contentRect.width;
            document.documentElement.style.setProperty('--panel-width', width + 'px');
        }
    });
    
    const historyPanel = document.querySelector('.history-panel');
    if (historyPanel) {
        resizeObserver.observe(historyPanel);
    }
}

// 下载框架为图片
async function downloadFrameAsImage() {
    // 获取下载按钮
    const downloadButton = document.querySelector('.fixed-download-button');
    if (!downloadButton) return;
    
    // 设置为加载状态
    const originalHTML = downloadButton.innerHTML;
    downloadButton.classList.add('loading');
    
    try {
        // 确保html2canvas已加载
        await loadHtml2Canvas();
        
        // 获取要截图的容器
        const container = document.querySelector('.container');
        if (!container) {
            throw new Error('找不到容器元素');
        }
        
        // 使用html2canvas将容器转换为canvas
        showNotification('正在生成图片，请稍等...', 3000);
        
        const canvas = await html2canvas(container, {
            useCORS: true,           // 支持跨域图片
            allowTaint: true,        // 允许污染画布
            scrollX: 0,              // 不包含水平滚动
            scrollY: 0,              // 不包含垂直滚动
            scale: 2,                // 增加截图清晰度
            backgroundColor: null,   // 透明背景
            logging: false           // 关闭日志
        });
        
        // 将canvas转换为图片URL
        const imgData = canvas.toDataURL('image/png');
        
        // 创建下载链接并触发点击
        const downloadLink = document.createElement('a');
        downloadLink.href = imgData;
        downloadLink.download = '宣传海报_' + new Date().toLocaleString().replace(/[\/\s:]/g, '-') + '.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        showNotification('图片已下载！', 2000);
    } catch (error) {
        console.error('下载图片失败:', error);
        showNotification('下载失败，请重试', 2000);
    } finally {
        // 恢复按钮状态
        downloadButton.innerHTML = originalHTML;
        downloadButton.classList.remove('loading');
    }
}

// 添加html2canvas库
function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        // 检查是否已加载
        if (window.html2canvas) {
            resolve();
            return;
        }
        
        // 加载脚本
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('无法加载html2canvas库'));
        document.head.appendChild(script);
    });
}

// 导出为全局函数
window.showNotification = showNotification;