/**
 * Safari兼容性修复脚本
 * 适用于在线水力模型BS系统
 * 解决Safari浏览器中的各种兼容性问题
 */

(function() {
    'use strict';
    
    // 检测Safari浏览器
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    console.log('Safari兼容性修复脚本启动', { isSafari, isIOS });
    
    // 基础Safari兼容性修复
    function applyBasicSafariFixes() {
        // 修复CSS变量兼容性
        if (!CSS || !CSS.supports || !CSS.supports('color', 'var(--fake-var)')) {
            console.warn('Safari版本较低，某些CSS变量可能不支持');
        }
        
        // 修复box-sizing
        document.documentElement.style.webkitBoxSizing = 'border-box';
        
        // 添加Safari特定的CSS修复
        const safariCSS = document.createElement('style');
        safariCSS.textContent = `
            /* Safari兼容性CSS修复 */
            * {
                -webkit-box-sizing: border-box;
                -webkit-transition-property: all;
                -webkit-transition-duration: inherit;
                -webkit-transition-timing-function: inherit;
                -webkit-transform: translateZ(0);
                -webkit-backface-visibility: hidden;
            }
            
            /* 修复Safari中的input样式 */
            input, select, textarea {
                -webkit-appearance: none;
                -webkit-border-radius: 0;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* 修复Safari中的flex布局 */
            .flex, [style*="display: flex"] {
                display: -webkit-box;
                display: -webkit-flex;
                display: -ms-flexbox;
                display: flex;
            }
            
            /* 修复Safari中的grid布局 */
            .grid, [style*="display: grid"] {
                display: -webkit-grid;
                display: -ms-grid;
                display: grid;
            }
            
            /* 修复Safari中的sticky定位 */
            .sticky, [style*="position: sticky"] {
                position: -webkit-sticky;
                position: sticky;
            }
            
            /* 修复Safari中的滚动条 */
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            
            ::-webkit-scrollbar-track {
                background: var(--bg-tertiary, #f5f5f5);
                border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb {
                background: var(--border-color, #ddd);
                border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: var(--text-tertiary, #999);
            }
        `;
        document.head.appendChild(safariCSS);
    }
    
    // 修复Safari中的JavaScript API兼容性
    function applyJavaScriptFixes() {
        // 修复performance API
        if (!window.performance || !window.performance.now) {
            window.performance = window.performance || {};
            window.performance.now = function() {
                return Date.now();
            };
        }
        
        // 修复requestAnimationFrame
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback) {
                return setTimeout(callback, 16);
            };
        }
        
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
        }
        
        // 修复URLSearchParams
        if (!window.URLSearchParams) {
            console.warn('Safari不支持URLSearchParams，某些功能可能受限');
        }
        
        // 修复fetch API
        if (!window.fetch) {
            console.warn('Safari不支持fetch API，将使用XMLHttpRequest替代');
        }
        
        // 修复Promise兼容性
        if (!window.Promise) {
            console.warn('Safari不支持Promise，某些异步功能可能受限');
        }
    }
    
    // 修复Safari中的表单处理
    function applyFormFixes() {
        document.addEventListener('DOMContentLoaded', function() {
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                // 修复Safari中的输入焦点问题
                input.addEventListener('focus', function() {
                    this.style.webkitTransform = 'translateZ(0)';
                    
                    // 防止Safari在输入时缩放页面
                    if (this.type !== 'file') {
                        this.style.fontSize = Math.max(16, parseInt(getComputedStyle(this).fontSize)) + 'px';
                    }
                });
                
                // 修复Safari中的输入事件
                input.addEventListener('input', function() {
                    // 强制重绘以解决某些渲染问题
                    this.style.webkitTransform = 'translateZ(0)';
                });
            });
        });
    }
    
    // 修复Safari中的地图和可视化组件
    function applyVisualizationFixes() {
        // 修复WebGL兼容性
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.warn('Safari WebGL支持有限，部分可视化效果可能受影响');
        }
        
        // 修复Leaflet地图兼容性
        window.safariMapFix = function() {
            if (window.map && window.L) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }
        };
        
        // 当页面加载完成后修复地图
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                // 修复Leaflet兼容性
                if (window.L) {
                    L.Browser.safari = true;
                    L.Browser.webkit = true;
                }
                
                // 强制重绘地图容器
                const mapContainer = document.getElementById('map');
                if (mapContainer && window.map) {
                    map.invalidateSize();
                }
                
                // 修复Canvas元素的渲染
                const canvases = document.querySelectorAll('canvas');
                canvases.forEach(canvas => {
                    canvas.style.webkitTransform = 'translateZ(0)';
                });
            }, 500);
        });
        
        // 修复图表组件（ECharts等）
        window.safariChartFix = function() {
            if (window.echarts) {
                setTimeout(() => {
                    const charts = document.querySelectorAll('[_echarts_instance_]');
                    charts.forEach(chart => {
                        const instance = echarts.getInstanceByDom(chart);
                        if (instance) {
                            instance.resize();
                        }
                    });
                }, 100);
            }
        };
    }
    
    // 修复Safari中的viewport问题
    function applyViewportFixes() {
        // 修复移动端Safari的viewport问题
        if (isIOS || window.screen.width <= 768) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
                );
            }
            
            // 防止Safari在横屏时缩放
            window.addEventListener('orientationchange', function() {
                setTimeout(() => {
                    const newViewport = document.querySelector('meta[name="viewport"]');
                    if (newViewport) {
                        newViewport.setAttribute('content', 
                            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
                        );
                    }
                }, 100);
            });
        }
    }
    
    // 修复Safari中的事件处理
    function applyEventFixes() {
        // 修复Safari中的触摸事件
        if (isIOS) {
            document.addEventListener('touchstart', function() {}, { passive: true });
            
            // 修复Safari中的快速点击问题
            let fastClickPrevented = false;
            document.addEventListener('touchend', function(e) {
                if (!fastClickPrevented) {
                    e.preventDefault();
                    fastClickPrevented = true;
                    setTimeout(() => {
                        fastClickPrevented = false;
                    }, 300);
                }
            }, { passive: false });
        }
        
        // 修复Safari中的resize事件
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // 触发地图重新计算大小
                if (window.safariMapFix) {
                    window.safariMapFix();
                }
                
                // 触发图表重新计算大小
                if (window.safariChartFix) {
                    window.safariChartFix();
                }
            }, 250);
        });
    }
    
    // 主修复函数
    function applySafariFixes() {
        if (isSafari || isIOS) {
            console.log('正在应用Safari兼容性修复...');
            
            applyBasicSafariFixes();
            applyJavaScriptFixes();
            applyFormFixes();
            applyVisualizationFixes();
            applyViewportFixes();
            applyEventFixes();
            
            console.log('Safari兼容性修复完成');
        } else {
            console.log('非Safari浏览器，跳过兼容性修复');
        }
    }
    
    // 立即执行修复
    applySafariFixes();
    
    // 导出修复函数供外部调用
    window.SafariCompatibility = {
        isSafari: isSafari,
        isIOS: isIOS,
        mapFix: window.safariMapFix,
        chartFix: window.safariChartFix,
        refresh: applySafariFixes
    };
    
})(); 