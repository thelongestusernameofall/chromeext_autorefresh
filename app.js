// 工具函数 - 复制自utils.js以避免manifest修改
function normalizeUrl(url) {
    try {
        const urlWithProtocol = url.includes("://") ? url : `https://${url}`;
        const parsedUrl = new URL(urlWithProtocol);
        const host_url = parsedUrl.hostname;
        
        const domainPattern = /^(?!:\/\/)(?!.*--)[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})$/;
        const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        const isDomain = domainPattern.test(host_url);
        const isIP = ipPattern.test(host_url);
        
        if (isDomain || isIP) {
            return `${parsedUrl.host}${parsedUrl.pathname}`.toLowerCase();
        } else {
            return null;
        }
    } catch (error) {
        console.error('URL标准化失败:', error);
        return null;
    }
}

// URL匹配函数
function urlMatches(currentUrl, savedUrl) {
    if (!currentUrl || !savedUrl) return false;
    
    try {
        const savedUrlLower = savedUrl.toLowerCase();
        const currentUrlLower = currentUrl.toLowerCase();
        
        if (savedUrlLower === currentUrlLower) {
            return true;
        }
        
        if (currentUrlLower.startsWith(savedUrlLower + '/')) {
            return true;
        }
        
        const savedParts = savedUrlLower.split('/');
        const currentParts = currentUrlLower.split('/');
        
        if (savedParts[0] === currentParts[0]) {
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


// 添加消息监听器，接收来自 background.js 的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.command === "startTimer") {
        // 收到启动计时器消息，重新加载页面
        location.reload();
    }
    if (message.command === 'clearTimer') {
        // 收到清除计时器消息
        clearTimeout(timeoutId);
    }
});

const keysToGet = ["savedURL", "selectedEvents", "refreshMinutes","timeUnit","isEnabled"];
// 匹配url
chrome.storage.local.get(keysToGet, function (result) {
    try {
        // 验证存储数据
        if (chrome.runtime.lastError) {
            console.error('读取存储数据失败:', chrome.runtime.lastError);
            return;
        }

        var storedMinutes = result.refreshMinutes;
        const customUrl = result.savedURL || [];
        const timeUnit = result.timeUnit || "minutes";
        const selectedEvents = result.selectedEvents || {};
        var enable = result.isEnabled !== false; // 默认启用
        
        if (storedMinutes === undefined || storedMinutes === null || storedMinutes <= 0) {
            // 如果保存值为空或未定义或无效，设置 时间默认 为 15
            storedMinutes = 15;
        }


    // 开始计时，执行刷新操作
    function startTimer() {
        try {
            if (storedMinutes !== undefined && storedMinutes !== null && storedMinutes > 0) {
                var milliseconds = (timeUnit === "seconds") ? storedMinutes * 1000 : storedMinutes * 60 * 1000;
                timeoutId = setTimeout(refreshPage, milliseconds);
            } else {
                // 默认15分钟
                timeoutId = setTimeout(refreshPage, 15 * 60 * 1000); // 15分钟，单位毫秒
            }
        } catch (error) {
            console.error('启动计时器失败:', error);
        }
    }

    // 重置计时器
    function resetTimer() {
        try {
            clearTimeout(timeoutId);
            startTimer(); // 重新开始计时
        } catch (error) {
            console.error('重置计时器失败:', error);
        }
    }
    
    // 刷新页面
    function refreshPage() {
        try {
            // 刷新页面
            location.reload();
        } catch (error) {
            console.error('刷新页面失败:', error);
        }
    }

    //时间
    let timeoutId;
    

    // 获取当前页面的 URL
    var currentUrl = normalizeUrl(window.location.href);
    if (!currentUrl) {
        // URL无效，不执行插件逻辑
        return;
    }
    
    // 安全地检查URL是否匹配
    const jud = customUrl.findIndex(saved => urlMatches(currentUrl, saved));
    
    if (jud !== -1 && enable !== false) {
        // 执行插件的逻辑，因为当前页面的 URL 符合定义的规则
        // customUrl: ${customUrl}
        // 初始启动计时器
        startTimer();
        
        // 存储事件监听器引用，用于清理
        const eventListeners = [];
        
        // 监听所有鼠标事件 
        if (selectedEvents) {
            // 检查每个事件是否被选中，并创建相应的监听器
            if (selectedEvents.mouseMove) {
                // 创建鼠标移动事件监听器
                document.addEventListener("mousemove", resetTimer);
                eventListeners.push({ type: "mousemove", handler: resetTimer });
            }

            if (selectedEvents.mouseClick) {
                // 创建鼠标单击事件监听器
                document.addEventListener("click", resetTimer);
                eventListeners.push({ type: "click", handler: resetTimer });
            }

            if (selectedEvents.mouseDoubleClick) {
                // 创建鼠标双击事件监听器
                document.addEventListener("dblclick", resetTimer);
                eventListeners.push({ type: "dblclick", handler: resetTimer });
            }

            if (selectedEvents.mouseScroll) {
                // 创建鼠标滑动事件监听器
                document.addEventListener("wheel", resetTimer);
                eventListeners.push({ type: "wheel", handler: resetTimer });
            }
        }
        
        // 监听页面卸载事件，清理事件监听器
        window.addEventListener('beforeunload', function cleanupEventListeners() {
            eventListeners.forEach(({ type, handler }) => {
                document.removeEventListener(type, handler);
            });
        });
    }
    } catch (error) {
        console.error('自动刷新插件初始化失败:', error);
    }
});