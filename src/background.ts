// 基于标签页的录制状态管理
const tabRecordingStates = new Map<number, boolean>();
let currentActiveTabId: number | null = null;

// 初始化录制状态
function initializeRecordingState() {
    console.log('Background script initialized');
    
    // 获取当前活跃标签页
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
            currentActiveTabId = tabs[0].id;
            console.log('Current active tab:', currentActiveTabId);
            // 确保当前标签页的录制状态为关闭
            tabRecordingStates.set(currentActiveTabId, false);
            updateRequestRules(false);
        }
    });
}

// 立即初始化
initializeRecordingState();

// 监听扩展安装/启动事件
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started');
    initializeRecordingState();
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    initializeRecordingState();
});

// 监听标签页切换事件
chrome.tabs.onActivated.addListener((activeInfo) => {
    const newTabId = activeInfo.tabId;
    console.log('Tab switched to:', newTabId);
    
    currentActiveTabId = newTabId;
    
    // 获取新标签页的录制状态，默认为关闭
    const isRecording = tabRecordingStates.get(newTabId) || false;
    console.log('Recording state for tab', newTabId, ':', isRecording);
    
    // 更新规则以反映当前标签页的录制状态
    updateRequestRules(isRecording);
});

// 监听标签页关闭事件，清理状态
chrome.tabs.onRemoved.addListener((tabId) => {
    console.log('Tab closed:', tabId);
    tabRecordingStates.delete(tabId);
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_RECORDING') {
        // 获取当前活跃标签页
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].id) {
                const tabId = tabs[0].id;
                currentActiveTabId = tabId;
                
                // 更新当前标签页的录制状态
                tabRecordingStates.set(tabId, message.enabled);
                console.log('Recording state updated for tab', tabId, ':', message.enabled);
                
                // 更新declarativeNetRequest规则
                updateRequestRules(message.enabled);
                
                sendResponse({ success: true, recordingEnabled: message.enabled, tabId: tabId });
            } else {
                sendResponse({ success: false, error: 'No active tab found' });
            }
        });
        return true;
    }
    
    if (message.type === 'GET_DECLARATIVE_RULES') {
        // 获取当前的declarativeNetRequest规则
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
            console.log('Current declarativeNetRequest rules:', rules);
            sendResponse({ rules: rules });
        });
        return true;
    }
    
    if (message.type === 'GET_RECORDING_STATUS') {
        // 获取当前活跃标签页的录制状态
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].id) {
                const tabId = tabs[0].id;
                const isRecording = tabRecordingStates.get(tabId) || false;
                console.log('Popup requesting recording status for tab', tabId, ':', isRecording);
                sendResponse({ recordingEnabled: isRecording, tabId: tabId });
            } else {
                console.log('No active tab found, returning default false');
                sendResponse({ recordingEnabled: false });
            }
        });
        return true;
    }
    
    // 处理原有的请求逻辑
    handleRequest(message, sender, sendResponse);
    return true;
});

// 使用declarativeNetRequest API管理请求头
const RULE_ID = 1;

// 更新浏览器插件图标
function updateExtensionIcon(enabled: boolean) {
    const iconPath = enabled ? 'logo-128.png' : 'logo-128-gray.png';
    console.log('Updating extension icon to:', iconPath);
    
    chrome.action.setIcon({
        path: iconPath
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error updating icon:', chrome.runtime.lastError);
        } else {
            console.log('Successfully updated icon to:', iconPath);
        }
    });
}

// 更新declarativeNetRequest规则
function updateRequestRules(enabled: boolean) {
    console.log('Updating declarativeNetRequest rules, recording enabled:', enabled);
    
    // 同时更新扩展图标
    updateExtensionIcon(enabled);
    
    if (enabled) {
        // 添加规则来添加arex-force-record头
        const rule = {
            id: RULE_ID,
            priority: 1,
            action: {
                type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
                requestHeaders: [{
                    header: 'arex-force-record',
                    operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
                    value: 'true'
                }]
            },
            condition: {
                 urlFilter: '*',
                 resourceTypes: [
                     'xmlhttprequest' as chrome.declarativeNetRequest.ResourceType,
                     'main_frame' as chrome.declarativeNetRequest.ResourceType,
                     'sub_frame' as chrome.declarativeNetRequest.ResourceType
                 ]
             }
        };
        
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [RULE_ID],
            addRules: [rule]
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error adding rule:', chrome.runtime.lastError);
            } else {
                console.log('Successfully added arex-force-record header rule');
            }
        });
    } else {
        // 移除规则
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [RULE_ID]
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error removing rule:', chrome.runtime.lastError);
            } else {
                console.log('Successfully removed arex-force-record header rule');
            }
        });
    }
}



// 处理原有请求的函数
function handleRequest(req: any, sender: any, sendResponse: any) {
class Payload {
    constructor(payload:any) {
        this.payload = payload
    }
    payload:{
        url:string,
        method:string
        data:any
        headers:{key:string,value:string}[]
        params:{key:string,value:string}[]
    }
    base64ToBinary(base64:any) {
        const raw = atob(base64);
        const binary = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
            binary[i] = raw.charCodeAt(i);
        }
        return binary;
    }
    static blobToBase64(blob:any) {
        return new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }
    getUrlAndRequestInit():{url:string,requestInit:any}{
        return {
            url:this.handleUrl(this.payload.url,this.payload.params),
            requestInit:this.getRequestInit(this.payload)
        }
    }
    handleUrl(url:any,params:any){
        return url + Object.keys(params||{}).map(i=>({key:i,value:params[i]})).reduce((p:any,c:any)=>{return p+'&'+c.key+'='+c.value},'?')
    }
    getRequestInit(p:any){
        if (p.method === 'GET'){
            return {
                method:p.method,
                headers:p.headers
            }
        } else {
            return {
                method:p.method,
                headers:p.headers,
                body:this.handleData(p.data),
            }
        }
    }

    handleData(data:any) {
        if (Payload.isBase64(data||'')){
            return this.base64ToBinary(data)
        } else {
            return this.chulidata(data)
        }
    }
    chulidata(data: any) {
        if (typeof data === 'object') {
            return JSON.stringify(data);
        } else {
            return data;
        }
    }
    static isBase64(str:any){
        if(str === ''){
            return false;
        }
        try{
            return btoa(atob(str)) === str;
        }catch(err){
            return false;
        }
    }
}

function isJSONString(str:string) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

    const {url,requestInit} = new Payload(req.payload).getUrlAndRequestInit()
    const cookieArr = handleCookie(req.payload.headers.cookie||req.payload.headers.Cookie,req.payload.url)
    Promise.all(cookieArr.map(i=>{
        try {
            chrome.cookies.set(i)
        } catch (e) {
            console.log(e)
        }
    })).then(async (_) => {
        try {
            const response = await fetch(url,requestInit)
            const headers = handleResHeaders(response.headers)
            const status = response.status

            if (Payload.isBase64(req.payload.data||'')){
                const data = await response.blob()
                const base64Data = await Payload.blobToBase64(data)
                sendResponse({
                    data:base64Data,
                    status,
                    headers
                })
            } else {
                const data = await response.text()
                if (isJSONString(data)){
                    sendResponse({
                        data:JSON.parse(data),
                        status,
                        headers
                    })
                } else {
                    sendResponse({
                        data:data,
                        status,
                        headers
                    })
                }

            }
        } catch (err:any) {
            if (err.message && err.name) {
                sendResponse({
                    type: 'error',
                    cause: err.cause,
                    message: err.message,
                    name: err.name,
                    stack: err.stack
                })
            } else {
                sendResponse({
                    data: err.data,
                    status: err.status,
                    headers: handleResHeaders(err.headers)
                })
            }
        }
    })
}

// @ts-ignore
function cookieToJson(ck:any) {
    let cookieArr = ck.split(';')
    let obj = {}
    cookieArr.forEach((i:any) => {
        let arr = i.split("=");
        // @ts-ignore
        obj[arr[0]] = arr[1];
    });
    return obj
}
// @ts-ignore
function handleCookie(cookie:any,url:any) {
    try {
        const j = cookieToJson(cookie.replace(/\s+/g,''))
        return Object.keys(j).map(k => {
            // @ts-ignore

            return ({
                url: url,
                name: k,
                // @ts-ignore
                value: j[k],
                path: '/'
            })
        })
    } catch (e) {
        return []
    }
}

// @ts-ignore
function handleResHeaders(headers:any) {
    const newHeaders:any = []
    headers.forEach((v:any,k:any)=>{
        newHeaders.push({
            key:k,
            value:v
        })
    })
    return newHeaders
}
