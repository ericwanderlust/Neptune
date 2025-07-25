/**
 * 🗺️ 地图管理器模块
 */

(function(global) {
    'use strict';

    const MapManager = {
        map: null,
        facilityLayerGroup: null,
        pipelineLayerGroup: null,
        initialized: false,

        init() {
            console.log('[MapManager] 🗺️ 地图管理器初始化');
            this.initMap();
            return Promise.resolve();
        },

        initMap() {
            // 初始化地图
            this.map = L.map('map', { zoomControl: false }).setView([22.261, 114.246], 16);
            L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

            // 添加底图
            const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { 
                attribution: '© CARTO', 
                maxZoom: 19 
            });
            tileLayer.addTo(this.map);

            // 创建图层组
            this.facilityLayerGroup = L.layerGroup().addTo(this.map);
            this.pipelineLayerGroup = L.layerGroup().addTo(this.map);

            this.initialized = true;
            console.log('[MapManager] 地图初始化完成');

            // 监听数据加载事件
            if (global.EventBus) {
                global.EventBus.on('data:loaded', this.onDataLoaded.bind(this));
            }
        },

        onDataLoaded(data) {
            console.log('[MapManager] 接收到数据，开始渲染');
            this.renderFacilities(data.facilities);
        },

        renderFacilities(facilities) {
            this.facilityLayerGroup.clearLayers();
            
            facilities.forEach(facility => {
                const marker = L.circleMarker([facility.lat, facility.lng], {
                    radius: 8,
                    fillColor: this.getFacilityColor(facility.type),
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });

                marker.bindTooltip(`${facility.name}<br>类型: ${facility.type}`);
                this.facilityLayerGroup.addLayer(marker);
            });

            console.log('[MapManager] 设施渲染完成:', facilities.length);
        },

        getFacilityColor(type) {
            const colors = {
                junction: '#3498db',
                reservoir: '#2ecc71',
                tank: '#ff8c00',
                pump_station: '#9b59b6',
                valve: '#e74c3c'
            };
            return colors[type] || '#95a5a6';
        },

        render() {
            console.log('[MapManager] 开始渲染地图');
            if (this.map) {
                this.map.invalidateSize();
            }
        },

        getMap() {
            return this.map;
        }
    };

    global.MapManager = MapManager;

})(window); 