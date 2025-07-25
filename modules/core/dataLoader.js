/**
 * 📊 数据加载器模块
 * 负责EPANET文件解析和数据处理
 */

(function(global) {
    'use strict';

    const DataLoader = {
        facilityData: [],
        pipelineData: [],
        loaded: false,

        /**
         * 🎯 初始化数据加载器
         */
        init() {
            console.log('[DataLoader] 📊 数据加载器初始化');
            return Promise.resolve();
        },

        /**
         * 📊 加载EPANET数据
         */
        async loadEPANETData() {
            try {
                console.log('[DataLoader] 开始加载EPANET数据...');
                
                // 定义投影坐标系 (使用香港测绘处官方推荐的高精度7参数)
                // 参考: geodetic.gov.hk 和 epsg.io/2326 (EPSG 1825/15964)
                if (typeof proj4 !== 'undefined') {
                    // ✅ ArcGIS同款坐标转换管线：+axis=ne 处理轴序 + EPSG:4326 启用七参数1825
proj4.defs('EPSG:2326',
  '+proj=tmerc +lat_0=22.31213333333334 +lon_0=114.178555555556 ' +
  '+k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +axis=ne ' +
  '+towgs84=-162.619,-276.959,-161.764,0,0,0,0 +units=m +no_defs');
                }

                // 加载INP文件
                const response = await fetch('DATA/HK Example.inp');
                if (!response.ok) {
                    throw new Error(`无法加载INP文件: ${response.statusText}`);
                }
                
                const inpText = await response.text();
                const parsedData = this.parseINPFile(inpText);
                
                if (parsedData.nodes.length === 0) {
                    throw new Error("INP文件解析成功，但未找到节点数据");
                }

                // 处理设施数据
                this.processFacilityData(parsedData);
                
                // 处理管道数据  
                this.processPipelineData(parsedData);

                this.loaded = true;
                console.log('[DataLoader] 数据加载完成:', {
                    facilities: this.facilityData.length,
                    pipelines: this.pipelineData.length
                });

                // 触发数据加载完成事件
                if (global.EventBus) {
                    global.EventBus.emit('data:loaded', {
                        facilities: this.facilityData,
                        pipelines: this.pipelineData
                    });
                }

                return {
                    facilities: this.facilityData,
                    pipelines: this.pipelineData
                };

            } catch (error) {
                console.error('[DataLoader] 数据加载失败:', error);
                throw error;
            }
        },

        /**
         * 📄 解析INP文件
         */
        parseINPFile(text) {
            const lines = text.split(/\r?\n/);
            const data = { nodes: [], pipes: [], coordinates: {} };
            let currentSection = "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('[')) {
                    currentSection = trimmed.toUpperCase();
                    continue;
                }
                if (!trimmed || trimmed.startsWith(';')) continue;

                const parts = trimmed.split(/\s+/);
                try {
                    switch(currentSection) {
                        case '[JUNCTIONS]':
                            data.nodes.push({ id: parts[0], type: 'junction', elev: parseFloat(parts[1]) });
                            break;
                        case '[RESERVOIRS]':
                            data.nodes.push({ id: parts[0], type: 'reservoir', elev: parseFloat(parts[1]) });
                            break;
                        case '[TANKS]':
                            data.nodes.push({ id: parts[0], type: 'tank', elev: parseFloat(parts[1]) });
                            break;
                        case '[PIPES]':
                            data.pipes.push({ 
                                id: parts[0], 
                                from: parts[1], 
                                to: parts[2], 
                                diameter: parseFloat(parts[4]) || 150 
                            });
                            break;
                        case '[PUMPS]':
                            data.nodes.push({ id: parts[0], type: 'pump_station', elev: 0 });
                            break;
                        case '[VALVES]':
                            data.nodes.push({ id: parts[0], type: 'valve', elev: parseFloat(parts[3]) || 0 });
                            break;
                        case '[COORDINATES]':
                            data.coordinates[parts[0]] = { 
                                x: parseFloat(parts[1]), 
                                y: parseFloat(parts[2]) 
                            };
                            break;
                    }
                } catch (e) {
                    console.warn("[DataLoader] 解析行出错:", line, e);
                }
            }
            return data;
        },

        /**
         * 🏭 处理设施数据
         */
        processFacilityData(parsedData) {
            // 定义监测点
            const primaryMonitorIds = ['SIUSAIWANSEA', 'SWSR-CHAIWAN', 'S01097-11SE19A', 'S00115-11SE19A', 'S00098-11SE19A'];
            const otherMonitorIds = ['S00002-11SE14C', 'S01080-11SE19B', 'S00103-11SE19A', 'S00035-11SE20A', 'S01142-11SE19A'];
            
            this.facilityData = parsedData.nodes.map(node => {
                const coords = parsedData.coordinates[node.id];
                if (!coords) return null;
                
                // 坐标转换
                let lng, lat;
                if (typeof proj4 !== 'undefined') {
                    // ✅ INP文件：X-Coord=Easting, Y-Coord=Northing
                    // +axis=ne 已正确定义轴序，按正常 [x,y] 即 [E,N] 传入即可
                    // 使用 EPSG:4326 而非 "WGS84" 以启用七参数转换
                    [lng, lat] = proj4("EPSG:2326", "EPSG:4326", [coords.x, coords.y]);
                } else {
                    // 简单的近似转换
                    lng = coords.x / 100000 + 114;
                    lat = coords.y / 100000 + 22;
                }
                
                const isPrimary = primaryMonitorIds.includes(node.id);
                const isOther = otherMonitorIds.includes(node.id);
                
                // 模拟水力数据
                const pressure = 0.2 + Math.random() * 0.4;
                const chlorine = 0.2 + Math.random() * 0.5;

                return {
                    id: node.id,
                    name: node.id,
                    lat,
                    lng,
                    type: node.type,
                    elevation: node.elev,
                    pressure: pressure,
                    head: node.elev + pressure * 102,
                    demand: (node.type === 'junction' ? Math.random() * 50 : 0),
                    waterQuality: { 
                        chlorine, 
                        ph: 6.5 + Math.random() * 1.5 
                    },
                    status: Math.random() > 0.95 ? 'critical' : (Math.random() > 0.9 ? 'warning' : 'normal'),
                    isMonitor: isPrimary || isOther,
                    isPrimary: isPrimary,
                    monitored: (isPrimary || isOther) ? {
                        pressure: pressure + (Math.random() - 0.5) * 0.1,
                        quality: chlorine + (Math.random() - 0.5) * 0.1
                    } : null
                };
            }).filter(Boolean);
        },

        /**
         * 🔧 处理管道数据
         */
        processPipelineData(parsedData) {
            this.pipelineData = parsedData.pipes.map(pipe => ({
                ...pipe,
                flowRate: (Math.random() - 0.5) * 200,
                velocity: Math.random() * 2 + 0.5,
                headloss: Math.random() * 2
            }));
        },

        /**
         * 📊 获取数据
         */
        getData() {
            return {
                facilities: this.facilityData,
                pipelines: this.pipelineData,
                loaded: this.loaded
            };
        }
    };

    // 全局注册
    global.DataLoader = DataLoader;

})(window); 