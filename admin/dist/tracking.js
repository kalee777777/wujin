// 访问统计埋点脚本
(function() {
    'use strict';
    
    const API_BASE = '/api';
    
    // 获取页面类型
    function getPageType() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') {
            return 'home';
        } else if (path.includes('/product-detail.html')) {
            return 'product';
        } else if (path.includes('/products.html')) {
            return 'products';
        } else if (path.includes('/about.html')) {
            return 'about';
        } else if (path.includes('/contact.html')) {
            return 'contact';
        } else if (path.includes('/industry.html')) {
            return 'industry';
        } else if (path.includes('/factory.html')) {
            return 'factory';
        } else if (path.includes('/services.html')) {
            return 'services';
        } else if (path.includes('/resources.html')) {
            return 'resources';
        }
        
        return 'other';
    }
    
    // 获取页面ID
    function getPageId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || urlParams.get('product') || null;
    }
    
    // 发送访问日志
    function sendVisitLog() {
        const data = {
            page_type: getPageType(),
            page_id: getPageId() ? parseInt(getPageId()) : null,
            page_url: window.location.href,
            referer: document.referrer || null
        };
        
        // 使用 sendBeacon 确保在页面关闭时也能发送
        if (navigator.sendBeacon) {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== null) {
                    formData.append(key, data[key]);
                }
            });
            navigator.sendBeacon(`${API_BASE}/stats/log`, formData);
        } else {
            // 降级使用 fetch
            fetch(`${API_BASE}/stats/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(() => {});
        }
    }
    
    // 页面加载完成后发送
    if (document.readyState === 'complete') {
        sendVisitLog();
    } else {
        window.addEventListener('load', sendVisitLog);
    }
})();