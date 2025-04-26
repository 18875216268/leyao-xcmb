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
    
    // 新增: 应用图片显示模式
    if (typeof applyImageDisplayMode === 'function') {
        applyImageDisplayMode();
    }
    
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
    
    // 11. 初始化展开/折叠按钮
    initToggleButton();

    // 12. 初始化重置设置按钮
    initResetSettingsButton();
    
    // 13. 初始化OCR识别按钮
    initOCRButton();

    // 添加键盘删除监听
    if (typeof setupKeyboardDeleteListener === 'function') {
        setupKeyboardDeleteListener();
    }
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
    
    // 设置外部背景色 (保留此功能以确保兼容性)
    document.body.style.backgroundColor = exteriorBgColor;
}

// 设置自动应用监听器
function setupAutoApplyListeners() {
    // 主布局设置自动应用
    document.getElementById('container-width').addEventListener('input', applyContainerSettings);
    document.getElementById('interior-background').addEventListener('input', applyGlobalSettings);
    document.getElementById('product-count').addEventListener('input', applyProductSettings);
    document.getElementById('product-gap').addEventListener('input', applyProductSettings);
    document.getElementById('product-columns').addEventListener('change', applyProductSettings);
    document.getElementById('exterior-background').addEventListener('input', applyGlobalSettings);

    // 顶部宣传图设置自动应用
    document.getElementById('header-height').addEventListener('input', applyContainerSettings);
    if(document.getElementById('header-display')) {
        document.getElementById('header-display').addEventListener('change', applyImageDisplayMode);
    }

    // 底部标签图设置自动应用
    document.getElementById('footer-height').addEventListener('input', applyContainerSettings);
    if(document.getElementById('footer-display')) {
        document.getElementById('footer-display').addEventListener('change', applyImageDisplayMode);
    }

    // 商品陈列图设置自动应用
    if(document.getElementById('product-display')) {
        document.getElementById('product-display').addEventListener('change', applyImageDisplayMode);
    }
    if(document.getElementById('product-width')) {
        document.getElementById('product-width').addEventListener('input', function() {
            // 修改为重新初始化产品网格
            reinitProductGrid();
        });
    }
    if(document.getElementById('product-height')) {
        document.getElementById('product-height').addEventListener('input', function() {
            // 修改为重新初始化产品网格
            reinitProductGrid();
        });
    }
    
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

/**
 * 加载图片并处理可能的错误 - 修改后的版本
 * 
 * @param {string} imgPath - 默认图片路径
 * @param {string} targetId - 目标图片元素ID
 * @param {string} imageName - 图片名称描述
 * @param {boolean} addToHistory - 是否添加到历史记录，默认为false
 */
function loadImageWithFallback(imgPath, targetId, imageName, addToHistory = false) {
    const img = document.getElementById(targetId);
    if (!img) return;

    // 检查图片是否已经有内容
    // 修改判断，不再特别检查占位图
    if (img.src && img.src !== '' && img.style.display !== 'none') {
        // 图片已经有内容，不需要加载默认图片
        return;
    }
    
    // 创建临时图片对象来检查图片是否存在
    const tempImg = new Image();
    tempImg.onload = function() {
        // 图片存在，应用它
        img.src = imgPath;
        img.style.display = 'block';
        
        // 应用当前设置的显示模式
        let displayMode = 'stretch'; // 默认显示模式
        if (targetId === 'header-img') {
            displayMode = document.getElementById('header-display').value;
        } else if (targetId === 'footer-img') {
            displayMode = document.getElementById('footer-display').value;
        }
        
        // 应用显示模式
        if (typeof applyDisplayMode === 'function') {
            applyDisplayMode(targetId, displayMode);
        }
        
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
        
        // 仅当addToHistory为true时才保存到历史记录
        if (addToHistory && typeof addImageToStorage === 'function') {
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
    downloadButton.className = 'fixed-action-button fixed-download-button';
    
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
    
    return downloadButton;
}

// 初始化OCR按钮
function initOCRButton() {
    // 创建OCR按钮
    const ocrButton = document.createElement('div');
    ocrButton.className = 'fixed-action-button fixed-ocr-button';
    
    // 检查历史面板状态，设置初始位置类
    const historyPanel = document.querySelector('.history-panel');
    if (historyPanel && !historyPanel.classList.contains('collapsed')) {
        ocrButton.classList.add('with-panel');
    }
    
    // 添加图标
    ocrButton.innerHTML = `<img src="img/识别.png" alt="OCR识别">`;
    
    // 添加点击事件 - 调用OCR模块的识别函数
    ocrButton.addEventListener('click', function() {
        if (typeof window.OCRModule !== 'undefined' && typeof window.OCRModule.recognizeAllProductImages === 'function') {
            window.OCRModule.recognizeAllProductImages();
        } else {
            console.error('OCR模块未加载或识别函数不可用');
            if (typeof showNotification === 'function') {
                showNotification('OCR识别功能暂不可用', 2000);
            }
        }
    });
    
    // 添加到页面
    document.body.appendChild(ocrButton);
    
    // 监听历史面板状态变化
    document.addEventListener('historyPanelToggled', function(event) {
        const isCollapsed = event.detail.collapsed;
        
        if (isCollapsed) {
            ocrButton.classList.remove('with-panel');
        } else {
            ocrButton.classList.add('with-panel');
        }
    });
    
    console.log('OCR按钮已创建:', ocrButton); // 添加调试日志
    
    return ocrButton;
}

// 初始化展开/折叠按钮
// 初始化展开/折叠按钮
function initToggleButton() {
    // 创建展开/折叠按钮
    const toggleButton = document.createElement('div');
    toggleButton.className = 'fixed-action-button fixed-toggle-button';
    
    // 检查历史面板状态，设置初始位置类和图标
    const historyPanel = document.querySelector('.history-panel');
    const isCollapsed = true;
    
    // 确保按钮位置正确 - 折叠状态下不添加with-panel类
    if (historyPanel && !isCollapsed) {
        toggleButton.classList.add('with-panel');
    }
    
    // 添加初始图标
    updateToggleButtonIcon(toggleButton, isCollapsed);
    
// 添加点击事件
toggleButton.addEventListener('click', function() {
    toggleHistoryPanel(this);
});

// 添加到页面
document.body.appendChild(toggleButton);

// 监听原有折叠按钮的事件
document.addEventListener('historyPanelToggled', function(event) {
    const isCollapsed = event.detail.collapsed;
    updateToggleButtonIcon(toggleButton, isCollapsed);
    
    if (isCollapsed) {
        toggleButton.classList.remove('with-panel');
        document.querySelector('.fixed-download-button').classList.remove('with-panel');
        
        // 同时更新OCR按钮
        const ocrButton = document.querySelector('.fixed-ocr-button');
        if (ocrButton) {
            ocrButton.classList.remove('with-panel');
        }
    } else {
        toggleButton.classList.add('with-panel');
        document.querySelector('.fixed-download-button').classList.add('with-panel');
        
        // 同时更新OCR按钮
        const ocrButton = document.querySelector('.fixed-ocr-button');
        if (ocrButton) {
            ocrButton.classList.add('with-panel');
        }
    }
});

return toggleButton;
}

// 更新展开/折叠按钮图标
function updateToggleButtonIcon(button, isCollapsed) {
if (!button) return;

button.innerHTML = isCollapsed ? 
    `<img src="img/展开.png" alt="展开历史面板">` : 
    `<img src="img/折叠.png" alt="折叠历史面板">`;
}

// 切换历史面板状态
function toggleHistoryPanel(button) {
const historyPanel = document.querySelector('.history-panel');
const previewContainer = document.querySelector('.preview-container');
const downloadButton = document.querySelector('.fixed-download-button');
const ocrButton = document.querySelector('.fixed-ocr-button'); // 新增OCR按钮引用

if (!historyPanel || !previewContainer) return;

const isCollapsed = !historyPanel.classList.contains('collapsed');

if (isCollapsed) {
    // 收起面板
    historyPanel.classList.add('collapsed');
    previewContainer.classList.remove('history-expanded');
    previewContainer.classList.add('history-collapsed');
    
    // 更新按钮样式
    if (downloadButton) {
        downloadButton.classList.remove('with-panel');
    }
    if (ocrButton) { // 新增OCR按钮处理
        ocrButton.classList.remove('with-panel');
    }
    button.classList.remove('with-panel');
} else {
    // 展开面板
    historyPanel.classList.remove('collapsed');
    previewContainer.classList.add('history-expanded');
    previewContainer.classList.remove('history-collapsed');
    
    // 不需要手动设置margin-right，因为.history-expanded类会自动应用CSS变量
    
    // 更新按钮样式
    if (downloadButton) {
        downloadButton.classList.add('with-panel');
    }
    if (ocrButton) { // 新增OCR按钮处理
        ocrButton.classList.add('with-panel');
    }
    button.classList.add('with-panel');
    
    // 触发扩展面板事件
    const event = new CustomEvent('expandHistoryPanel');
    document.dispatchEvent(event);
}

// 更新图标
updateToggleButtonIcon(button, isCollapsed);
}

// 监听历史面板状态变化
function listenToHistoryPanelChanges(downloadButton) {
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

/**
* 用户信息面板功能代码
* 可以添加到zhu.js末尾
*/

// 初始化用户信息面板
function initUserPanel() {
// 获取用户信息元素
const userGreeting = document.getElementById('userGreeting');
const logoutBtn = document.getElementById('logoutBtn');

if (!userGreeting || !logoutBtn) {
    console.error('未找到用户信息面板元素');
    return;
}

// 检查登录信息 - 从localStorage获取
const userInfoStr = localStorage.getItem('userInfo');
if (!userInfoStr) {
    console.error('未找到登录信息');
    userGreeting.textContent = '您好，访客';
    return;
}

try {
    // 解析用户信息
    const userInfo = JSON.parse(userInfoStr);
    
    // 显示用户名
    if (userInfo && userInfo.username) {
        userGreeting.textContent = `您好，${userInfo.username}`;
    } else {
        userGreeting.textContent = '您好，用户';
    }
    
    // 设置退出登录按钮功能
    logoutBtn.addEventListener('click', function() {
        // 清除localStorage中的登录信息
        localStorage.removeItem('userInfo');
        
        // 显示退出提示
        if (typeof showNotification === 'function') {
            showNotification('已退出登录，即将跳转到登录页面...', 2000);
        }
        
        // 延迟跳转到登录页，给用户一些时间看到提示
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1500);
    });
} catch (error) {
    console.error('解析用户信息失败:', error);
    userGreeting.textContent = '您好，用户';
}
}

// 在页面加载完成后初始化用户面板
document.addEventListener('DOMContentLoaded', function() {
// 添加到现有的DOMContentLoaded事件处理中
// 或者作为单独的监听器运行
setTimeout(initUserPanel, 100); // 略微延迟确保DOM已完全加载
});

/**
* 重置布局设置功能
* 将所有设置重置为默认值
*/
function initResetSettingsButton() {
// 获取重置按钮
const resetButton = document.getElementById('resetSettingsBtn');

if (!resetButton) {
    console.error('未找到重置按钮元素');
    return;
}

// 添加点击事件监听
resetButton.addEventListener('click', function() {
    resetLayoutSettings();
});
}

// 重置布局设置为默认值
function resetLayoutSettings() {
// 定义默认设置值
const defaultSettings = {
    'container-width': 900,        // 容器宽度：900px
    'header-height': 380,          // 顶部图片高度：380px
    'footer-height': 155,          // 底部图片高度：155px
    'exterior-background': '#D6D6D6', // 外部背景色：浅灰色
    'interior-background': '#3F56DC', // 内部背景色：蓝色
    'product-count': 8,            // 产品数量：8个
    'product-gap': 20,             // 产品间距：20px
    'product-columns': 3,          // 产品列数：3列
    'product-width': 645,          // 产品宽度：645px
    'product-height': 980,         // 产品高度：980px
    'header-display': 'stretch',      // 顶部图片显示模式：拉伸
    'footer-display': 'stretch',      // 底部图片显示模式：拉伸
    'product-display': 'stretch'  // 产品图片显示模式：拉伸
};

// 遍历并应用默认设置
for (const [id, value] of Object.entries(defaultSettings)) {
    const element = document.getElementById(id);
    if (element) {
        if (element.type === 'color') {
            element.value = value;
        } else if (element.tagName === 'SELECT') {
            for (let i = 0; i < element.options.length; i++) {
                if (element.options[i].value === value) {
                    element.selectedIndex = i;
                    break;
                }
            }
        } else {
            element.value = value;
        }
    }
}

// 应用更改到UI
applyContainerSettings();
applyProductSettings();
applyGlobalSettings();

// 如果存在图片显示模式函数，则应用它
if (typeof applyImageDisplayMode === 'function') {
    applyImageDisplayMode();
}

// 应用水印设置
setTimeout(applyWatermarkSettings, 100);
}

// 页面加载完成后初始化重置按钮
document.addEventListener('DOMContentLoaded', function() {
// 添加到现有的DOMContentLoaded事件处理中
setTimeout(initResetSettingsButton, 300); // 略微延迟确保DOM已完全加载
});

// 初始化二维码功能
// 初始化二维码功能
function initQRCodeFeature() {
    // 创建二维码方块
    const qrCodeBlock = document.createElement('div');
    qrCodeBlock.className = 'qr-code-block';
    qrCodeBlock.title = '上传二维码图片';
    
    // 创建QR码图片元素
    const qrCodeImg = document.createElement('img');
    qrCodeImg.id = 'qr-code-img';
    qrCodeImg.style.display = 'none';
    qrCodeImg.style.width = '100%';
    qrCodeImg.style.height = '100%';
    qrCodeImg.style.objectFit = 'fill'; // 固定拉伸
    qrCodeBlock.appendChild(qrCodeImg);
    
    // 创建上传按钮
    const uploadIcon = document.createElement('div');
    uploadIcon.className = 'qr-upload-icon';
    uploadIcon.innerHTML = '+';
    qrCodeBlock.appendChild(uploadIcon);
    
    // 创建文件输入框
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.id = 'qr-file-input';
    qrCodeBlock.appendChild(fileInput);
    
    // 创建删除按钮
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'qr-delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.style.display = 'none';
    qrCodeBlock.appendChild(deleteBtn);
    
    // 修改为双击事件触发上传
    qrCodeBlock.addEventListener('dblclick', function(e) {
        // 阻止事件冒泡，避免触发其他事件
        e.stopPropagation();
        // 如果不是点击删除按钮，则触发文件选择
        if (e.target !== deleteBtn) {
            fileInput.click();
        }
    });
    
    // 添加文件选择事件
    fileInput.addEventListener('change', handleQRCodeUpload);
    
    // 添加删除按钮事件
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteQRCode();
    });
    
    // 将二维码方块添加到容器
    const footerWrapper = document.querySelector('.footer-wrapper');
    if (footerWrapper) {
        footerWrapper.appendChild(qrCodeBlock);
        
        // 设置初始尺寸
        updateQRCodeSize();
    }
    
    // 监听底部高度变化
    const footerHeightInput = document.getElementById('footer-height');
    if (footerHeightInput) {
        footerHeightInput.addEventListener('input', updateQRCodeSize);
    }
}

// 更新二维码尺寸
// 更新二维码尺寸和位置 - 修复垂直居中问题
function updateQRCodeSize() {
    const footerHeight = parseInt(document.getElementById('footer-height').value) || 155;
    const qrCodeBlock = document.querySelector('.qr-code-block');
    
    if (qrCodeBlock) {
        const size = Math.floor(footerHeight * 3/4); // 设置为底部高度的3/4
        const margin = Math.floor(footerHeight * 1/4); // 设置边距为底部高度的1/4
        
        qrCodeBlock.style.width = size + 'px';
        qrCodeBlock.style.height = size + 'px';
        qrCodeBlock.style.right = margin + 'px';
        
        // 修改: 从底部边距调整为垂直居中
        // 计算垂直居中的位置 = (底部高度 - 二维码高度) / 2
        const verticalCenter = Math.floor((footerHeight - size) / 2);
        qrCodeBlock.style.bottom = verticalCenter + 'px';
    }
}

// 处理二维码上传
function handleQRCodeUpload(event) {
    const input = event.target;
    const files = input.files;
    
    // 如果没有文件被选择，直接返回
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const qrCodeImg = document.getElementById('qr-code-img');
        const uploadIcon = document.querySelector('.qr-upload-icon');
        const deleteBtn = document.querySelector('.qr-delete-btn');
        const qrCodeBlock = document.querySelector('.qr-code-block');
        
        if (qrCodeImg && uploadIcon && deleteBtn) {
            qrCodeImg.src = e.target.result;
            qrCodeImg.style.display = 'block';
            uploadIcon.style.display = 'none';
            deleteBtn.style.display = 'block';
            
            // 保存到本地存储
            localStorage.setItem('qrCodeImage', e.target.result);
            
            // 重要：清除选中状态，确保不会持续显示蒙版
            if (qrCodeBlock && qrCodeBlock.classList.contains('selected')) {
                qrCodeBlock.classList.remove('selected');
            }
            
            // 显示通知
            if (typeof showNotification === 'function') {
                showNotification('二维码已更新');
            }
        }
    };
    
    reader.readAsDataURL(file);
    
    // 重要：清空文件输入，确保下次可以再次选择同一个文件
    input.value = '';
}

// 删除二维码
function deleteQRCode() {
    const qrCodeImg = document.getElementById('qr-code-img');
    const uploadIcon = document.querySelector('.qr-upload-icon');
    const deleteBtn = document.querySelector('.qr-delete-btn');
    const fileInput = document.getElementById('qr-file-input');
    const qrCodeBlock = document.querySelector('.qr-code-block');
    
    if (qrCodeImg && uploadIcon && deleteBtn) {
        qrCodeImg.src = '';
        qrCodeImg.style.display = 'none';
        uploadIcon.style.display = 'block';
        deleteBtn.style.display = 'none';
        
        // 从本地存储中删除
        localStorage.removeItem('qrCodeImage');
        
        // 重要：清空文件输入，确保下次可以再次选择同一个文件
        if (fileInput) {
            fileInput.value = '';
        }
        
        // 重要：移除选中状态，确保蒙版不会持续显示
        if (qrCodeBlock && qrCodeBlock.classList.contains('selected')) {
            qrCodeBlock.classList.remove('selected');
        }
        
        // 显示通知
        if (typeof showNotification === 'function') {
            showNotification('二维码已删除');
        }
    }
}

// 从本地存储加载二维码
function loadQRCodeFromStorage() {
    const qrCodeData = localStorage.getItem('qrCodeImage');
    
    if (qrCodeData) {
        const qrCodeImg = document.getElementById('qr-code-img');
        const uploadIcon = document.querySelector('.qr-upload-icon');
        const deleteBtn = document.querySelector('.qr-delete-btn');
        
        if (qrCodeImg && uploadIcon && deleteBtn) {
            qrCodeImg.src = qrCodeData;
            qrCodeImg.style.display = 'block';
            uploadIcon.style.display = 'none';
            deleteBtn.style.display = 'block';
        }
    }
}

// 在页面加载完成后初始化二维码功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化二维码功能
    setTimeout(function() {
        initQRCodeFeature();
        loadQRCodeFromStorage();
    }, 300);
});

// 导出为全局函数
window.showNotification = showNotification;