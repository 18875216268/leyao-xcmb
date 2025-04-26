/**
 * ocr.js - OCR图像识别功能模块
 * 负责图片文字识别和价格提取功能
 * 支持选中图片识别和批量识别功能
 */

// 创建一个全局命名空间用于OCR功能
window.OCRModule = (function() {
    // 私有变量
    let tesseractLoaded = false;
    let ocrProcessing = false; // 标记OCR是否正在处理中
    const MAX_CONCURRENT = 4; // 最大并发识别数量
    
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
 * 改进的图像预处理函数 - 将图片分为3×2网格，只处理左下角1/6部分
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
            
            // 获取原始尺寸
            const originalWidth = img.width;
            const originalHeight = img.height;
            
            // 将图片分成3×2的网格，只处理左下角1/6部分
            // 计算左下角区域的尺寸和位置
            const gridWidth = Math.floor(originalWidth / 3);   // 横向分为3份
            const gridHeight = Math.floor(originalHeight / 2); // 纵向分为2份
            
            // 左下角区域坐标
            const cropX = 0;                             // 左侧起点
            const cropY = originalHeight - gridHeight;   // 底部起点
            
            // 设置canvas尺寸为裁剪区域大小
            canvas.width = gridWidth;
            canvas.height = gridHeight;
            
            // 绘制左下角区域
            ctx.drawImage(
                img,
                cropX, cropY, gridWidth, gridHeight,  // 源图像裁剪区域(左下角1/6)
                0, 0, gridWidth, gridHeight           // 目标区域(填满canvas)
            );
            
            // 增强图像对比度以提高OCR准确性
            enhanceImageContrast(ctx, gridWidth, gridHeight);
            
            // 返回处理后的图片
            resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        
        img.onerror = function() {
            reject(new Error('图片加载失败'));
        };
        
        img.src = imageDataUrl;
    });
}

/**
 * 增强图像对比度
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 */
function enhanceImageContrast(ctx, width, height) {
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 简单的对比度增强算法
    const contrast = 1.2;  // 对比度增强系数，1.0为原始对比度
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
        // 增强RGB通道的对比度
        data[i] = factor * (data[i] - 128) + 128;       // R通道
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // G通道
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // B通道
        // Alpha通道保持不变
    }
    
    // 将处理后的图像数据放回canvas
    ctx.putImageData(imageData, 0, 0);
}
    
/**
 * 从图片中识别文字 - 使用改进的预处理函数
 * @param {string} imageDataUrl - 图片的Data URL
 * @returns {Promise<string>} 识别出的文字
 */
async function recognizeText(imageDataUrl) {
    // 加载Tesseract库
    await loadTesseractLibrary();
    
    // 使用改进的预处理函数 - 只处理左下角1/6区域(3×2网格)
    const processedImage = await preprocessImage(imageDataUrl);
    
    // 可选：添加调试代码，查看预处理后的图像
    /*
    const debugImg = document.createElement('img');
    debugImg.src = processedImage;
    debugImg.style.position = 'fixed';
    debugImg.style.top = '10px';
    debugImg.style.right = '10px';
    debugImg.style.zIndex = '9999';
    debugImg.style.border = '2px solid red';
    debugImg.style.maxWidth = '200px';
    document.body.appendChild(debugImg);
    setTimeout(() => document.body.removeChild(debugImg), 5000);
    */
    
    // 使用Tesseract识别文字
    const result = await Tesseract.recognize(
        processedImage,
        'chi_sim+eng', // 中文简体和英文
        { 
            logger: m => {
                // 只记录关键点的日志，减少控制台输出
                if (m.status === 'recognizing text' && m.progress === 1) {
                    console.log('OCR识别完成');
                }
            }
        }
    );
    
    // 提取识别的文字
    const recognizedText = result.data.text;
    return recognizedText;
}

    
/**
 * 从图片中识别价格 - 优化正则表达式以提高价格匹配率
 * @param {string} imageDataUrl - 图片的Data URL
 * @returns {Promise<string|null>} 识别出的价格，如果没有找到则返回null
 */
async function recognizePrice(imageDataUrl) {
    try {
        // 识别图片中的所有文字
        const recognizedText = await recognizeText(imageDataUrl);
        console.log('识别到的文字:', recognizedText);
        
        // 使用更复杂的正则表达式匹配价格
        // 匹配模式更全面，包括各种价格表示法
        const pricePatterns = [
            // 匹配"折后约￥"或"折后价￥"后的价格
            /(?:折后约￥|折后价￥|￥|折后价#|折后约#|#|折 后 约 #)([0-9]+(?:\.[0-9]+)?)/,
            // 匹配纯数字价格（前后可能有符号如¥, $等）
            /(?:¥|\$|€|\£|\s)([0-9]+(?:\.[0-9]+)?)/,
            // 匹配中文数字价格
            /价格?[：:]\s*([0-9]+(?:\.[0-9]+)?)/,
            // 匹配"元"前面的数字
            /([0-9]+(?:\.[0-9]+)?)\s*元/,
            // 尝试识别促销价、现价等常见价格表述
            /(?:促销价|现价|特价|优惠价|活动价)(?:[:：])?(?:\s)*([0-9]+(?:\.[0-9]+)?)/
        ];
        
        // 尝试所有匹配模式
        for (const pattern of pricePatterns) {
            const match = recognizedText.match(pattern);
            if (match && match[1]) {
                // 找到价格
                const price = match[1];
                if (typeof showNotification === 'function') {
                    showNotification(`成功识别价格: ￥${price}`, 2000);
                }
                return price;
            }
        }
        
        // 没有找到价格
        if (typeof showNotification === 'function') {
            showNotification('未能识别价格', 2000);
        }
        return null;
    } catch (error) {
        console.error('价格识别失败:', error);
        if (typeof showNotification === 'function') {
            showNotification('识别过程发生错误', 2000);
        }
        return null;
    }
}
    
/**
 * 从图片中静默识别价格，无通知 - 使用同样改进的算法
 * 此函数专为水印自动填充设计
 * @param {string} imageDataUrl - 图片的Data URL
 * @returns {Promise<string|null>} 识别出的价格，如果没有找到则返回null
 */
async function recognizePriceSilently(imageDataUrl) {
    try {
        // 加载Tesseract库
        await loadTesseractLibrary();
        
        // 预处理图片 - 使用改进的预处理，只处理左下角1/6区域(3×2网格)
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
        
        // 使用与recognizePrice相同的匹配模式
        const pricePatterns = [
            /(?:折后约￥|折后价￥|￥|折后价#|折后约#|#|折 后 约 #)([0-9]+(?:\.[0-9]+)?)/,
            /(?:¥|\$|€|\£|\s)([0-9]+(?:\.[0-9]+)?)/,
            /价格?[：:]\s*([0-9]+(?:\.[0-9]+)?)/,
            /([0-9]+(?:\.[0-9]+)?)\s*元/,
            /(?:促销价|现价|特价|优惠价|活动价)(?:[:：])?(?:\s)*([0-9]+(?:\.[0-9]+)?)/
        ];
        
        for (const pattern of pricePatterns) {
            const match = recognizedText.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    } catch (error) {
        // 静默处理错误，仅记录日志
        console.error('价格识别失败:', error);
        return null;
    }
}
    
    /**
     * 处理单个容器的识别
     * @param {HTMLElement} container - 要处理的容器元素
     * @returns {Promise<boolean>} - 处理是否成功
     */
    async function processContainer(container) {
        // 锁定当前容器，防止用户操作
        lockContainer(container);
        
        // 获取容器中的图片和水印元素
        const img = container.querySelector('img');
        const watermarkInput = container.querySelector('.watermark-input');
        
        if (!img || !watermarkInput) {
            unlockContainer(container);
            return false;
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
            
            return true;
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
            
            return false;
        } finally {
            // 解锁容器
            unlockContainer(container);
        }
    }
    
    /**
     * 并发处理多个容器
     * @param {Array<HTMLElement>} containers - 要处理的容器元素数组
     * @param {number} batchSize - 一次并发处理的数量
     */
    async function processBatch(containers, batchSize) {
        // 处理所有容器
        for (let i = 0; i < containers.length; i += batchSize) {
            // 获取当前批次的容器
            const batch = containers.slice(i, i + batchSize);
            
            // 并发处理当前批次
            await Promise.all(batch.map(container => processContainer(container)));
            
            // 短暂延迟后继续下一批，提高用户体验
            if (i + batchSize < containers.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }
    
    /**
     * 识别选中的图片，若无选中则识别所有图片
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
            // 获取所有选中的产品图片容器
            const selectedContainers = Array.from(document.querySelectorAll('.product-image.selected'));
            
            // 检查是否有选中的图片
            if (selectedContainers.length > 0) {
                // 过滤出已有图片的选中容器
                const selectedWithImages = selectedContainers.filter(container => {
                    const img = container.querySelector('img');
                    return img && img.style.display !== 'none' && img.src;
                });
                
                if (selectedWithImages.length === 0) {
                    if (typeof showNotification === 'function') {
                        showNotification('选中区域中没有可识别的图片！', 2000);
                    }
                    return;
                }
                
                // 显示通知
                if (typeof showNotification === 'function') {
                    showNotification(`开始识别${selectedWithImages.length}张选中图片...`, 2000);
                }
                
                // 使用批处理模式并发处理选中的图片
                await processBatch(selectedWithImages, MAX_CONCURRENT);
                
                // 显示完成通知
                if (typeof showNotification === 'function') {
                    showNotification(`已完成${selectedWithImages.length}张图片的识别`, 2000);
                }
            } else {
                // 若无选中，获取所有产品图片容器
                const allProductImages = document.querySelectorAll('.product-image');
                
                // 过滤出已有图片的容器
                const containersWithImages = Array.from(allProductImages).filter(container => {
                    const img = container.querySelector('img');
                    return img && img.style.display !== 'none' && img.src;
                });
                
                // 检查是否有图片可识别
                if (containersWithImages.length === 0) {
                    if (typeof showNotification === 'function') {
                        showNotification('未找到可识别图片！', 2000);
                    } else {
                        alert('未找到可识别图片！');
                    }
                    return;
                }
                
                // 显示通知
                if (typeof showNotification === 'function') {
                    showNotification(`开始识别${containersWithImages.length}张图片...`, 2000);
                }
                
                // 使用批处理模式并发处理所有图片
                await processBatch(containersWithImages, MAX_CONCURRENT);
                
                // 显示完成通知
                if (typeof showNotification === 'function') {
                    showNotification(`已完成${containersWithImages.length}张图片的识别`, 2000);
                }
            }
        } catch (error) {
            console.error('OCR识别过程发生错误:', error);
            if (typeof showNotification === 'function') {
                showNotification('识别过程发生错误，请重试', 2000);
            }
        } finally {
            // 恢复非处理中状态
            ocrProcessing = false;
            updateOCRButtonState(false);
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