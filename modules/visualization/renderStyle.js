/**
 * 🎨 渲染样式模块 - 水力参数可视化
 * 负责节点和管道的颜色映射、尺寸控制、图例生成
 */

(function(global) {
    'use strict';

    const RenderStyle = {
        // 🎨 颜色方案配置
        colorSchemes: {
            // 节点颜色方案
            pressure: {
                name: '压力',
                unit: 'MPa',
                colors: ['#2ecc71', '#f1c40f', '#e74c3c'], // 绿→黄→红
                property: 'pressure'
            },
            head: {
                name: '总水头',
                unit: 'm',
                colors: ['#1abc9c', '#3498db', '#9b59b6'], // 青→蓝→紫
                property: 'head'
            },
            elevation: {
                name: '高程',
                unit: 'm',
                colors: ['#8b4513', '#daa520', '#32cd32'], // 棕→金→绿
                property: 'elevation'
            },
            demand: {
                name: '需水量',
                unit: 'L/s',
                type: 'size',
                property: 'demand',
                baseSize: 8,
                maxSize: 24
            },
            quality: {
                name: '余氯浓度',
                unit: 'mg/L',
                colors: ['#e74c3c', '#f1c40f', '#2ecc71'], // 红→黄→绿
                property: 'waterQuality.chlorine'
            },

            // 管道颜色方案
            pipe_flow: {
                name: '管道流量',
                unit: 'L/s',
                colors: ['#E3F2FD', '#2196F3', '#0D47A1'], // 浅蓝→蓝→深蓝
                property: 'flowRate',
                useAbsolute: true
            },
            pipe_diameter: {
                name: '管径',
                unit: 'mm',
                colors: ['#FFF3E0', '#FF9800', '#E65100'], // 浅橙→橙→深橙
                property: 'diameter'
            },
            pipe_velocity: {
                name: '流速',
                unit: 'm/s',
                colors: ['#E8F5E9', '#4CAF50', '#1B5E20'], // 浅绿→绿→深绿
                property: 'velocity'
            },
            pipe_headloss: {
                name: '水头损失',
                unit: 'm/km',
                colors: ['#FFEBEE', '#FF5722', '#BF360C'], // 浅红→红→深红
                property: 'headloss'
            },
            pipe_flow_direction: {
                name: '流向',
                type: 'direction',
                property: 'flowRate'
            }
        },

        // 当前主题
        currentTheme: 'pressure',
        
        // 数据范围缓存
        dataRanges: new Map(),

        /**
         * 🎯 初始化渲染样式模块
         */
        init() {
            console.log('[RenderStyle] 🎨 渲染样式模块初始化');
            
            // 监听主题切换事件
            if (global.EventBus) {
                global.EventBus.on('map:theme-changed', this.onThemeChanged.bind(this));
            }

            return Promise.resolve();
        },

        /**
         * 🔄 主题切换处理
         */
        onThemeChanged(theme) {
            this.currentTheme = theme;
            this.dataRanges.clear(); // 清除缓存
            console.log('[RenderStyle] 🔄 主题已切换:', theme);
        },

        /**
         * 🎨 获取节点样式
         * @param {Object} facility - 设施对象
         * @param {Array} allFacilities - 所有设施数据
         * @param {number} zoom - 缩放级别
         */
        getFacilityStyle(facility, allFacilities, zoom = 16) {
            const scheme = this.colorSchemes[this.currentTheme];
            const isMajor = this.isMajorFacility(facility);
            
            let style = {
                backgroundColor: this.getDefaultFacilityColor(facility.type),
                size: isMajor ? 20 : 12,
                fontSize: isMajor ? 10 : 6,
                opacity: 1,
                zIndex: this.getFacilityZIndex(facility)
            };

            if (!scheme) {
                return style;
            }

            // 根据主题类型处理样式
            if (scheme.type === 'size') {
                style = this.applySizeMapping(style, facility, allFacilities, scheme);
            } else {
                style = this.applyColorMapping(style, facility, allFacilities, scheme);
            }

            return style;
        },

        /**
         * 🎨 获取管道样式
         * @param {Object} pipe - 管道对象
         * @param {Array} allPipes - 所有管道数据
         */
        getPipelineStyle(pipe, allPipes) {
            const scheme = this.colorSchemes[this.currentTheme];
            
            let style = {
                color: '#4A90B8',
                weight: 3,
                opacity: 0.7
            };

            if (!scheme || !scheme.property.startsWith('pipe')) {
                return style;
            }

            // 根据主题类型处理样式
            switch (scheme.type) {
                case 'direction':
                    style = this.applyDirectionMapping(style, pipe, scheme);
                    break;
                default:
                    style = this.applyPipeColorMapping(style, pipe, allPipes, scheme);
                    break;
            }

            return style;
        },

        /**
         * 🎨 应用颜色映射
         */
        applyColorMapping(style, facility, allFacilities, scheme) {
            const value = this.getPropertyValue(facility, scheme.property);
            if (value === null || value === undefined) {
                return style;
            }

            const range = this.getDataRange(allFacilities, scheme.property);
            const color = this.getColorForValue(value, range.min, range.max, scheme.colors);
            
            style.backgroundColor = color;
            return style;
        },

        /**
         * 📏 应用尺寸映射（需水量）
         */
        applySizeMapping(style, facility, allFacilities, scheme) {
            const value = this.getPropertyValue(facility, scheme.property);
            if (value === null || value === undefined || value <= 0) {
                return style;
            }

            const range = this.getDataRange(allFacilities, scheme.property);
            const ratio = Math.min(1, (value - range.min) / (range.max - range.min));
            
            const isMajor = this.isMajorFacility(facility);
            const baseSize = isMajor ? 16 : scheme.baseSize;
            const maxSize = isMajor ? scheme.maxSize + 8 : scheme.maxSize;
            
            style.size = baseSize + (maxSize - baseSize) * ratio;
            return style;
        },

        /**
         * 🎨 应用管道颜色映射
         */
        applyPipeColorMapping(style, pipe, allPipes, scheme) {
            let value = this.getPropertyValue(pipe, scheme.property.replace('pipe_', ''));
            
            if (value === null || value === undefined) {
                return style;
            }

            // 对流量使用绝对值
            if (scheme.useAbsolute) {
                value = Math.abs(value);
            }

            const range = this.getDataRange(allPipes, scheme.property.replace('pipe_', ''));
            const color = this.getColorForValue(value, range.min, range.max, scheme.colors);
            
            // 根据数值调整线宽
            const ratio = (value - range.min) / (range.max - range.min);
            style.color = color;
            style.weight = 2 + ratio * 6; // 2-8px
            
            return style;
        },

        /**
         * ➡️ 应用流向映射
         */
        applyDirectionMapping(style, pipe, scheme) {
            const flowRate = this.getPropertyValue(pipe, 'flowRate');
            
            if (flowRate > 0) {
                style.color = '#2196F3'; // 正向 - 蓝色
            } else if (flowRate < 0) {
                style.color = '#e74c3c'; // 反向 - 红色
            } else {
                style.color = '#9E9E9E'; // 无流量 - 灰色
                style.opacity = 0.3;
            }
            
            return style;
        },

        /**
         * 📊 获取数据范围（P15-P85，避免异常值）
         */
        getDataRange(data, property) {
            const cacheKey = `${property}_${data.length}`;
            
            if (this.dataRanges.has(cacheKey)) {
                return this.dataRanges.get(cacheKey);
            }

            const values = data.map(item => this.getPropertyValue(item, property))
                .filter(v => v !== null && v !== undefined && !isNaN(v))
                .map(v => property.includes('flow') ? Math.abs(v) : v) // 流量用绝对值
                .sort((a, b) => a - b);

            if (values.length === 0) {
                return { min: 0, max: 1 };
            }

            // 使用P15-P85范围，避免异常值影响
            const p15Index = Math.floor(values.length * 0.15);
            const p85Index = Math.floor(values.length * 0.85);
            
            const range = {
                min: values[p15Index],
                max: values[p85Index] || values[values.length - 1]
            };

            this.dataRanges.set(cacheKey, range);
            return range;
        },

        /**
         * 🎨 根据数值获取颜色
         */
        getColorForValue(value, min, max, colors) {
            if (max === min) return colors[0];
            
            const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
            const index = Math.min(colors.length - 1, Math.floor(ratio * colors.length));
            
            return colors[index];
        },

        /**
         * 🔍 获取属性值（支持嵌套属性）
         */
        getPropertyValue(obj, property) {
            if (!property || !obj) return null;
            
            return property.split('.').reduce((o, p) => o && o[p], obj);
        },

        /**
         * 🏭 判断是否为主要设施
         */
        isMajorFacility(facility) {
            return ['reservoir', 'tank', 'pump_station'].includes(facility.type);
        },

        /**
         * 📏 获取设施z-index层级
         */
        getFacilityZIndex(facility) {
            if (this.isMajorFacility(facility)) return 1000;
            if (facility.isMonitor) return 800;
            if (facility.type === 'valve') return 500;
            return 100;
        },

        /**
         * 🎨 获取默认设施颜色
         */
        getDefaultFacilityColor(type) {
            const colors = {
                junction: '#3498db',
                reservoir: '#2ecc71',
                tank: '#ff8c00',
                pump_station: '#9b59b6',
                valve: '#e74c3c'
            };
            return colors[type] || '#95a5a6';
        },

        /**
         * 📊 生成图例数据
         */
        generateLegendData(theme = null) {
            const currentTheme = theme || this.currentTheme;
            const scheme = this.colorSchemes[currentTheme];
            
            if (!scheme) {
                return null;
            }

            const legendData = {
                title: `${scheme.name} (${scheme.unit})`,
                type: scheme.type || 'color',
                colors: scheme.colors || [],
                range: null
            };

            // 对于颜色图例，需要数据范围
            if (legendData.type === 'color' && scheme.colors) {
                // 这里需要从全局数据获取范围，暂时使用示例值
                legendData.range = { min: 0, max: 1 };
            }

            return legendData;
        },

        /**
         * 📝 日志输出
         */
        log(...args) {
            console.log('[RenderStyle]', ...args);
        }
    };

    // 全局注册
    global.RenderStyle = RenderStyle;

})(window); 