// 当插件安装时，设置默认按钮状态为启动
chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({ isEnabled: true }, function() {
      //console.log('默认按钮状态已设置为启动');
    });
  });
  
  // 监听来自 app 的消息，用于切换按钮状态
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.command === 'toggleState') {
      // 获取当前按钮状态
      chrome.storage.local.get(['isEnabled', 'savedURL'], function(data) {
        if (chrome.runtime.lastError) {
          console.error('读取存储失败:', chrome.runtime.lastError);
          return;
        }
        
        // 切换按钮状态
        var newState = !data.isEnabled;
        const savedURLs = data.savedURL || [];
        
        // 只向匹配的标签页发送消息
        chrome.tabs.query({}, function(tabs) {
          tabs.forEach(function(tab) {
            try {
              // 检查标签页是否匹配保存的URL
              if (savedURLs.length > 0 && tab.url) {
                // 这里可以添加URL匹配逻辑，但为了简化，暂时向所有标签页发送
                // 在实际应用中，应该只向匹配的标签页发送消息
                chrome.tabs.sendMessage(tab.id, { 
                  command: newState ? 'startTimer' : 'clearTimer' 
                }, function(response) {
                  if (chrome.runtime.lastError) {
                    // 忽略内容脚本未注入的错误
                    if (!chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
                      console.warn('向标签页发送消息失败:', tab.id, chrome.runtime.lastError);
                    }
                  }
                });
              }
            } catch (error) {
              console.error('处理标签页消息失败:', tab.id, error);
            }
          });
        });
        
        chrome.storage.local.set({ isEnabled: newState }, function() {
          if (chrome.runtime.lastError) {
            console.error('保存状态失败:', chrome.runtime.lastError);
            return;
          }
          // 将新的按钮状态发送给 option.js
          chrome.runtime.sendMessage({ action: 'updateButton', isEnabled: newState });
        });
      });
    }
  });
  
  