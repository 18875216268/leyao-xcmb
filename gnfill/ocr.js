/**
 * ocr.js - OCR图像识别功能模块 (更新版)
 * 负责图片文字识别和价格提取功能
 * 新增：整合离线OCR功能，在线识别失败时自动切换到离线识别
 */

// 创建一个全局命名空间用于OCR功能
window.OCRModule = (function() {
    // 私有变量
    let ocrProcessing = false; // 标记OCR是否正在处理中
    const OCR_API_URL = "https://ocr-proxy.389584091.workers.dev/"; // 在线OCR API地址
    
    // OCR状态跟踪
    const ocrStatus = {
        offlineReady: false,
        onlineFailCount: 0,
        totalRecognized: 0
    };
    
    /**
     * 检查离线OCR是否可用
     * @returns {boolean} 离线OCR是否可用
     */
    function isOfflineOCRAvailable() {
        return window.OfflineOCR && 
               typeof window.OfflineOCR.isModelLoaded === 'function' && 
               window.OfflineOCR.isModelLoaded();
    }
    
    /**
     * 尝试初始化离线OCR
     * 静默加载，不会打扰用户，用作备用
     */
    function initOfflineOCR() {
        if (window.OfflineOCR && typeof window.OfflineOCR.init === 'function') {
            window.OfflineOCR.init()
                .then(() => {
                    ocrStatus.offlineReady = true;
                    console.log('离线OCR备用模式已加载');
                })
                .catch(err => {
                    console.warn('离线OCR加载失败，将在需要时重试', err);
                });
        }
    }
    
    /**
     * 预处理图片以优化OCR识别
     * @param {string} imageDataUrl - 图片的Data URL
     * @returns {Promise<string>} 处理后图片的Data URL
     */
    async function preprocessImage(imageDataUrl) {
        try {
            // 如果离线OCR可用，使用它的预处理函数可能效果更好
            if (isOfflineOCRAvailable() && 
                typeof window.OfflineOCR.preprocessImage === 'function') {
                return await window.OfflineOCR.preprocessImage(imageDataUrl);
            }
            
            // 否则使用标准预处理
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = function() {
                    // 创建canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 只保留底部1/3区域，价格通常在底部
                    const originalWidth = img.width;
                    const originalHeight = img.height;
                    const cropHeight = Math.floor(originalHeight / 3);
                    const cropY = originalHeight - cropHeight;
                    
                    // 设置canvas尺寸
                    canvas.width = originalWidth;
                    canvas.height = cropHeight;
                    
                    // 绘制裁剪区域
                    ctx.drawImage(img, 0, cropY, originalWidth, cropHeight, 0, 0, originalWidth, cropHeight);
                    
                    // 返回处理后的图片
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };
                
                img.onerror = function() {
                    reject(new Error('图片加载失败'));
                };
                
                img.src = imageDataUrl;
            });
        } catch (error) {
            console.error('图像预处理失败:', error);
            // 预处理失败时返回原图
            return imageDataUrl;
        }
    }
    
    /**
     * 从图片中识别文字，使用在线OCR，失败时回退到离线OCR
     * @param {string} imageDataUrl - 图片的Data URL
     * @returns {Promise<string>} 识别出的文字
     */
    async function recognizeText(imageDataUrl) {
        // 始终优先尝试在线OCR
        try {
            // 使用在线OCR
            const onlineResult = await recognizeTextOnline(imageDataUrl);
            ocrStatus.onlineFailCount = 0;
            return onlineResult;
        } catch (error) {
            console.warn('在线OCR识别失败，尝试离线OCR', error);
            ocrStatus.onlineFailCount++;
            
            // 只有在离线OCR可用或需要加载时尝试
            if (window.OfflineOCR) {
                try {
                    // 如果模型未加载，先加载
                    if (!isOfflineOCRAvailable()) {
                        if (typeof showNotification === 'function') {
                            showNotification('加载离线OCR引擎...', 1500);
                        }
                        await window.OfflineOCR.init();
                    }
                    
                    // 使用离线OCR作为备选方案
                    const offlineResult = await window.OfflineOCR.recognizeText(imageDataUrl);
                    ocrStatus.offlineReady = true;
                    return offlineResult;
                } catch (offlineError) {
                    console.error('离线OCR也失败:', offlineError);
                    throw new Error('OCR识别失败');
                }
            } else {
                // 离线OCR不可用，直接抛出原始错误
                throw error;
            }
        }
    }
    
    /**
     * 使用在线API识别文字
     * @param {string} imageDataUrl - 图片的Data URL
     * @returns {Promise<string>} 识别出的文字
     */
    async function recognizeTextOnline(imageDataUrl) {
        try {
            // 预处理图片
            const processedImage = await preprocessImage(imageDataUrl);
            
            // 从Data URL中提取Base64数据
            const base64Data = processedImage.split(',')[1];
            
            // 调用OCR API
            const response = await fetch(OCR_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: base64Data
                })
            });
            
            if (!response.ok) {
                throw new Error(`OCR API 响应错误: ${response.status}`);
            }
            
            // 获取返回结果
            const responseText = await response.text();
            return responseText;
        } catch (error) {
            console.error('在线文字识别失败:', error);
            throw error;
        }
    }
    
    /**
     * 从图片中识别价格
     * @param {string} imageDataUrl - 图片的Data URL
     * @returns {Promise<string|null>} 识别出的价格，如果没有找到则返回null
     */
    async function recognizePrice(imageDataUrl) {
        try {
            // 识别图片中的所有文字
            const recognizedText = await recognizeText(imageDataUrl);
            console.log('识别到的文字:', recognizedText);
            
            // 使用正则表达式匹配"折后约￥"或"折后价￥"或"￥"后的价格
            const priceRegex = /(?:折后约￥|折后价￥|￥|折后价#|折后约#|#|折 后 约 #)([0-9]+(?:\.[0-9]+)?)/;
            const match = recognizedText.match(priceRegex);
            
            if (match && match[1]) {
                // 找到价格
                const price = match[1];
                if (typeof showNotification === 'function') {
                    showNotification(`成功识别价格: ￥${price}`, 2000);
                }
                ocrStatus.totalRecognized++;
                return price;
            } else {
                // 尝试匹配单独的数字（可能没有前缀符号）
                const simpleNumberRegex = /([0-9]{2,3}(?:\.[0-9]{1,2})?)/g;
                const numbers = [];
                let m;
                
                // 收集所有数字
                while ((m = simpleNumberRegex.exec(recognizedText)) !== null) {
                    numbers.push(m[1]);
                }
                
                // 过滤可能是价格的数字
                const possiblePrices = numbers.filter(num => {
                    const value = parseFloat(num);
                    return value >= 10 && value <= 9999;
                });
                
                if (possiblePrices.length > 0) {
                    // 找到可能的价格
                    const price = possiblePrices[0];
                    if (typeof showNotification === 'function') {
                        showNotification(`识别到可能的价格: ￥${price}`, 2000);
                    }
                    ocrStatus.totalRecognized++;
                    return price;
                }
                
                // 没有找到价格
                if (typeof showNotification === 'function') {
                    showNotification('未能识别出价格信息', 2000);
                }
                return null;
            }
        } catch (error) {
            console.error('价格识别失败:', error);
            return null;
        }
    }
    
    /**
     * 从图片中静默识别价格，无通知
     * 此函数专为水印自动填充设计
     * @param {string} imageDataUrl - 图片的Data URL
     * @returns {Promise<string|null>} 识别出的价格，如果没有找到则返回null
     */
    async function recognizePriceSilently(imageDataUrl) {
        try {
            // 识别图片中的所有文字，不显示通知
            const recognizedText = await recognizeText(imageDataUrl);
            
            // 使用正则表达式匹配价格
            const priceRegex = /(?:折后约￥|折后价￥|￥|折后价#|折后约#|#|折 后 约 #)([0-9]+(?:\.[0-9]+)?)/;
            const match = recognizedText.match(priceRegex);
            
            if (match && match[1]) {
                ocrStatus.totalRecognized++;
                return match[1];
            } else {
                // 尝试匹配单独的数字
                const simpleNumberRegex = /([0-9]{2,3}(?:\.[0-9]{1,2})?)/g;
                const numbers = [];
                let m;
                
                while ((m = simpleNumberRegex.exec(recognizedText)) !== null) {
                    numbers.push(m[1]);
                }
                
                const possiblePrices = numbers.filter(num => {
                    const value = parseFloat(num);
                    return value >= 10 && value <= 9999;
                });
                
                if (possiblePrices.length > 0) {
                    ocrStatus.totalRecognized++;
                    return possiblePrices[0];
                }
                
                return null;
            }
        } catch (error) {
            console.error('静默价格识别失败:', error);
            return null;
        }
    }
    
    /**
     * 新增：批量识别选中或所有产品图片并更新水印
     * 优先识别选中的图片，如果没有选中任何图片，则识别所有图片
     */
    async function recognizeAllProductImages() {
        // 防止多次点击触发
        if (ocrProcessing) {
            if (typeof showNotification === 'function') {
                showNotification('正在进行识别，请稍候...', 2000);
            }
            return;
        }
        
        // 设置处理中状态
        ocrProcessing = true;
        updateOCRButtonState(true);
        
        try {
            // 首先检查是否有选中的图片区域
            const selectedContainers = document.querySelectorAll('.product-image.selected');
            let containersToProcess = [];
            
            if (selectedContainers.length > 0) {
                // 如果有选中的图片区域，只处理这些区域
                containersToProcess = Array.from(selectedContainers).filter(container => {
                    const img = container.querySelector('img');
                    return img && img.style.display !== 'none' && !img.src.includes('/api/placeholder/');
                });
                
                if (containersToProcess.length === 0) {
                    // 选中的区域没有有效图片
                    if (typeof showNotification === 'function') {
                        showNotification('选中的区域没有有效图片！', 2000);
                    }
                    ocrProcessing = false;
                    updateOCRButtonState(false);
                    return;
                }
                
                // 显示通知，告知用户正在识别选中图片
                if (typeof showNotification === 'function') {
                    showNotification(`正在识别 ${containersToProcess.length} 张选中图片...`, 2000);
                }
            } else {
                // 如果没有选中的图片区域，处理所有图片
                const allProductImages = document.querySelectorAll('.product-image');
                containersToProcess = Array.from(allProductImages).filter(container => {
                    const img = container.querySelector('img');
                    return img && img.style.display !== 'none' && !img.src.includes('/api/placeholder/');
                });
                
                // 检查是否有图片可识别
                if (containersToProcess.length === 0) {
                    if (typeof showNotification === 'function') {
                        showNotification('未找到可识别的图片！', 2000);
                    }
                    ocrProcessing = false;
                    updateOCRButtonState(false);
                    return;
                }
                
                // 显示通知，告知用户正在识别所有图片
                if (typeof showNotification === 'function') {
                    showNotification(`正在识别全部 ${containersToProcess.length} 张图片...`, 2000);
                }
            }
            
            // 设置并发处理数量
            const MAX_CONCURRENT = 4;
            let completedCount = 0;
            
            // 将待处理容器分组，每组最多MAX_CONCURRENT个
            for (let i = 0; i < containersToProcess.length; i += MAX_CONCURRENT) {
                // 获取当前批次要处理的容器
                const batch = containersToProcess.slice(i, i + MAX_CONCURRENT);
                
                // 锁定当前批次的所有容器
                batch.forEach(container => lockContainer(container));
                
                // 创建当前批次的所有识别任务
                const batchTasks = batch.map(container => processContainer(container));
                
                // 并发执行当前批次的所有任务
                await Promise.all(batchTasks);
                
                // 更新完成计数
                completedCount += batch.length;
                
                // 如果还有更多图片要处理，显示进度通知
                if (completedCount < containersToProcess.length && containersToProcess.length > MAX_CONCURRENT) {
                    if (typeof showNotification === 'function') {
                        showNotification(`已完成 ${completedCount}/${containersToProcess.length} 张图片识别`, 1000);
                    }
                }
            }
            
            // 处理完成后显示总结通知
            if (typeof showNotification === 'function') {
                showNotification(`已完成 ${containersToProcess.length} 张图片的识别`, 2000);
            }
        } catch (error) {
            console.error('OCR批量识别出错:', error);
            if (typeof showNotification === 'function') {
                showNotification('识别过程中发生错误', 2000);
            }
        } finally {
            // 恢复非处理中状态
            ocrProcessing = false;
            updateOCRButtonState(false);
        }
    }
    
    /**
     * 处理单个容器的图片识别
     * @param {HTMLElement} container - 要处理的图片容器
     * @returns {Promise} 处理完成的Promise
     */
    async function processContainer(container) {
        try {
            // 获取容器中的图片和水印元素
            const img = container.querySelector('img');
            const watermarkInput = container.querySelector('.watermark-input');
            
            if (!img || !watermarkInput) {
                return;
            }
            
            // 保存水印索引用于之后更新
            const dataIndex = watermarkInput.getAttribute('data-index');
            
            // 显示正在识别状态
            watermarkInput.value = "正在识别......";
            if (typeof adjustWatermarkWidth === 'function') {
                adjustWatermarkWidth(watermarkInput);
            }
            
            // 获取图片数据
            const imageData = img.src;
            
            // 调用OCR模块进行识别
            const price = await recognizePriceSilently(imageData);
            
            // 处理识别结果
            if (price) {
                // 识别成功，更新水印文本
                const newText = `折后价：￥${price}`;
                watermarkInput.value = newText;
                
                // 保存到水印文本对象
                if (dataIndex && typeof watermarkTexts !== 'undefined') {
                    watermarkTexts[dataIndex] = newText;
                }
            } else {
                // 识别失败
                watermarkInput.value = "识别失败";
                
                // 保存到水印文本对象
                if (dataIndex && typeof watermarkTexts !== 'undefined') {
                    watermarkTexts[dataIndex] = "识别失败";
                }
            }
            
            // 调整水印宽度
            if (typeof adjustWatermarkWidth === 'function') {
                adjustWatermarkWidth(watermarkInput);
            }
        } catch (error) {
            console.error('单张图片OCR识别过程发生错误:', error);
            
            const watermarkInput = container.querySelector('.watermark-input');
            if (watermarkInput) {
                watermarkInput.value = "识别失败";
                
                // 保存到水印文本对象
                const dataIndex = watermarkInput.getAttribute('data-index');
                if (dataIndex && typeof watermarkTexts !== 'undefined') {
                    watermarkTexts[dataIndex] = "识别失败";
                }
                
                if (typeof adjustWatermarkWidth === 'function') {
                    adjustWatermarkWidth(watermarkInput);
                }
            }
        } finally {
            // 解锁容器
            unlockContainer(container);
        }
    }
    
    /**
     * 锁定容器，防止用户操作
     * @param {HTMLElement} container - 要锁定的容器元素
     */
    function lockContainer(container) {
        container.classList.add('ocr-processing');
        container.style.pointerEvents = 'none';
        
        // 隐藏删除按钮
        const deleteBtn = container.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
    }
    
    /**
     * 解锁容器，允许用户操作
     * @param {HTMLElement} container - 要解锁的容器元素
     */
    function unlockContainer(container) {
        container.classList.remove('ocr-processing');
        container.style.pointerEvents = '';
        
        // 恢复删除按钮显示
        const img = container.querySelector('img');
        const deleteBtn = container.querySelector('.delete-btn');
        if (deleteBtn && img && img.style.display !== 'none') {
            deleteBtn.style.display = 'block';
        }
    }
    
    /**
     * 更新OCR按钮状态
     * @param {boolean} isProcessing - 是否处理中
     */
    function updateOCRButtonState(isProcessing) {
        const ocrButton = document.querySelector('.fixed-ocr-button');
        if (!ocrButton) return;
        
        if (isProcessing) {
            ocrButton.classList.add('processing');
        } else {
            ocrButton.classList.remove('processing');
        }
    }
    
    // 导出公共API
    return {
        recognizeText: recognizeText,
        recognizePrice: recognizePrice,
        recognizePriceSilently: recognizePriceSilently,
        recognizeAllProductImages: recognizeAllProductImages,
        lockContainer: lockContainer,
        unlockContainer: unlockContainer
    };
})();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟加载，避免影响页面初始化
    setTimeout(function() {
        // 检查是否有离线OCR模块，有则预加载
        if (window.OfflineOCR && typeof window.OfflineOCR.init === 'function') {
            // 静默加载离线OCR作为备用方案
            window.OfflineOCR.init().catch(err => {
                console.log('离线OCR预加载跳过，将在需要时再加载');
            });
        }
    }, 5000);
});