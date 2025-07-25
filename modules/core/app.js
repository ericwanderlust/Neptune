/**
 * 🚀 智慧水务监测系统 - 主应用入口
 * 统一的初始化接口，模块生命周期管理
 */

(function(global) {
    'use strict';

    const App = {
        version: '3.0.0',
        modules: new Map(),
        initialized: false,
        debug: true,

        /**
         * 🎯 应用初始化入口
         * @param {Object} config - 配置参数
         */
        async init(config = {}) {
            try {
                this.log('🚀 智慧水务监测系统 v3.0 启动中...');
                
                // 1. 保护用户状态
                this.protectUserState();
                
                // 2. 初始化事件总线
                await this.initModule('EventBus', 'modules/core/eventBus.js');
                
                // 3. 加载配置
                await this.loadConfigs();
                
                // 4. 初始化地图管理器
                await this.initModule('MapManager', 'modules/core/mapManager.js');
                
                // 5. 初始化数据加载器
                await this.initModule('DataLoader', 'modules/core/dataLoader.js');
                
                // 6. 初始化可视化模块
                await this.initVisualizationModules();
                
                // 7. 初始化控制模块
                await this.initControlModules();
                
                // 8. 初始化面板模块
                await this.initPanelModules();
                
                // 9. 加载数据并渲染
                await this.loadAndRender();
                
                // 10. 启动自动刷新
                this.startAutoRefresh();
                
                this.initialized = true;
                this.log('✅ 系统初始化完成！');
                
                // 触发初始化完成事件
                const eventBus = this.getModule('EventBus');
                if (eventBus && typeof eventBus.emit === 'function') {
                    eventBus.emit('app:ready');
                }
                
                // 隐藏加载界面
                setTimeout(() => {
                    this.hideLoadingScreen();
                }, 500);
                
            } catch (error) {
                this.error('❌ 系统初始化失败:', error);
                throw error;
            }
        },

        /**
         * 📦 模块管理器
         */
        async initModule(name, path) {
            try {
                this.log(`📦 加载模块: ${name}`);
                
                // 动态加载模块
                if (!global[name]) {
                    await this.loadScript(path);
                }
                
                const module = global[name];
                if (!module) {
                    console.warn(`模块 ${name} 未找到，跳过初始化`);
                    return;
                }
                
                // 初始化模块
                if (typeof module.init === 'function') {
                    await module.init();
                }
                
                this.modules.set(name, module);
                this.log(`✅ 模块 ${name} 加载完成`);
                
            } catch (error) {
                this.error(`❌ 模块 ${name} 加载失败:`, error);
                // 不再抛出错误，允许其他模块继续加载
                console.warn(`跳过模块 ${name}，继续加载其他模块`);
            }
        },

        /**
         * 🔧 动态脚本加载器
         */
        loadScript(src) {
            return new Promise((resolve, reject) => {
                // 检查是否已加载
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                document.head.appendChild(script);
            });
        },

        /**
         * ⚙️ 加载配置文件
         */
        async loadConfigs() {
            try {
                await Promise.all([
                    this.loadScript('config/mapConfig.js'),
                    this.loadScript('config/themeConfig.js'),
                    this.loadScript('config/facilityConfig.js')
                ]);
                this.log('⚙️ 配置文件加载完成');
            } catch (error) {
                this.error('❌ 配置文件加载失败:', error);
            }
        },

        /**
         * 🎨 初始化可视化模块
         */
        async initVisualizationModules() {
            const modules = [
                ['RenderStyle', 'modules/visualization/renderStyle.js']
                // 其他模块将按需添加
            ];

            for (const [name, path] of modules) {
                await this.initModule(name, path);
            }
        },

        /**
         * 🎛️ 初始化控制模块
         */
        async initControlModules() {
            const modules = [
                ['LayerControl', 'modules/controls/layerControl.js'],
                ['SimPlayback', 'modules/controls/simPlayback.js']
                // 其他模块将按需添加
            ];

            for (const [name, path] of modules) {
                await this.initModule(name, path);
            }
        },

        /**
         * 📊 初始化面板模块
         */
        async initPanelModules() {
            // 暂时跳过面板模块，使用现有的面板系统
            console.log('[App] 跳过面板模块初始化，使用现有面板系统');
        },

        /**
         * 📊 加载数据并渲染
         */
        async loadAndRender() {
            try {
                this.log('📊 加载水力模型数据...');
                const dataLoader = this.getModule('DataLoader');
                if (dataLoader && typeof dataLoader.loadEPANETData === 'function') {
                    await dataLoader.loadEPANETData();
                } else {
                    console.warn('DataLoader模块不可用，跳过数据加载');
                }
                
                this.log('🎨 开始渲染地图...');
                const mapManager = this.getModule('MapManager');
                if (mapManager && typeof mapManager.render === 'function') {
                    mapManager.render();
                } else {
                    console.warn('MapManager模块不可用，跳过地图渲染');
                }
                
            } catch (error) {
                this.error('❌ 数据加载失败:', error);
                console.warn('将继续系统初始化');
            }
        },

        /**
         * ⏰ 启动自动刷新
         */
        startAutoRefresh() {
            const simPlayback = this.getModule('SimPlayback');
            if (simPlayback && typeof simPlayback.startStatusMonitoring === 'function') {
                simPlayback.startStatusMonitoring();
            } else {
                console.warn('SimPlayback模块不可用，跳过自动刷新');
            }
        },

        /**
         * 🔍 获取模块实例
         */
        getModule(name) {
            return this.modules.get(name);
        },

        /**
         * 🛡️ 保护用户状态
         */
        protectUserState() {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                global._protectedUserState = currentUser;
                this.log('🛡️ 用户状态已保护');
            }
        },

        /**
         * 📝 日志工具
         */
        log(...args) {
            if (this.debug) {
                console.log('[App]', ...args);
            }
        },

        error(...args) {
            console.error('[App]', ...args);
        },

        /**
         * 🚀 快捷启动方法
         */
        quickStart() {
            // 显示加载状态
            this.updateLoadingStatus('正在初始化智慧水务系统...');
            
            // 设置启动超时保护
            const startupTimeout = setTimeout(() => {
                console.warn('应用启动超时，切换到基础模式');
                this.updateLoadingStatus('启动超时，使用基础模式');
                this.basicStart();
            }, 3000);
            
            // 启动应用
            setTimeout(() => {
                this.init()
                    .then(() => {
                        clearTimeout(startupTimeout);
                        this.log('✅ 应用启动成功');
                    })
                    .catch(error => {
                        clearTimeout(startupTimeout);
                        console.error('应用启动失败:', error);
                        this.updateLoadingStatus('启动失败，使用基础模式');
                        
                        // 基础模式启动
                        setTimeout(() => {
                            this.basicStart();
                        }, 500);
                    });
            }, 100);
        },

        /**
         * 🛡️ 基础模式启动（回退方案）
         */
        basicStart() {
            try {
                console.log('启动基础模式...');
                
                // 基础地图初始化
                if (typeof L !== 'undefined') {
                    const map = L.map('map').setView([22.261, 114.246], 16);
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                        attribution: '© CARTO'
                    }).addTo(map);
                    
                    // 添加一个示例标记
                    L.marker([22.261, 114.246]).addTo(map)
                        .bindPopup('智慧水务监测系统<br>基础模式运行中');
                    
                    console.log('基础地图已加载');
                }
                
                // 隐藏加载界面
                setTimeout(() => {
                    this.hideLoadingScreen();
                }, 1000);
                
            } catch (error) {
                console.error('基础模式启动失败:', error);
                this.updateLoadingStatus('系统启动失败');
            }
        },

        /**
         * 📱 更新加载状态
         */
        updateLoadingStatus(message) {
            const statusEl = document.getElementById('loadingStatus');
            if (statusEl) {
                statusEl.textContent = message;
            }
            this.log(message);
        },

        /**
         * 🎯 隐藏加载界面
         */
        hideLoadingScreen() {
            const loadingEl = document.getElementById('loadingIndicator');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
        }
    };

    // 注册全局命名空间
    global.WaterSystemApp = App;
    global.App = App; // 简化访问

    // 全局错误处理
    window.addEventListener('error', (event) => {
        App.error('Global Error:', event.error);
        // 尝试恢复用户状态
        if (global._protectedUserState) {
            localStorage.setItem('currentUser', global._protectedUserState);
        }
    });

})(window); 