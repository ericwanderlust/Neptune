/**
 * 🏭 设施配置文件
 */

(function(global) {
    'use strict';

    const FacilityConfig = {
        types: {
            junction: { name: '节点', icon: 'fa-circle', color: '#3498db' },
            reservoir: { name: '水库', icon: 'fa-water', color: '#2ecc71' },
            tank: { name: '水塔', icon: 'fa-building', color: '#ff8c00' },
            pump_station: { name: '泵站', icon: 'fa-industry', color: '#9b59b6' },
            valve: { name: '阀门', icon: 'fa-adjust', color: '#e74c3c' }
        },

        priorities: {
            major: ['reservoir', 'tank', 'pump_station'],
            monitor: 800,
            normal: 100
        }
    };

    global.FacilityConfig = FacilityConfig;

})(window); 