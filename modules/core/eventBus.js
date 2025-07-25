/**
 * 📡 事件总线 - 模块间通信系统
 * 提供发布-订阅模式的事件通信机制
 */

(function(global) {
    'use strict';

    const EventBus = {
        events: new Map(),
        debugEnabled: true,

        /**
         * 🎯 初始化事件总线
         */
        init() {
            this.log('📡 事件总线初始化');
            
            // 注册系统级事件监听器
            this.registerSystemEvents();
            
            return Promise.resolve();
        },

        /**
         * 📝 注册事件监听器
         * @param {string} event - 事件名称
         * @param {Function} callback - 回调函数
         * @param {Object} context - 上下文对象
         */
        on(event, callback, context = null) {
            if (!this.events.has(event)) {
                this.events.set(event, []);
            }
            
            this.events.get(event).push({
                callback,
                context,
                once: false
            });
            
            this.log(`📝 注册事件监听器: ${event}`);
        },

        /**
         * 📝 注册一次性事件监听器
         * @param {string} event - 事件名称
         * @param {Function} callback - 回调函数
         * @param {Object} context - 上下文对象
         */
        once(event, callback, context = null) {
            if (!this.events.has(event)) {
                this.events.set(event, []);
            }
            
            this.events.get(event).push({
                callback,
                context,
                once: true
            });
            
            this.log(`📝 注册一次性事件监听器: ${event}`);
        },

        /**
         * 🚀 触发事件
         * @param {string} event - 事件名称
         * @param {*} data - 事件数据
         */
        emit(event, data = null) {
            if (!this.events.has(event)) {
                return;
            }

            const listeners = this.events.get(event);
            const toRemove = [];

            this.log(`🚀 触发事件: ${event}`, data);

            listeners.forEach((listener, index) => {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data);
                    } else {
                        listener.callback(data);
                    }

                    if (listener.once) {
                        toRemove.push(index);
                    }
                } catch (error) {
                    console.error(`事件监听器执行错误 [${event}]:`, error);
                }
            });

            // 移除一次性监听器
            toRemove.reverse().forEach(index => {
                listeners.splice(index, 1);
            });
        },

        /**
         * 🗑️ 移除事件监听器
         * @param {string} event - 事件名称
         * @param {Function} callback - 要移除的回调函数
         */
        off(event, callback = null) {
            if (!this.events.has(event)) {
                return;
            }

            if (!callback) {
                // 移除所有监听器
                this.events.delete(event);
                this.log(`🗑️ 移除所有事件监听器: ${event}`);
                return;
            }

            const listeners = this.events.get(event);
            const filtered = listeners.filter(listener => listener.callback !== callback);
            
            if (filtered.length === 0) {
                this.events.delete(event);
            } else {
                this.events.set(event, filtered);
            }
            
            this.log(`🗑️ 移除事件监听器: ${event}`);
        },

        /**
         * 🔧 注册系统级事件
         */
        registerSystemEvents() {
            // 应用就绪事件
            this.on('app:ready', () => {
                console.log('🎉 应用已就绪！');
                // 隐藏加载界面
                setTimeout(() => {
                    const loadingEl = document.getElementById('loadingIndicator');
                    if (loadingEl) {
                        loadingEl.style.display = 'none';
                    }
                }, 500);
            });

            // 数据加载事件
            this.on('data:loaded', (data) => {
                this.log('📊 数据加载完成', data);
            });

            // 地图主题切换事件
            this.on('map:theme-changed', (theme) => {
                this.log('🎨 地图主题已切换:', theme);
            });

            // 设施选择事件
            this.on('facility:selected', (facility) => {
                this.log('🏭 设施已选择:', facility.id);
            });

            // 错误处理事件
            this.on('error', (error) => {
                console.error('💥 系统错误:', error);
            });

            // 模拟进度更新事件
            this.on('simulation:progress', (progress) => {
                this.log('⏱️ 模拟进度更新:', progress);
            });
        },

        /**
         * 📊 获取事件统计信息
         */
        getStats() {
            const stats = {
                totalEvents: this.events.size,
                events: {}
            };

            this.events.forEach((listeners, event) => {
                stats.events[event] = {
                    listenerCount: listeners.length,
                    onceListeners: listeners.filter(l => l.once).length
                };
            });

            return stats;
        },

        /**
         * 🧹 清理所有事件监听器
         */
        clear() {
            this.events.clear();
            this.log('🧹 已清理所有事件监听器');
        },

        /**
         * 📝 日志输出
         */
        log(...args) {
            if (this.debugEnabled) {
                console.log('[EventBus]', ...args);
            }
        }
    };

    // 全局注册
    global.EventBus = EventBus;

})(window); 