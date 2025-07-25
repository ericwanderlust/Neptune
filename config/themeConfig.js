/**
 * 🎨 主题配置文件
 */

(function(global) {
    'use strict';

    const ThemeConfig = {
        themes: {
            light: {
                name: '浅色主题',
                variables: {
                    '--primary-color': '#4A90B8',
                    '--bg-primary': '#ffffff',
                    '--text-primary': '#2f3640'
                }
            },
            dark: {
                name: '深色主题',
                variables: {
                    '--primary-color': '#74b9ff',
                    '--bg-primary': '#2d3436',
                    '--text-primary': '#ddd'
                }
            }
        },
        
        default: 'light'
    };

    global.ThemeConfig = ThemeConfig;

})(window); 