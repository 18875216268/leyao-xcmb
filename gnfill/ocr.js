/**
 * ocr.js - OCR图像识别功能模块
 * 负责图片文字识别和价格提取功能
 * 新增：静默识别功能，支持水印功能集成
 */

// 创建一个全局命名空间用于OCR功能
window.OCRModule = (function() {
    // 私有变量
    let tesseractLoaded = false;
    let ocrProcessing = false; // 新增：标记OCR是否正在处理中
    
    /**
     * 加载Tesseract.js库
     * @returns {Promise} 加载完成的Promise
     */
    function loadTesseractLibrary() {
        // 如果已加载，直接返回成功Promise
        if (window.Tesseract || tesseractLoaded) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@2.1.1/dist/tesseract.min.js';
            script.onload = function() {
                tesseractLoaded = true;
                resolve();
            };
            script.onerror = function() {
                reject(new Error('无法加载Tesseract.js库'));
            };
            document.head.appendChild(script);
        });
    }
    
    /**
     * 预处理图片以优化OCR识别
     * @param {string} imageDataUrl - 图片的Data URL
     * @returns {Promise<string>} 处理后图片的Data URL
     */
    function preprocessImage(imageDataUrl) {
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
    }
    
    /**
     * 从图片中识别文字
     * @param {string} imageDataUrl - 图片的Data URL
     * @returns {Promise<string>} 识别出的文字
     */
    async function recognizeText(imageDataUrl) {
            // 加载Tesseract库
            await loadTesseractLibrary();
            
            // 预处理图片 - 只处理底部1/3区域
            const processedImage = await preprocessImage(imageDataUrl);
            
            // 使用Tesseract识别文字
            const result = await Tesseract.recognize(
                processedImage,
                'chi_sim+eng', // 中文简体和英文
                { 
                    logger: m => console.log(m)
                }
            );
            
            // 提取识别的文字
            const recognizedText = result.data.text;

            
            return recognizedText;
    }
    
    /**
     * 从图片中识别价格
     * @param {string} imageDataUrl - 图片的Data URL
     * @returns {Promise<string|null>} 识别出的价格，如果没有找到则返回null
     */
    async function recognizePrice(imageDataUrl) {
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
                return price;
            } else {
                // 没有找到价格
                if (typeof showNotification === 'function') {
                    
                }
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
            // 加载Tesseract库
            await loadTesseractLibrary();
            
            // 预处理图片 - 只处理底部1/3区域
            const processedImage = await preprocessImage(imageDataUrl);
            
            // 使用Tesseract识别文字 - 不显示通知
            const result = await Tesseract.recognize(
                processedImage,
                'chi_sim+eng', // 中文简体和英文
                { 
                    logger: m => console.log(m)
                }
            );
            
            // 提取识别的文字
            const recognizedText = result.data.text;
            console.log('识别到的文字:', recognizedText);
            
            // 使用正则表达式匹配价格
            const priceRegex = /(?:折后约￥|折后价￥|￥|折后价#|折后约#|#|折 后 约 #)([0-9]+(?:\.[0-9]+)?)/;
            const match = recognizedText.match(priceRegex);
            
            if (match && match[1]) {
                return match[1];
            } else {
                return null;
            }
        } catch (error) {
            // 静默处理错误，仅记录日志
            console.error('价格识别失败:', error);
            return null;
        }
    }
    
    /**
     * 新增：批量识别所有产品图片并更新水印
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
        
        // 获取所有产品图片容器
        const productImages = document.querySelectorAll('.product-image');
        
        // 过滤出已有图片的容器
        const containersWithImages = Array.from(productImages).filter(container => {
            const img = container.querySelector('img');
            return img && img.style.display !== 'none' && !img.src.includes('/api/placeholder/');
        });
        
        // 检查是否有图片可识别
        if (containersWithImages.length === 0) {
            if (typeof showNotification === 'function') {
                showNotification('未找到识别图片！', 2000);
            } else {
                alert('未找到识别图片！');
            }
            ocrProcessing = false;
            updateOCRButtonState(false);
            return;
        }
        
        // 遍历每个有图片的容器进行识别
        for (let i = 0; i < containersWithImages.length; i++) {
            const container = containersWithImages[i];
            
            // 锁定当前容器，防止用户操作
            lockContainer(container);
            
            // 获取容器中的图片和水印元素
            const img = container.querySelector('img');
            const watermarkInput = container.querySelector('.watermark-input');
            
            if (!img || !watermarkInput) {
                unlockContainer(container);
                continue; // 跳过无效的容器
            }
            
            // 保存水印索引用于之后更新
            const dataIndex = watermarkInput.getAttribute('data-index');
            
            // 显示正在识别状态
            watermarkInput.value = "正在识别......";
            if (typeof adjustWatermarkWidth === 'function') {
                adjustWatermarkWidth(watermarkInput);
            }
            
            try {
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
                    
                    // 显示成功通知
                    if (typeof showNotification === 'function') {
                        showNotification(`识别成功: ￥${price}`, 1000);
                    }
                } else {
                    // 识别失败
                    watermarkInput.value = "识别失败";
                    
                    // 保存到水印文本对象
                    if (dataIndex && typeof watermarkTexts !== 'undefined') {
                        watermarkTexts[dataIndex] = "识别失败";
                    }
                    
                    if (typeof showNotification === 'function') {
                        showNotification('未能识别价格', 1000);
                    }
                }
                
                // 调整水印宽度
                if (typeof adjustWatermarkWidth === 'function') {
                    adjustWatermarkWidth(watermarkInput);
                }
                
            } catch (error) {
                console.error('OCR识别过程发生错误:', error);
                watermarkInput.value = "识别失败";
                
                // 保存到水印文本对象
                if (dataIndex && typeof watermarkTexts !== 'undefined') {
                    watermarkTexts[dataIndex] = "识别失败";
                }
                
                if (typeof adjustWatermarkWidth === 'function') {
                    adjustWatermarkWidth(watermarkInput);
                }
            } finally {
                // 解锁容器
                unlockContainer(container);
                
                // 短暂延迟后继续下一个识别，提高用户体验
                if (i < containersWithImages.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
        }
        
        // 恢复非处理中状态
        ocrProcessing = false;
        updateOCRButtonState(false);
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
        loadLibrary: loadTesseractLibrary,
        recognizeText: recognizeText,
        recognizePrice: recognizePrice,
        recognizePriceSilently: recognizePriceSilently,
        recognizeAllProductImages: recognizeAllProductImages,
        lockContainer: lockContainer,
        unlockContainer: unlockContainer
    };
})();

// 文档加载完成后自动加载Tesseract库
document.addEventListener('DOMContentLoaded', function() {
    // 延迟加载，避免与其他重要资源竞争
    setTimeout(function() {
        // 预加载Tesseract库
        window.OCRModule.loadLibrary().catch(error => {
            console.warn('预加载Tesseract库失败:', error);
        });
    }, 3000);
});
