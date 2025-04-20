/**
 * ocr.js - OCR图像识别功能模块
 * 负责图片文字识别和价格提取功能
 * 新增：静默识别功能，支持水印功能集成
 */

// 创建一个全局命名空间用于OCR功能
window.OCRModule = (function() {
    // 私有变量
    let tesseractLoaded = false;
    
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
    
    // 导出公共API
    return {
        loadLibrary: loadTesseractLibrary,
        recognizeText: recognizeText,
        recognizePrice: recognizePrice,
        recognizePriceSilently: recognizePriceSilently
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