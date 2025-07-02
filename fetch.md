# 开启录制注入代码
```js
// 避免重复注入拦截器
if (window.__fetchInterceptorAdded) {
  console.log('🚀 请求头拦截器已存在，无需重复注入');
  return;
}
window.__fetchInterceptorAdded = true;

// 保存原生 fetch 的引用
const originalFetch = window.fetch;

window.fetch = async function(input, init = {}) {
  // 处理请求头
  const headers = new Headers(init.headers || {});

  try {
    headers.set('arex-force-record', 'true');
    console.log('✅ Fetch 请求头已添加:', typeof input === 'string' ? input : input.url);
  } catch (error) {
    console.warn('⚠️ Fetch 请求头添加失败:', error.message);
  }

  // 创建新的 init 对象
  const newInit = {
    ...init,
    headers
  };

  // 调用原始 fetch
  return originalFetch(input, newInit);
};

console.log('🚀 请求头拦截器已注入，所有请求将携带 "arex-force-record: true"');
```