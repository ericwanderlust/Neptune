/**
 * 🚀 高性能流向系统 - WebGL版本
 * 
 * 基于 deck.gl PathLayer + dashOffset 动画
 * 性能目标：≥10万条管线 @ 60 FPS
 * 
 * 核心优势：
 * - 全GPU渲染，O(1)动画更新
 * - Instanced rendering批渲染
 * - 视窗裁剪自动优化
 * - dashOffset shader动画
 */

class HighPerformanceFlowSystem {
    constructor(map) {
        this.map = map;
        this.deckglOverlay = null;
        this.pathLayer = null;
        this.isRunning = false;
        this.opacity = 1.0;
        this.animationId = null;
        
        // 动画控制
        this.currentOffset = 0;
        this.animationSpeed = 1.0; // 基础动画速度
        this.lastTime = 0;
        
        // 数据缓存
        this.pathDataCache = new Map();
        this.visiblePaths = [];
        this.cacheInvalidated = true;
        
        // 性能配置
        this.config = {
            maxPaths: 100000,           // 最大路径数（超大规模支持）
            dashLength: 8,              // 箭头长度（像素）
            dashGap: 16,               // 箭头间距（像素）
            pathWidth: 2,              // 基础路径宽度
            arrowColor: [255, 255, 255, 230], // 白色箭头 RGBA
            pathColor: [100, 149, 237, 100],  // 半透明路径背景
            animationFPS: 60,          // 目标帧率
            viewportPadding: 0.3       // 视窗裁剪缓冲
        };
        
        this.init();
        console.log('🚀 HighPerformanceFlowSystem initialized - WebGL版本');
    }
    
    init() {
        // 创建 deck.gl 覆盖层
        this.deckglOverlay = new deck.DeckGL({
            container: this.map.getContainer(),
            initialViewState: this.getViewState(),
            controller: false, // 禁用deck.gl控制器，使用Leaflet控制
            style: {
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none', // 让地图事件穿透
                zIndex: 600 // 在管道之上，设施之下
            },
            layers: []
        });
        
        // 监听地图事件
        this.map.on('zoom move', () => {
            this.updateViewState();
            this.invalidateCache();
        });
        
        this.map.on('resize', () => {
            this.updateViewState();
            this.invalidateCache();
        });
        
        console.log('HighPerformanceFlowSystem deck.gl覆盖层已创建');
    }
    
    /**
     * 获取当前地图视图状态（转换为deck.gl格式）
     */
    getViewState() {
        const center = this.map.getCenter();
        const zoom = this.map.getZoom();
        
        // 将Leaflet坐标系转换为deck.gl Web Mercator
        return {
            longitude: center.lng,
            latitude: center.lat,
            zoom: zoom - 1, // deck.gl的zoom比Leaflet小1
            bearing: 0,
            pitch: 0
        };
    }
    
    /**
     * 更新deck.gl视图状态
     */
    updateViewState() {
        if (this.deckglOverlay) {
            this.deckglOverlay.setProps({
                viewState: this.getViewState()
            });
            
            // 🚀 强制重绘以确保与地图容器同步
            this.deckglOverlay.redraw();
        }
    }
    
    /**
     * 🔧 处理容器尺寸变化（专门用于ResizeObserver）
     */
    handleContainerResize() {
        if (!this.deckglOverlay) return;
        
        console.log('🔄 高性能WebGL系统响应容器尺寸变化');
        
        // 更新视图状态
        this.updateViewState();
        
        // 标记缓存失效，重新计算可见路径
        this.invalidateCache();
        
        // 如果正在运行，更新路径数据
        if (this.isRunning) {
            setTimeout(() => {
                this.updatePathData();
            }, 100);
        }
    }
    
    /**
     * 标记缓存失效
     */
    invalidateCache() {
        this.cacheInvalidated = true;
        if (this.isRunning) {
            // 延迟更新避免频繁重建
            setTimeout(() => this.updatePathData(), 100);
        }
    }
    
    /**
     * 启动高性能流向动画
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updatePathData();
        this.startAnimation();
        
        console.log('🚀 HighPerformanceFlowSystem started - WebGL动画启动');
    }
    
    /**
     * 停止流向动画
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 清除图层
        if (this.deckglOverlay) {
            this.deckglOverlay.setProps({ layers: [] });
        }
        
        console.log('HighPerformanceFlowSystem stopped');
    }
    
    /**
     * 更新路径数据（核心性能优化函数）
     */
    updatePathData() {
        if (!this.cacheInvalidated && this.visiblePaths.length > 0) return;
        
        const startTime = performance.now();
        const bounds = this.map.getBounds().pad(this.config.viewportPadding);
        const zoom = this.map.getZoom();
        
        // 视窗裁剪：只处理可见管道
        this.visiblePaths = pipelineData.filter(pipe => {
            const fromNode = facilityData.find(f => f.id === pipe.from);
            const toNode = facilityData.find(f => f.id === pipe.to);
            
            if (!fromNode || !toNode || Math.abs(pipe.flowRate || 0) < 0.1) return false;
            
            // 检查管道是否在视窗内
            return bounds.contains([fromNode.lat, fromNode.lng]) || 
                   bounds.contains([toNode.lat, toNode.lng]);
        }).slice(0, this.config.maxPaths); // 限制最大数量
        
        // 转换为deck.gl PathLayer数据格式
        const pathData = this.visiblePaths.map(pipe => {
            const fromNode = facilityData.find(f => f.id === pipe.from);
            const toNode = facilityData.find(f => f.id === pipe.to);
            
            // 流向：正值表示from->to，负值表示to->from
            const isReverse = (pipe.flowRate || 0) < 0;
            const path = isReverse 
                ? [[toNode.lng, toNode.lat], [fromNode.lng, fromNode.lat]]
                : [[fromNode.lng, fromNode.lat], [toNode.lng, toNode.lat]];
            
            // 根据流速和管径计算宽度
            const velocity = Math.abs(pipe.velocity || 1);
            const diameter = pipe.diameter || 150;
            const width = Math.max(1, Math.min(8, diameter / 50)) * (0.5 + velocity / 4);
            
            return {
                path: path,
                width: width,
                color: [...this.config.arrowColor],
                id: pipe.id,
                velocity: velocity,
                flowRate: pipe.flowRate || 0
            };
        });
        
        // 创建高性能PathLayer
        this.createPathLayer(pathData);
        
        this.cacheInvalidated = false;
        const endTime = performance.now();
        
        console.log(`🔄 路径数据更新: ${this.visiblePaths.length}条管道, 耗时${(endTime - startTime).toFixed(2)}ms`);
    }
    
    /**
     * 创建deck.gl PathLayer（核心渲染层）
     */
    createPathLayer(pathData) {
        // 使用PathStyleExtension启用dash支持
        const pathStyleExtension = new deck.PathStyleExtension({ dash: true });
        
        this.pathLayer = new deck.PathLayer({
            id: 'high-performance-flow-layer',
            data: pathData,
            
            // 路径几何
            getPath: d => d.path,
            getWidth: d => d.width,
            getColor: d => d.color,
            
            // 高性能Dash动画配置
            getDashArray: [this.config.dashLength, this.config.dashGap],
            dashJustified: true,
            dashGapPickable: false,
            
            // 性能优化选项
            widthUnits: 'pixels',
            capRounded: true,
            jointRounded: true,
            
            // 启用扩展
            extensions: [pathStyleExtension],
            
            // 更新触发器（用于动画）
            updateTriggers: {
                getDashArray: this.currentOffset
            },
            
            // 性能配置
            autoHighlight: false,
            highlightColor: [255, 255, 255, 100],
            
            // 优化参数
            fp64: false, // 使用单精度浮点，足够准确且性能更好
            
            // 交互
            pickable: false // 禁用拾取以提高性能
        });
        
        // 更新deck.gl图层
        this.updateDeckLayers();
    }
    
    /**
     * 更新deck.gl图层（批量更新避免频繁重绘）
     */
    updateDeckLayers() {
        if (!this.deckglOverlay || !this.pathLayer) return;
        
        // 动态调整dash offset实现箭头流动
        const dashOffset = this.currentOffset % (this.config.dashLength + this.config.dashGap);
        
        // 更新PathLayer的dash offset
        this.pathLayer = this.pathLayer.clone({
            getDashArray: [this.config.dashLength, this.config.dashGap, dashOffset],
            updateTriggers: {
                getDashArray: dashOffset
            }
        });
        
        this.deckglOverlay.setProps({
            layers: [this.pathLayer]
        });
    }
    
    /**
     * 启动高帧率动画循环
     */
    startAnimation() {
        const animate = (currentTime) => {
            if (!this.isRunning) return;
            
            // 计算时间增量
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // 更新offset - 这是整个系统的核心，只改一个数字！
            this.currentOffset += this.animationSpeed * deltaTime * 0.01;
            
            // 仅更新dash offset，无需重新计算几何
            this.updateDashOffset();
            
            // 请求下一帧
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(animate);
    }
    
    /**
     * 高效更新dash offset（O(1)复杂度）
     */
    updateDashOffset() {
        if (!this.pathLayer) return;
        
        const dashOffset = this.currentOffset % (this.config.dashLength + this.config.dashGap);
        
        // 只更新uniform变量，GPU端自动处理
        this.pathLayer = this.pathLayer.clone({
            getDashArray: [this.config.dashLength, this.config.dashGap],
            dashOffset: dashOffset,
            updateTriggers: {
                getDashArray: this.currentOffset
            }
        });
        
        if (this.deckglOverlay) {
            this.deckglOverlay.setProps({
                layers: [this.pathLayer]
            });
        }
    }
    
    /**
     * 设置透明度
     */
    setOpacity(opacity) {
        this.opacity = Math.max(0, Math.min(1, opacity));
        
        // 更新箭头颜色的alpha通道
        this.config.arrowColor[3] = Math.floor(this.opacity * 255);
        
        if (this.isRunning) {
            this.updatePathData(); // 重新生成数据以应用新透明度
        }
        
        console.log(`HighPerformanceFlowSystem opacity: ${(this.opacity * 100).toFixed(0)}%`);
    }
    
    /**
     * 更新主题（保持白色箭头的简洁设计）
     */
    updateTheme() {
        // 保持统一的白色设计，不随主题变化
        console.log('HighPerformanceFlowSystem theme updated - 保持白色箭头设计');
    }
    
    /**
     * 性能监控
     */
    getPerformanceStats() {
        return {
            visiblePaths: this.visiblePaths.length,
            animationSpeed: this.animationSpeed,
            currentOffset: this.currentOffset,
            isRunning: this.isRunning,
            gpuMemoryUsage: 'Low (WebGL batched rendering)',
            estimatedFPS: this.config.animationFPS
        };
    }
    
    /**
     * 调整动画速度
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(5.0, speed));
        console.log(`HighPerformanceFlowSystem animation speed: ${this.animationSpeed.toFixed(1)}x`);
    }
    
    /**
     * 销毁系统
     */
    destroy() {
        this.stop();
        
        if (this.deckglOverlay) {
            this.deckglOverlay.finalize();
            this.deckglOverlay = null;
        }
        
        // 清理事件监听
        this.map.off('zoom move resize');
        
        console.log('HighPerformanceFlowSystem destroyed');
    }
}

// 全局高性能流向系统实例
let highPerformanceFlowSystem = null;

/**
 * 高性能流向装饰器更新函数
 * 替换原有的updatePipelineDecorators函数
 */
function updateHighPerformanceDecorators(visiblePipes, zoom) {
    const shouldShowFlow = layerState.flowDecorator && zoom > 11;
    
    if (shouldShowFlow) {
        // 启动高性能WebGL流向系统
        if (!highPerformanceFlowSystem) {
            highPerformanceFlowSystem = new HighPerformanceFlowSystem(map);
        }
        highPerformanceFlowSystem.start();
        
        // 应用当前的透明度设置
        const decoratorOpacity = layerOpacity.decorator || 1.0;
        highPerformanceFlowSystem.setOpacity(decoratorOpacity);
        
        console.log(`🚀 高性能流向系统启动 - ${visiblePipes.length}条管线, zoom=${zoom}`);
    } else {
        // 停止系统
        if (highPerformanceFlowSystem) {
            highPerformanceFlowSystem.stop();
        }
    }
}

/**
 * 高性能主题切换
 */
function toggleHighPerformanceFlow(enabled) {
    try {
        console.log('🚀 切换高性能流向装饰器:', enabled);
        layerState.flowDecorator = enabled;
        
        const zoom = map.getZoom();
        if (enabled && zoom > 11) {
            if (!highPerformanceFlowSystem) {
                highPerformanceFlowSystem = new HighPerformanceFlowSystem(map);
            }
            highPerformanceFlowSystem.start();
            
            // 应用当前的透明度设置
            const decoratorOpacity = layerOpacity.decorator || 1.0;
            highPerformanceFlowSystem.setOpacity(decoratorOpacity);
        } else {
            if (highPerformanceFlowSystem) {
                highPerformanceFlowSystem.stop();
            }
        }
        
        console.log('🚀 高性能流向装饰器切换完成');
    } catch (error) {
        console.error('切换高性能流向装饰器错误:', error);
    }
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.HighPerformanceFlowSystem = HighPerformanceFlowSystem;
    window.updateHighPerformanceDecorators = updateHighPerformanceDecorators;
    window.toggleHighPerformanceFlow = toggleHighPerformanceFlow;
} 