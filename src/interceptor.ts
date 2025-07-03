// @ts-ignore
window.__AREX_EXTENSION_INSTALLED__ = true
// @ts-ignore
window.__AREX_EXTENSION_VERSION__ = '0.0.1'
// @ts-ignore
window.__AREX_RECORDING_ENABLED__ = false

// 监听录制状态变化
window.addEventListener('message', (event) => {
    if (event.data.type === '__AREX_RECORDING_STATUS_CHANGED__') {
        // @ts-ignore
        window.__AREX_RECORDING_ENABLED__ = event.data.enabled;
        console.log('Arex录制状态已更新:', event.data.enabled ? '开启' : '关闭');
    }
});

// 初始化时获取录制状态
chrome.storage?.local?.get(['recordingEnabled'], (result) => {
    // @ts-ignore
    window.__AREX_RECORDING_ENABLED__ = result.recordingEnabled || false;
});
