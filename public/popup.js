// 获取DOM元素
const recordSwitch = document.getElementById('recordSwitch');
const status = document.getElementById('status');

// 初始化状态 - 从background script获取当前标签页的录制状态
chrome.runtime.sendMessage({type: 'GET_RECORDING_STATUS'}, (response) => {
  const isEnabled = response && response.recordingEnabled ? response.recordingEnabled : false;
  const tabId = response && response.tabId ? response.tabId : 'unknown';
  recordSwitch.checked = isEnabled;
  updateStatus(isEnabled, tabId);
  console.log('Popup initialized with recording status for tab', tabId, ':', isEnabled);
});

// 监听开关变化
recordSwitch.addEventListener('change', (event) => {
  const isEnabled = event.target.checked;
  
  // 发送消息到background script更新当前标签页的录制状态
  chrome.runtime.sendMessage({
    type: 'TOGGLE_RECORDING',
    enabled: isEnabled
  }, (response) => {
    if (response && response.success) {
      const tabId = response.tabId || 'unknown';
      console.log('Recording state updated successfully for tab', tabId, ':', response.recordingEnabled);
      updateStatus(response.recordingEnabled, tabId);
    } else {
      console.error('Failed to update recording state:', response.error || 'Unknown error');
      // 如果失败，恢复开关状态
      recordSwitch.checked = !isEnabled;
    }
  });
});

// 更新状态显示
function updateStatus(isEnabled, tabId) {
  if (isEnabled) {
    status.textContent = `录制已开启 (标签页 ${tabId})`;
    status.className = 'status enabled';
  } else {
    status.textContent = `录制已关闭 (标签页 ${tabId})`;
    status.className = 'status disabled';
  }
}