/**
 * 🗺️ 地图配置文件
 */

(function(global) {
    'use strict';

    const MapConfig = {
        // 默认视图
        defaultView: {
            lat: 22.261,
            lng: 114.246,
            zoom: 16
        },

        // 底图配置
        tileLayers: {
            light: {
                url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                options: { attribution: '© CARTO', maxZoom: 19 }
            },
            dark: {
                url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                options: { attribution: '© CARTO', maxZoom: 19 }
            }
        },

        // 坐标系配置 (使用ArcGIS同款转换管线：标准proj4定义 + 手动轴序处理 + 七参数1825)
        // 参考: geodetic.gov.hk 和 epsg.io/2326 (EPSG 1825/15964)
        projection: {
            epsg: "EPSG:2326",
            def: "+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0,0,0,0 +units=m +no_defs"
        }
    };

    global.MapConfig = MapConfig;

})(window); 