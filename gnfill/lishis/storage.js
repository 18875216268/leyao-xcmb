/**
 * storage.js - 历史图片存储管理模块
 * 负责历史图片的存储、读取、添加和删除
 */

// 初始化本地存储
function initLocalStorage() {
    // 从localStorage加载已保存的图片数据
    const savedStorage = localStorage.getItem('productImageStorage');
    if (savedStorage) {
        try {
            // 解析保存的数据
            const parsedStorage = JSON.parse(savedStorage);
            
            // 验证数据结构
            if (parsedStorage && parsedStorage.images && Array.isArray(parsedStorage.images)) {
                imageStorage = parsedStorage;
                
                // 确保nextId总是最大的id+1
                let maxId = 0;
                imageStorage.images.forEach(img => {
                    if (img.id > maxId) maxId = img.id;
                });
                imageStorage.nextId = maxId + 1;
                
                console.log(`从本地存储加载了${imageStorage.images.length}张图片`);
            }
        } catch (e) {
            console.error('加载本地存储图片失败:', e);
            // 出错时重置存储
            resetImageStorage();
        }
    } else {
        // 初次使用，创建新的存储
        resetImageStorage();
    }
}

// 重置图片存储
function resetImageStorage() {
    imageStorage = {
        images: [],
        nextId: 1
    };
    saveToLocalStorage();
}

// 保存到本地存储
function saveToLocalStorage() {
    try {
        localStorage.setItem('productImageStorage', JSON.stringify(imageStorage));
    } catch (e) {
        console.error('保存到本地存储失败:', e);
        // 如果存储失败，可能是因为大小限制，尝试清理旧数据
        if (e.name === 'QuotaExceededError') {
            cleanupOldImages();
        }
    }
}

// 清理旧图片数据以节省空间
function cleanupOldImages() {
    // 如果图片数量超过50张，则删除最早的10张
    if (imageStorage.images.length > 50) {
        imageStorage.images = imageStorage.images.slice(-40); // 保留最近的40张
        saveToLocalStorage();
        console.log('已清理旧图片数据');
    }
}

// 添加图片到本地存储
async function addImageToStorage(imageData, fileName) {
    // 尝试识别价格
    let price = null;
    try {
        // 使用OCRModule识别价格
        if (window.OCRModule) {
            price = await window.OCRModule.recognizePrice(imageData);
        }
    } catch (e) {
        console.error('价格识别过程出错:', e);
    }
    
    // 创建一个新的图片对象，加入价格信息
    const newImage = {
        id: imageStorage.nextId++,
        data: imageData,
        name: fileName || `图片 ${imageStorage.images.length + 1}`,
        timestamp: new Date().toISOString(),
        price: price // 添加价格字段
    };
    
    // 添加到存储数组
    imageStorage.images.push(newImage);
    
    // 保存到本地存储
    saveToLocalStorage();
    
    // 将图片添加到历史面板
    addImageToHistoryPanel(newImage);
    
    // 更新分页（如果可用）
    if (typeof updatePagination === 'function') {
        updatePagination();
    }
    
    return newImage.id; // 返回新图片的ID
}

// 加载历史图片到面板
function loadHistoryImages() {
    // 清空历史容器
    const historyContainer = document.querySelector('.history-container');
    if (!historyContainer) {
        console.error('未找到历史容器元素');
        return;
    }
    
    historyContainer.innerHTML = '';
    
    // 如果没有历史图片，显示空消息
    if (imageStorage.images.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history-message">尚无历史图片</div>';
        return;
    }
    
    // 按照时间倒序排列，最新的在上面
    const sortedImages = [...imageStorage.images].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // 添加每个图片到历史面板
    sortedImages.forEach(image => {
        addImageToHistoryPanel(image);
    });
    
    // 初始化分页
    if (typeof updatePagination === 'function') {
        updatePagination();
    }
}

// 将图片添加到历史面板
// 将图片添加到历史面板
// 将图片添加到历史面板
function addImageToHistoryPanel(image) {
    const historyContainer = document.querySelector('.history-container');
    if (!historyContainer) return;
    
    // 移除空消息（如果存在）
    const emptyMessage = historyContainer.querySelector('.empty-history-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // 创建历史项目元素
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.setAttribute('data-image-id', image.id);
    historyItem.setAttribute('data-event-attached', 'true'); // 标记为已添加事件，防止事件冒泡
    historyItem.setAttribute('data-filtered', 'false'); // 默认不过滤
    
    // 截取文件名，最多显示15个字符
    let displayName = image.name;
    if (displayName.length > 15) {
        const extension = displayName.lastIndexOf('.');
        if (extension !== -1) {
            const ext = displayName.substring(extension);
            displayName = displayName.substring(0, 12) + '...' + ext;
        } else {
            displayName = displayName.substring(0, 12) + '...';
        }
    }
    
    // 格式化时间显示
    let timeDisplay = '';
    if (image.timestamp) {
        const date = new Date(image.timestamp);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        timeDisplay = `${year}/${month}/${day} ${hours}:${minutes}`;
    }
    
    // 添加价格信息到名称中
    let nameWithPrice = displayName;
    if (image.price) {
        nameWithPrice = `${displayName}【￥${image.price}】`;
    }
    
    // 设置HTML内容
    historyItem.innerHTML = `
        <div class="history-item-time">
            ${timeDisplay}
            <div class="history-action-btn history-action-delete" title="从历史中删除">×</div>
        </div>
        <div class="history-thumbnail">
            <img src="${image.data}" alt="${image.name}">
        </div>
        <div class="history-item-name">${nameWithPrice}</div>
    `;
    
    // 添加到容器的顶部
    if (historyContainer.firstChild) {
        historyContainer.insertBefore(historyItem, historyContainer.firstChild);
    } else {
        historyContainer.appendChild(historyItem);
    }
    
    // 添加事件监听
    // 点击图片依次填充到选中区域
    historyItem.addEventListener('click', function(e) {
        // 停止事件冒泡，防止清除选择状态
        e.stopPropagation();
        
        // 忽略点击删除按钮的情况
        if (e.target.closest('.history-action-btn')) return;
        
        // 依次填充到选中区域
        fillNextSelectedArea(image);
    });
    
    // 删除按钮 - 不再显示确认提示
    const deleteBtn = historyItem.querySelector('.history-action-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            removeImageFromStorage(image.id, false); // 传递false表示不显示确认提示
        });
    }
    
    // 应用当前搜索过滤条件（如果有）
    if (typeof currentSearchTerm !== 'undefined' && currentSearchTerm) {
        const imageName = image.name.toLowerCase();
        if (!imageName.includes(currentSearchTerm.toLowerCase())) {
            historyItem.dataset.filtered = 'true';
        }
    }
    
    // 添加预览功能(如果存在)
    if (typeof YuLan !== 'undefined' && YuLan && typeof YuLan.addButton === 'function') {
        const thumbnail = historyItem.querySelector('.history-thumbnail');
        if (thumbnail) {
            const img = thumbnail.querySelector('img');
            if (img) {
                YuLan.addButton(thumbnail, img.src);
            }
        }
    } else if (typeof PreviewModule !== 'undefined' && PreviewModule) {
        // 刷新预览功能
        setTimeout(function() {
            if (typeof PreviewModule.refresh === 'function') {
                PreviewModule.refresh();
            }
        }, 100);
    }
}

// 从存储中删除图片，添加一个参数控制是否显示确认提示
function removeImageFromStorage(imageId, showConfirm = false) {
    // 如果需要确认，则显示提示
    if (showConfirm && !confirm('确定要从历史记录中删除此图片吗？')) {
        return;
    }
    
    // 查找图片索引
    const index = imageStorage.images.findIndex(img => img.id === parseInt(imageId, 10));
    
    if (index !== -1) {
        // 从数组中移除
        imageStorage.images.splice(index, 1);
        
        // 保存到本地存储
        saveToLocalStorage();
        
        // 从面板中移除
        const historyItem = document.querySelector(`.history-item[data-image-id="${imageId}"]`);
        if (historyItem) {
            historyItem.remove();
        }
        
        // 如果没有图片了，显示空消息
        if (imageStorage.images.length === 0) {
            const historyContainer = document.querySelector('.history-container');
            historyContainer.innerHTML = '<div class="empty-history-message">尚无历史图片</div>';
        }
        
        // 更新分页
        if (typeof updatePagination === 'function') {
            updatePagination();
        }
        
        // 使用通知代替alert
        if (typeof showNotification === 'function') {
            showNotification('图片已从历史记录中删除');
        }
    }
}