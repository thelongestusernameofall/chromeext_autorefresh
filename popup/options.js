// 工具函数 - 与app.js保持一致
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



function updateUrlList(savedUrls) {
  // 更新url列表
  var urlList = document.getElementById("urlList");
  // 清空列表
  urlList.innerHTML = "";
  // 将urls数组中的URL添加到列表中
  for (var i = 0; i < savedUrls.length; i++) {
    var li = document.createElement("li");

    // 创建 span 元素用于保存 savedUrls[i] 的值
    var urlSpan = document.createElement("span");
    urlSpan.textContent = savedUrls[i];

    // 创建删除按钮
    var deleteButton = document.createElement("button");
    deleteButton.className = "delButton";
    deleteButton.setAttribute("data-index", i);
    deleteButton.textContent = "删除";

    // 添加删除按钮的点击事件
    deleteButton.addEventListener("click", function () {
      var index = parseInt(this.getAttribute("data-index"), 10);
      var url = savedUrls[index];
      deleteUrl(index, url);
    });

    // 将 span 和按钮添加到 li 中
    li.appendChild(urlSpan);
    li.appendChild(deleteButton);
    // 设置 li 元素的样式，使用 Flexbox 布局
    li.style.display = "flex";
    li.style.alignItems = "center"; // 垂直居中

// 设置删除按钮的样式，确保它不会自动换行
deleteButton.style.flexShrink = "0";

    // 将 li 添加到列表中
    urlList.appendChild(li);
  }
}

function judSimilar_func(newUrl, savedUrls) {
  // 检查待录入的 URL 是否与已保存的 URL 存在相似的情况
  const similarUrlIndex = savedUrls.findIndex(savedUrl => newUrl.startsWith(savedUrl));

  if (similarUrlIndex !== -1) {
    // 存在相似的 URL
    const similarUrl = savedUrls[similarUrlIndex];
    if (newUrl.length > similarUrl.length) {
      // 待录入的 URL 更长，替换已存在的 URL
      savedUrls[similarUrlIndex] = newUrl;
      // 刷新更新后的 savedUrl 列表
      updateUrlList(savedUrls);
      // 更新 savedUrl 到浏览器本地存储中
      chrome.storage.local.set({ 'savedURL': savedUrls });
    }
  } else {
    const filteredUrls = savedUrls.filter(url => !url.startsWith(newUrl));
    filteredUrls.push(newUrl);
    // 刷新更新后的 savedUrl 列表
    updateUrlList(filteredUrls);
    // 更新 savedUrl 到浏览器本地存储中
    chrome.storage.local.set({ 'savedURL': filteredUrls });
  }
}


function deleteUrl(index, url) {
  // 从浏览器本地存储中获取保存的 URL
  chrome.storage.local.get("savedURL", function (result) {
    //console.log(url);
    var storedUrls = result.savedURL || [];
    normalUrl = normalizeUrl(url)
    //console.log(normalUrl);     
    //console.log(index);
    // 在 storedUrl 中查找并删除对应的 URL
    var urlIndex = storedUrls.indexOf(normalUrl);
    //console.log(urlIndex);
    if (urlIndex !== -1) {
      storedUrls.splice(urlIndex, 1);
      //console.log(storedUrls);
      // 保存更新后的 URLs 到浏览器本地
      chrome.storage.local.set({ "savedURL": storedUrls });

      // 清空所有 li 内容
      var urlList = document.getElementById("urlList");
      urlList.innerHTML = "";

      // 重新调用 updateUrlList 刷新列表
      updateUrlList(storedUrls);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var toggleButton = document.getElementById('toggleButton');

  toggleButton.addEventListener('click', function() {
    // 向 background script 发送消息，请求切换按钮状态
    chrome.runtime.sendMessage({ command: 'toggleState' });
  });
});

  // 监听来自 background.js 的消息
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === "updateButton") {
        // 根据收到的状态更改按钮的背景图片
        var button = document.getElementById("toggleButton");
        var startIcon = chrome.runtime.getURL("icons/start.png");
        var stopIcon = chrome.runtime.getURL("icons/stop.png");
        button.style.backgroundImage = message.isEnabled ? "url('" + startIcon + "')" : "url('" + stopIcon + "')";
    }
  });

// 页面加载逻辑
document.addEventListener("DOMContentLoaded", function () {
  const timeUnitSelect = document.getElementById("timeUnitSelect");
  const urlInput = document.getElementById("urlInput");
  const saveButton = document.getElementById("saveButton");
  const addButton = document.getElementById("addButton");
  const searchKey = ["savedURL", "selectedEvents", "refreshMinutes","timeUnit","isEnabled"]
  const minutesInput = document.getElementById("minutesInput");
  const cleanButton = document.getElementById("cleanButton");

  // 在弹出页面加载时，获取存储数据刷新到设置界面
  chrome.storage.local.get(searchKey, function (result) {
    var isEnabled = result.isEnabled;
    var start_stopBtn=document.getElementById('toggleButton');
    var startIcon = chrome.runtime.getURL("icons/start.png");
    var stopIcon = chrome.runtime.getURL("icons/stop.png");
    start_stopBtn.style.backgroundImage = isEnabled ? "url('" + startIcon + "')":"url('" + stopIcon + "')";
    if (result.savedURL) {
      //console.log(result.savedURL);
      updateUrlList(result.savedURL);

    } 
    //else {
      //console.log("url空");
    //}

    if (result.selectedEvents) {
      // 更新复选框的状态
      document.getElementById("mouseMoveCheckbox").checked = result.selectedEvents.mouseMove || false;
      document.getElementById("mouseClickCheckbox").checked = result.selectedEvents.mouseClick || false;
      document.getElementById("mouseDoubleClickCheckbox").checked = result.selectedEvents.mouseDoubleClick || false;
      document.getElementById("mouseScrollCheckbox").checked = result.selectedEvents.mouseScroll || false;
    }

    if (result.timeUnit === "seconds") {
      //console.log("秒");
      document.getElementById("timeUnitSelect").value = "seconds";
    }else{
      //console.log("分");
      document.getElementById("timeUnitSelect").value = "minutes";
    }

    if (result.refreshMinutes !== undefined && result.refreshMinutes !== null) {
      // 如果存储的刷新时间不为空，则将输入框的值设置为存储的值
      minutesInput.value = result.refreshMinutes;
    } else {
      // 如果存储的刷新时间为空，则将输入框的值设置为默认值 15
      minutesInput.value = "15";
    }
  });


  // 当录入按钮点击时，检查url合法性，检查是否已存在、录入
  addButton.addEventListener("click", function () {
    // 获取输入框中的 URL
    const url = urlInput.value;
    if (url === "") {
      alert("URL为空！");
    } else {
      const normalurl = normalizeUrl(url);
      // 验证 URL 是否合法
      if (normalurl) {
        // 从浏览器本地存储中获取 savedUrl 的值
        chrome.storage.local.get('savedURL', function (result) {
          var savedUrlArray = result.savedURL || []; // 如果不存在 savedUrl，则默认为空数组
          if (savedUrlArray.length === 0) {
            //为空直接保存
            savedUrlArray.push(normalurl);
            //console.log(savedUrlArray);
            // 刷新更新后的 savedUrl 列表
            updateUrlList(savedUrlArray);

            // 更新 savedUrl 到浏览器本地存储中
            chrome.storage.local.set({ 'savedURL': savedUrlArray });
            urlInput.value = "";
          } else {
            // 判断是否存在相同的
            if (savedUrlArray.includes(normalurl)) {
              alert("该URL已存在");
            } else {
              judSimilar_func(normalurl, savedUrlArray);
              urlInput.value = "";
            }
          }

        });

        chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          tabs.forEach((tab) => {
            // 重新加载每个页面
            chrome.tabs.reload(tabs[0].id);
          });
        }).catch((error) => {
          console.error("刷新页面出错！:", error);
        });
      } else {
        alert("URL不合法");
      }
    }

  })

  // 当保存按钮被点击时，将输入的 URL 保存到存储中
  saveButton.addEventListener("click", function () {
    // 获取复选框元素
    const mouseMoveCheckbox = document.getElementById("mouseMoveCheckbox");
    const mouseClickCheckbox = document.getElementById("mouseClickCheckbox");
    const mouseDoubleClickCheckbox = document.getElementById("mouseDoubleClickCheckbox");
    const mouseScrollCheckbox = document.getElementById("mouseScrollCheckbox");

    const selectedEvents = {
      mouseMove: mouseMoveCheckbox.checked,
      mouseClick: mouseClickCheckbox.checked,
      mouseDoubleClick: mouseDoubleClickCheckbox.checked,
      mouseScroll: mouseScrollCheckbox.checked,
    };

    chrome.storage.local.set({ selectedEvents }, function () {
      // 选中的事件已保存到本地存储
    });

    //获取分钟，十进制分钟
    var minutes = parseInt(minutesInput.value, 10);
    // 获取时间单位
    var timeUnit = timeUnitSelect.value;

    // 存储输入的分钟数和时间单位
    chrome.storage.local.set({ 
      refreshMinutes: minutes,
      timeUnit: timeUnit
    }, function () {
      // 刷新时间和单位已保存到本地存储
    });

    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      tabs.forEach((tab) => {
        // 重新加载每个页面
        chrome.tabs.reload(tabs[0].id);
      });
    }).catch((error) => {
      console.error("刷新页面出错！:", error);
    });
  });

  // 添加点击事件监听器
  cleanButton.addEventListener("click", function () {
    // 清空输入框内容
    document.getElementById("urlInput").value = "";

    // 清空本地保存的 savedURL
    chrome.storage.local.remove("savedURL", function () {
      // 本地保存的 savedURL 已清空
    });
    var urlList = document.getElementById("urlList");
    // 清空列表
    urlList.innerHTML = "";
  });

  // 添加回车键事件监听器
  urlInput.addEventListener("keyup", function (event) {
    // 判断按下的键是否为回车键
    if (event.key === "Enter") {
      // 录入
      addButton.click();
    }
  });

});


// 事件委托监听删除按钮的点击事件
document.addEventListener("click", function (event) {
  var target = event.target;

  // 检查点击的元素是否为删除按钮
  if (target.classList.contains("delButton")) {
    // 获取点击的按钮所在的列表项
    var listItem = target.closest("li");

    // 获取 span 元素（保存 savedUrls[i] 的值）
    var urlSpan = listItem.querySelector("span");

    // 获取按钮上的索引
    var index = parseInt(target.dataset.index, 10);

    // 获取 span 元素中的内容（即 savedUrls[i]）
    var url = urlSpan.textContent.trim();
    // 删除的URL是: ${url}

    // 执行删除操作
    deleteUrl(index, url);
  }
});
