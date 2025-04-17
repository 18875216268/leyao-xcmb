/**
 * shuiyin.js - 功能模块(水印功能)
 * 负责水印添加、调整和设置应用
 */

// 添加保存水印文本的全局变量
const watermarkTexts = {}; // 用于保存每个水印输入框的文本内容

// 添加水印元素到产品图片
function addWatermarksToProducts() {
    // 先找到所有现有的产品图片容器
    const productImages = document.querySelectorAll('.product-image');
    
    // 为每个容器添加水印元素
    productImages.forEach((container, index) => {
        // 检查是否已有水印元素
        if (!container.querySelector('.watermark')) {
            const watermark = document.createElement('div');
            watermark.className = 'watermark';
            
            // 创建可编辑的水印输入框
            const watermarkInput = document.createElement('input');
            watermarkInput.type = 'text';
            watermarkInput.className = 'watermark-input';
            
            // 使用保存的水印文本或默认值
            const dataIndex = `product-${index}`;
            watermarkInput.value = watermarkTexts[dataIndex] || '折后价：￥999';
            watermarkInput.placeholder = '双击编辑水印文字';
            watermarkInput.setAttribute('data-index', dataIndex);
            
            // 设置初始样式，确保与CSS中的默认值一致
            watermarkInput.style.color = '#ff0000';
            watermarkInput.style.fontWeight = 'bold';
            watermarkInput.style.transform = 'translate(-50%, -50%) rotate(-25deg)';
            watermarkInput.style.border = '3px solid #ff0000';
            watermarkInput.style.fontSize = '16px';
            watermarkInput.style.padding = '2px 4px';
            
            // 默认情况下禁用编辑，双击时启用
            watermarkInput.readOnly = true;
            
            // 添加双击事件监听器
            watermarkInput.addEventListener('dblclick', function(e) {
                this.readOnly = false;
                this.focus();
                this.select();
                e.stopPropagation();
            });
            
            // 添加失焦事件监听器，保存文本内容
            watermarkInput.addEventListener('blur', function() {
                this.readOnly = true;
                // 如果输入为空，恢复默认值
                if (!this.value.trim()) {
                    this.value = '折后价：￥999';
                }
                
                // 保存水印文本到全局对象
                const dataIndex = this.getAttribute('data-index');
                watermarkTexts[dataIndex] = this.value;
                
                // 调整宽度以适应文本
                adjustWatermarkWidth(this);
            });
            
            // 添加输入事件监听器，实时调整宽度
            watermarkInput.addEventListener('input', function() {
                adjustWatermarkWidth(this);
            });
            
            // 添加按键事件监听器，按下回车时取消编辑状态
            watermarkInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                }
            });
            
            watermark.appendChild(watermarkInput);
            container.appendChild(watermark);
            
            // 初始化时调整宽度
            setTimeout(() => adjustWatermarkWidth(watermarkInput), 10);
        } else {
            // 如果水印元素已存在，更新其文本内容（保持当前值）
            const existingInput = container.querySelector('.watermark-input');
            if (existingInput) {
                const dataIndex = existingInput.getAttribute('data-index');
                // 如果有保存的文本，则使用它
                if (watermarkTexts[dataIndex]) {
                    existingInput.value = watermarkTexts[dataIndex];
                    adjustWatermarkWidth(existingInput);
                } else {
                    // 否则，保存当前文本
                    watermarkTexts[dataIndex] = existingInput.value;
                }
            }
        }
    });
}

// 调整水印宽度以适应文本内容
function adjustWatermarkWidth(input) {
    // 创建一个临时的 span 元素来测量文本宽度
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.whiteSpace = 'nowrap';  // 保持单行
    tempSpan.style.fontSize = input.style.fontSize;
    tempSpan.style.fontWeight = input.style.fontWeight;
    tempSpan.style.fontFamily = 'Microsoft YaHei, PingFang SC, sans-serif';
    tempSpan.textContent = input.value;
    
    document.body.appendChild(tempSpan);
    const textWidth = tempSpan.offsetWidth;
    document.body.removeChild(tempSpan);
    
    // 加上内边距
    const paddingX = 8; // 左右各4px的内边距
    
    // 设置输入框宽度为文本宽度加内边距
    input.style.width = `${textWidth + paddingX}px`;
}

// 保存所有水印文本
function saveAllWatermarkTexts() {
    const watermarkInputs = document.querySelectorAll('.watermark-input');
    watermarkInputs.forEach(input => {
        const dataIndex = input.getAttribute('data-index');
        if (dataIndex) {
            watermarkTexts[dataIndex] = input.value;
        }
    });
}

// 应用水印设置
function applyWatermarkSettings() {
    // 在应用设置之前保存所有水印文本
    saveAllWatermarkTexts();
    
    const watermarkEnabled = document.getElementById('watermark-enabled').checked;
    const watermarkColor = document.getElementById('watermark-color').value;
    const watermarkWeight = document.getElementById('watermark-weight').value;
    const watermarkSize = document.getElementById('watermark-size').value;
    const watermarkBorderColor = document.getElementById('watermark-border-color').value;
    const watermarkBorder = document.getElementById('watermark-border').value;
    const watermarkAngle = document.getElementById('watermark-angle').value;
    
    // 显示或隐藏所有水印
    const watermarks = document.querySelectorAll('.watermark');
    watermarks.forEach(watermark => {
        watermark.style.display = watermarkEnabled ? 'flex' : 'none';
    });
    
    // 如果水印已禁用，则无需应用其他样式
    if (!watermarkEnabled) return;
    
    // 应用到所有水印输入框
    const watermarkInputs = document.querySelectorAll('.watermark-input');
    watermarkInputs.forEach(input => {
        input.style.color = watermarkColor;
        input.style.fontSize = `${watermarkSize}px`;
        input.style.fontWeight = watermarkWeight;
        input.style.transform = `translate(-50%, -50%) rotate(${watermarkAngle}deg)`;
        input.style.border = `${watermarkBorder}px solid ${watermarkBorderColor}`;
        
        // 字体大小、粗细变化时需要重新计算宽度
        setTimeout(() => adjustWatermarkWidth(input), 10);
    });
}