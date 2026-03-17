/**
 * Chrome自动刷新扩展 - 工具函数模块
 */

/**
 * 标准化URL
 * @param {string} url - 原始URL
 * @returns {string|null} 标准化后的URL或null（如果无效）
 */
function normalizeUrl(url) {
    try {
        // 如果没有指定协议，默认为https
        const urlWithProtocol = url.includes("://") ? url : `https://${url}`;
        const parsedUrl = new URL(urlWithProtocol);
        const host_url = parsedUrl.hostname;
        
        // 验证域名或IP格式
        const domainPattern = /^(?!:\/\/)(?!.*--)[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})$/;
        const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        const isDomain = domainPattern.test(host_url);
        const isIP = ipPattern.test(host_url);
        
        if (isDomain || isIP) {
            // 移除协议、尾随斜杠，并转为小写
            return `${parsedUrl.host}${parsedUrl.pathname}`.toLowerCase();
        } else {
            return null;
        }
    } catch (error) {
        // URL无效
        console.error('URL标准化失败:', error);
        return null;
    }
}

/**
 * 安全地检查URL是否匹配
 * @param {string} currentUrl - 当前URL
 * @param {string} savedUrl - 保存的URL
 * @returns {boolean} 是否匹配
 */
function urlMatches(currentUrl, savedUrl) {
    if (!currentUrl || !savedUrl) return false;
    
    try {
        const savedUrlLower = savedUrl.toLowerCase();
        const currentUrlLower = currentUrl.toLowerCase();
        
        // 精确匹配：完整的host + pathname
        if (savedUrlLower === currentUrlLower) {
            return true;
        }
        
        // 前缀匹配：确保匹配的是完整的域名部分
        // 例如：example.com 应该匹配 example.com/path，但不匹配 example.com.evil.com
        if (currentUrlLower.startsWith(savedUrlLower + '/')) {
            return true;
        }
        
        // 检查是否是子路径匹配
        const savedParts = savedUrlLower.split('/');
        const currentParts = currentUrlLower.split('/');
        
        // 确保域名部分完全匹配
        if (savedParts[0] === currentParts[0]) {
            // 检查路径部分是否以保存的路径开头
            const savedPath = savedParts.slice(1).join('/');
            const currentPath = currentParts.slice(1).join('/');
            if (currentPath.startsWith(savedPath)) {
                return true;
            }
        }
        
        return false;
    } catch (e) {
        console.error('URL匹配错误:', e);
        return false;
    }
}

/**
 * 验证刷新时间设置
 * @param {number} minutes - 分钟数
 * @param {string} unit - 单位（seconds或minutes）
 * @returns {number} 验证后的毫秒数
 */
function validateRefreshTime(minutes, unit) {
    const minValue = unit === 'seconds' ? 1 : 1; // 最小1秒或1分钟
    const maxValue = unit === 'seconds' ? 3600 : 1440; // 最大1小时或24小时
    
    let value = parseInt(minutes, 10);
    
    // 验证数值
    if (isNaN(value) || value < minValue) {
        value = unit === 'seconds' ? 30 : 15; // 默认值
    } else if (value > maxValue) {
        value = maxValue;
    }
    
    // 转换为毫秒
    return unit === 'seconds' ? value * 1000 : value * 60 * 1000;
}

/**
 * 安全的存储操作
 * @param {Object} data - 要存储的数据
 * @returns {Promise<void>}
 */
async function safeStorageSet(data) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(data, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

/**
 * 安全的存储读取
 * @param {string|Array} keys - 要读取的键
 * @returns {Promise<Object>}
 */
async function safeStorageGet(keys) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    // Node.js环境
    module.exports = {
        normalizeUrl,
        urlMatches,
        validateRefreshTime,
        safeStorageSet,
        safeStorageGet
    };
} else {
    // 浏览器环境
    window.AutoRefreshUtils = {
        normalizeUrl,
        urlMatches,
        validateRefreshTime,
        safeStorageSet,
        safeStorageGet
    };
}