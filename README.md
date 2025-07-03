# AREX Chrome Extension

此插件可突破浏览器跨域限制，原理是通过postMessage把需要请求的函数交给插件的background处理。

## 安装方法

下载地址：[Release文件](https://git.kingdee.com/arex-plus/arex-chrome-extension/-/wikis/Release%E6%89%93%E5%8C%85%E6%96%87%E4%BB%B6)

## 开发

npm run build

## 发布

https://chrome.google.com/u/0/webstore/devconsole

# AREX Plus 扩展功能
## 开启关闭录制
点击插件图标，显示对话框。
对话框中包括开启录制switch按钮开关，默认关闭。
点击开启后，所有请求都会自动添加请求头 `arex-force-record: true`。
点击关闭后，所有请求都会自动移除请求头 `arex-force-record`。
