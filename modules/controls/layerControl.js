/**
 * 🎛️ 图层控制模块
 * 管理设备图层、属性图层的开关和过滤
 */

(function(global) {
    'use strict';

    const LayerControl = {
        // 图层状态
        layers: {
            // 设备图层
            facilities: {
                all: true,
                junction: true,
                pump_station: true,
                reservoir: true,
                tank: true,
                valve: true
            },
            // 监测点图层
            monitors: {
                all: false,
                primary: true,
                secondary: false
            },
            // 管道图层
            pipes: {
                all: true,
                main: true,
                secondary: true
            },
            // 属性图层
            themes: {
                current: 'pressure',
                available: ['pressure', 'head', 'elevation', 'demand', 'quality', 
                           'pipe_flow', 'pipe_diameter', 'pipe_velocity', 'pipe_headloss']
            }
        },

        // 过滤器状态
        filters: {
            alarmStatus: null, // null, 'normal', 'warning', 'critical'
            facilityType: 'all',
            monitorLevel: 'primary'
        },

        /**
         * 🎯 初始化图层控制
         */
        init() {
            console.log('[LayerControl] 🎛️ 图层控制模块初始化');
            
            this.createLayerControlUI();
            this.bindEvents();
            this.initializeLayerStates();
            
            return Promise.resolve();
        },

        /**
         * 🎨 创建图层控制UI
         */
        createLayerControlUI() {
            const leftPanel = document.getElementById('left-panel-content');
            if (!leftPanel) {
                console.warn('[LayerControl] 找不到左侧面板容器');
                return;
            }

            const layerControlHTML = `
                <div class="layer-control-panel">
                    <!-- 节点主题控制 -->
                    <div class="panel-section">
                        <div class="section-header" onclick="LayerControl.toggleSection(this)">
                            <i class="fas fa-palette"></i>
                            <span>节点主题</span>
                            <i class="fas fa-chevron-down toggle-icon"></i>
                        </div>
                        <div class="section-content" id="node-themes-section">
                            ${this.generateThemeMenuItems('node')}
                        </div>
                    </div>

                    <!-- 管道主题控制 -->
                    <div class="panel-section">
                        <div class="section-header collapsed" onclick="LayerControl.toggleSection(this)">
                            <i class="fas fa-road"></i>
                            <span>管道主题</span>
                            <i class="fas fa-chevron-down toggle-icon"></i>
                        </div>
                        <div class="section-content collapsed" id="pipe-themes-section">
                            ${this.generateThemeMenuItems('pipe')}
                        </div>
                    </div>

                    <!-- 设备图层控制 -->
                    <div class="panel-section">
                        <div class="section-header" onclick="LayerControl.toggleSection(this)">
                            <i class="fas fa-layer-group"></i>
                            <span>设备图层</span>
                            <i class="fas fa-chevron-down toggle-icon"></i>
                        </div>
                        <div class="section-content" id="facility-layers-section">
                            ${this.generateFacilityLayerItems()}
                        </div>
                    </div>

                    <!-- 监测点控制 -->
                    <div class="panel-section">
                        <div class="section-header collapsed" onclick="LayerControl.toggleSection(this)">
                            <i class="fas fa-satellite-dish"></i>
                            <span>监测点</span>
                            <i class="fas fa-chevron-down toggle-icon"></i>
                        </div>
                        <div class="section-content collapsed" id="monitor-section">
                            ${this.generateMonitorItems()}
                        </div>
                    </div>

                    <!-- 过滤器控制 -->
                    <div class="panel-section">
                        <div class="section-header collapsed" onclick="LayerControl.toggleSection(this)">
                            <i class="fas fa-filter"></i>
                            <span>状态过滤</span>
                            <i class="fas fa-chevron-down toggle-icon"></i>
                        </div>
                        <div class="section-content collapsed" id="filter-section">
                            ${this.generateFilterItems()}
                        </div>
                    </div>
                </div>
            `;

            // 添加样式
            this.addLayerControlStyles();
            
            // 插入HTML
            leftPanel.innerHTML = layerControlHTML;
        },

        /**
         * 🎨 生成主题菜单项
         */
        generateThemeMenuItems(type) {
            const themes = {
                node: [
                    { id: 'overview', icon: 'fa-map', name: '总览视图' },
                    { id: 'pressure', icon: 'fa-gauge-high', name: '压力分层' },
                    { id: 'elevation', icon: 'fa-mountain', name: '高程分层' },
                    { id: 'head', icon: 'fa-water', name: '总水头' },
                    { id: 'demand', icon: 'fa-tint', name: '需水量' },
                    { id: 'quality', icon: 'fa-flask', name: '水质分层' }
                ],
                pipe: [
                    { id: 'pipe_flow', icon: 'fa-stream', name: '管道流量' },
                    { id: 'pipe_flow_direction', icon: 'fa-long-arrow-alt-right', name: '流向' },
                    { id: 'pipe_diameter', icon: 'fa-circle', name: '管径分层' },
                    { id: 'pipe_velocity', icon: 'fa-tachometer-alt', name: '流速分层' },
                    { id: 'pipe_headloss', icon: 'fa-chart-line', name: '管损分层' }
                ]
            };

            return themes[type].map(theme => `
                <div class="layer-item theme-item" data-theme="${theme.id}" 
                     onclick="LayerControl.switchTheme('${theme.id}')">
                    <div class="layer-toggle">
                        <i class="fas ${theme.icon}"></i>
                        <span class="layer-name">${theme.name}</span>
                    </div>
                    <div class="layer-status">
                        <div class="status-dot"></div>
                    </div>
                </div>
            `).join('');
        },

        /**
         * 🏭 生成设备图层项
         */
        generateFacilityLayerItems() {
            const facilities = [
                { type: 'all', icon: 'fa-list', name: '全部设施', color: null },
                { type: 'pump_station', icon: 'fa-industry', name: '泵站', color: '#9b59b6' },
                { type: 'reservoir', icon: 'fa-water', name: '水库', color: '#2ecc71' },
                { type: 'tank', icon: 'fa-building', name: '水塔', color: '#e67e22' },
                { type: 'junction', icon: 'fa-circle', name: '节点', color: '#3498db' },
                { type: 'valve', icon: 'fa-adjust', name: '阀门', color: '#e74c3c' }
            ];

            return facilities.map(facility => `
                <div class="layer-item facility-item ${facility.type === 'all' ? 'active' : ''}" 
                     data-type="${facility.type}"
                     onclick="LayerControl.toggleFacilityLayer('${facility.type}')">
                    <div class="layer-toggle">
                        <i class="fas ${facility.icon}" ${facility.color ? `style="color: ${facility.color};"` : ''}></i>
                        <span class="layer-name">${facility.name}</span>
                    </div>
                    <div class="layer-status">
                        <div class="status-dot ${facility.type === 'all' ? 'active' : ''}"></div>
                    </div>
                </div>
            `).join('');
        },

        /**
         * 📡 生成监测点项
         */
        generateMonitorItems() {
            const monitors = [
                { level: 'primary', icon: 'fa-star', name: '主控点', color: '#FFD700' },
                { level: 'all', icon: 'fa-circle-dot', name: '全部监测点', color: null },
                { level: 'none', icon: 'fa-eye-slash', name: '隐藏监测点', color: null }
            ];

            return monitors.map(monitor => `
                <div class="layer-item monitor-item ${monitor.level === 'primary' ? 'active' : ''}" 
                     data-level="${monitor.level}"
                     onclick="LayerControl.toggleMonitorLevel('${monitor.level}')">
                    <div class="layer-toggle">
                        <i class="fas ${monitor.icon}" ${monitor.color ? `style="color: ${monitor.color};"` : ''}></i>
                        <span class="layer-name">${monitor.name}</span>
                    </div>
                    <div class="layer-status">
                        <div class="status-dot ${monitor.level === 'primary' ? 'active' : ''}"></div>
                    </div>
                </div>
            `).join('');
        },

        /**
         * 🔍 生成过滤器项
         */
        generateFilterItems() {
            const filters = [
                { status: null, icon: 'fa-list', name: '全部状态', color: null },
                { status: 'critical', icon: 'fa-exclamation-triangle', name: '严重报警', color: 'var(--status-error)' },
                { status: 'warning', icon: 'fa-exclamation-circle', name: '预警', color: 'var(--status-warn)' },
                { status: 'normal', icon: 'fa-check-circle', name: '正常', color: 'var(--status-ok)' }
            ];

            return filters.map(filter => `
                <div class="layer-item filter-item ${filter.status === null ? 'active' : ''}" 
                     data-status="${filter.status}"
                     onclick="LayerControl.toggleAlarmFilter('${filter.status}')">
                    <div class="layer-toggle">
                        <i class="fas ${filter.icon}" ${filter.color ? `style="color: ${filter.color};"` : ''}></i>
                        <span class="layer-name">${filter.name}</span>
                    </div>
                    <div class="layer-status">
                        <div class="status-dot ${filter.status === null ? 'active' : ''}"></div>
                    </div>
                </div>
            `).join('');
        },

        /**
         * 🎨 添加图层控制样式
         */
        addLayerControlStyles() {
            if (document.querySelector('#layer-control-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'layer-control-styles';
            style.textContent = `
                .layer-control-panel {
                    height: 100%;
                    overflow-y: auto;
                }
                
                .panel-section {
                    border-bottom: 1px solid var(--border-color);
                }
                
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    background: var(--bg-secondary);
                    cursor: pointer;
                    user-select: none;
                    transition: all 0.2s;
                    font-weight: 600;
                    font-size: 13px;
                }
                
                .section-header:hover {
                    background: #e8f4f8;
                }
                
                .section-header i:first-child {
                    color: var(--primary-color);
                }
                
                .toggle-icon {
                    margin-left: auto;
                    transition: transform 0.3s;
                    color: var(--text-muted);
                }
                
                .section-header.collapsed .toggle-icon {
                    transform: rotate(-90deg);
                }
                
                .section-content {
                    overflow: hidden;
                    max-height: 1000px;
                    transition: all 0.3s ease;
                }
                
                .section-content.collapsed {
                    max-height: 0;
                }
                
                .layer-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-left: 3px solid transparent;
                }
                
                .layer-item:hover {
                    background: var(--bg-secondary);
                }
                
                .layer-item.active {
                    background: #e8f4f8;
                    border-left-color: var(--primary-color);
                }
                
                .layer-toggle {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 12px;
                }
                
                .layer-name {
                    color: var(--text-primary);
                    font-weight: 500;
                }
                
                .layer-status {
                    display: flex;
                    align-items: center;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--text-muted);
                    opacity: 0.3;
                    transition: all 0.2s;
                }
                
                .status-dot.active {
                    background: var(--primary-color);
                    opacity: 1;
                    box-shadow: 0 0 6px rgba(74, 144, 184, 0.5);
                }
                
                .layer-item.disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }
                
                .layer-item.disabled .layer-name {
                    color: var(--text-muted);
                }
            `;
            
            document.head.appendChild(style);
        },

        /**
         * 🔗 绑定事件监听器
         */
        bindEvents() {
            // 事件代理已在生成HTML时通过onclick处理
            console.log('[LayerControl] 事件监听器已绑定');
        },

        /**
         * 🎯 初始化图层状态
         */
        initializeLayerStates() {
            // 设置默认主题
            this.switchTheme(this.layers.themes.current);
            
            // 设置默认监测点级别
            this.toggleMonitorLevel(this.filters.monitorLevel);
        },

        /**
         * 🔄 切换章节显示
         */
        toggleSection(header) {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.toggle-icon');
            
            if (content && icon) {
                header.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            }
        },

        /**
         * 🎨 切换地图主题
         */
        switchTheme(themeId) {
            console.log('[LayerControl] 🎨 切换主题:', themeId);
            
            this.layers.themes.current = themeId;
            
            // 更新UI状态
            document.querySelectorAll('.theme-item').forEach(item => {
                const isActive = item.dataset.theme === themeId;
                item.classList.toggle('active', isActive);
                item.querySelector('.status-dot').classList.toggle('active', isActive);
            });
            
            // 触发主题切换事件
            if (global.EventBus) {
                global.EventBus.emit('map:theme-changed', themeId);
            }
            
            // 兼容旧系统
            if (typeof switchMapTheme === 'function') {
                switchMapTheme(themeId);
            }
        },

        /**
         * 🏭 切换设备图层
         */
        toggleFacilityLayer(facilityType) {
            console.log('[LayerControl] 🏭 切换设备图层:', facilityType);
            
            this.filters.facilityType = facilityType;
            
            // 更新UI状态
            document.querySelectorAll('.facility-item').forEach(item => {
                const isActive = item.dataset.type === facilityType;
                item.classList.toggle('active', isActive);
                item.querySelector('.status-dot').classList.toggle('active', isActive);
            });
            
            // 触发过滤事件
            if (global.EventBus) {
                global.EventBus.emit('layer:facility-filter-changed', facilityType);
            }
            
            // 兼容旧系统
            if (typeof filterFacilities === 'function') {
                filterFacilities(facilityType);
            }
        },

        /**
         * 📡 切换监测点级别
         */
        toggleMonitorLevel(level) {
            console.log('[LayerControl] 📡 切换监测点级别:', level);
            
            this.filters.monitorLevel = level;
            
            // 更新UI状态
            document.querySelectorAll('.monitor-item').forEach(item => {
                const isActive = item.dataset.level === level;
                item.classList.toggle('active', isActive);
                item.querySelector('.status-dot').classList.toggle('active', isActive);
            });
            
            // 触发事件
            if (global.EventBus) {
                global.EventBus.emit('layer:monitor-level-changed', level);
            }
            
            // 兼容旧系统
            if (typeof toggleMonitors === 'function') {
                toggleMonitors(level);
            }
        },

        /**
         * 🚨 切换报警过滤器
         */
        toggleAlarmFilter(status) {
            console.log('[LayerControl] 🚨 切换报警过滤器:', status);
            
            this.filters.alarmStatus = status === 'null' ? null : status;
            
            // 更新UI状态
            document.querySelectorAll('.filter-item').forEach(item => {
                const isActive = item.dataset.status === String(status);
                item.classList.toggle('active', isActive);
                item.querySelector('.status-dot').classList.toggle('active', isActive);
            });
            
            // 触发事件
            if (global.EventBus) {
                global.EventBus.emit('layer:alarm-filter-changed', this.filters.alarmStatus);
            }
            
            // 兼容旧系统
            if (typeof filterByAlarm === 'function') {
                filterByAlarm(this.filters.alarmStatus);
            }
        },

        /**
         * 📊 获取当前图层状态
         */
        getLayerStates() {
            return {
                theme: this.layers.themes.current,
                facilityType: this.filters.facilityType,
                monitorLevel: this.filters.monitorLevel,
                alarmStatus: this.filters.alarmStatus
            };
        }
    };

    // 全局注册
    global.LayerControl = LayerControl;

})(window); 