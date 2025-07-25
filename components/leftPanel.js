/* components/leftPanel.js
   Build and manage the left side panel (map layers & facility filter)
   This is incremental: we only generate HTML and rely on existing CSS/JS for behavior
*/

(function (global) {
  const LeftPanel = {
    init() {
      try {
        console.log('LeftPanel: 开始初始化');
        const container = document.getElementById('left-panel-content');
        if (!container) {
          console.warn('LeftPanel: 找不到容器元素');
          return;
        }
        
        container.innerHTML = this.getPanelHTML();
        console.log('LeftPanel: HTML已生成');
        
        // 不要重复添加事件监听器 - HTML中已经有onclick
        // 只设置默认状态
        this.setActiveMenuItem('overview');
        this.setFilterActiveState('facilities-section', 'all');
        this.setFilterActiveState('alarms-section', null);
        
        console.log('LeftPanel: 初始化完成');
      } catch (error) {
        console.error('LeftPanel: 初始化错误', error);
      }
    },

    toggleSection(header) {
        try {
            console.log('LeftPanel: 切换章节');
            const content = header.nextElementSibling;
            const icon = header.querySelector('.fas.fa-chevron-down');
            
            if (content) {
                header.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            }
            
            if (icon) {
                icon.style.transform = header.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        } catch (error) {
            console.error('LeftPanel: 切换章节错误', error);
        }
    },

    setActiveMenuItem(theme) {
        try {
            document.querySelectorAll('#left-panel-content .menu-item[onclick*="switchMapLayer"]').forEach(item => {
                const isActive = item.getAttribute('onclick').includes(`'${theme}'`);
                item.classList.toggle('active', isActive);
            });
        } catch (error) {
            console.error('LeftPanel: 设置活动菜单项错误', error);
        }
    },

    setFilterActiveState(sectionId, filterValue) {
        try {
            const section = document.getElementById(sectionId);
            if (!section) {
                console.warn('LeftPanel: 找不到章节', sectionId);
                return;
            }

            section.querySelectorAll('.menu-item').forEach(item => {
                const onclickAttr = item.getAttribute('onclick');
                if (!onclickAttr) return;

                let currentFilterValue;
                const match = onclickAttr.match(/filterFacilities\('([^']*)'|filterByAlarm\(([^)]*)\)/);

                if (match) {
                    if (match[1] !== undefined) currentFilterValue = match[1]; // for filterFacilities
                    else if (match[2] !== undefined) currentFilterValue = (match[2] === 'null' ? null : match[2]); // for filterByAlarm
                }
                
                const isActive = currentFilterValue === filterValue;
                item.classList.toggle('filter-active', isActive);
                item.classList.toggle('filter-inactive', !isActive);
            });
        } catch (error) {
            console.error('LeftPanel: 设置过滤状态错误', error);
        }
    },

    // simplified HTML adapted from monitor_realtime_map.html
    getPanelHTML() {
      return `
        <div class="panel-section">
          <div class="section-header" onclick="LeftPanel.toggleSection(this)">
            <i class="fas fa-palette"></i><span>节点主题</span>
            <i class="fas fa-chevron-down" style="margin-left:auto;"></i>
          </div>
          <div class="section-content">
            <div class="menu-item active" onclick="switchNodeTheme('overview')"><i class="fas fa-map"></i><span>普通视图</span></div>
            <div class="menu-item" onclick="switchNodeTheme('pressure')"><i class="fas fa-gauge-high"></i><span>压力分层</span></div>
            <div class="menu-item" onclick="switchNodeTheme('elevation')"><i class="fas fa-mountain"></i><span>高程分层</span></div>
            <div class="menu-item" onclick="switchNodeTheme('head')"><i class="fas fa-water"></i><span>总水头</span></div>
            <div class="menu-item" onclick="switchNodeTheme('demand')"><i class="fas fa-tint"></i><span>需水量</span></div>
            <div class="menu-item" onclick="switchNodeTheme('quality')"><i class="fas fa-flask"></i><span>水质分层</span></div>
          </div>
        </div>
        <div class="panel-section">
          <div class="section-header collapsed" onclick="LeftPanel.toggleSection(this)">
            <i class="fas fa-road"></i><span>管道主题</span>
            <i class="fas fa-chevron-down" style="margin-left:auto; transform: rotate(-90deg);"></i>
          </div>
          <div class="section-content collapsed">
            <div class="menu-item active" onclick="switchPipeTheme('overview')"><i class="fas fa-map"></i><span>普通视图</span></div>
            <div class="menu-item" onclick="switchPipeTheme('pipe_flow')"><i class="fas fa-stream"></i><span>管道流量</span></div>
            <div class="menu-item" onclick="switchPipeTheme('pipe_diameter')"><i class="fas fa-circle"></i><span>管径分层</span></div>
            <div class="menu-item" onclick="switchPipeTheme('pipe_velocity')"><i class="fas fa-tachometer-alt"></i><span>流速分层</span></div>
            <div class="menu-item" onclick="switchPipeTheme('pipe_headloss')"><i class="fas fa-chart-line"></i><span>管损分层</span></div>
          </div>
        </div>
        <div class="panel-section">
          <div class="section-header collapsed" onclick="LeftPanel.toggleSection(this)">
            <i class="fas fa-magic"></i><span>装饰图层</span>
            <i class="fas fa-chevron-down" style="margin-left:auto; transform: rotate(-90deg);"></i>
          </div>
          <div class="section-content collapsed" id="decorator-section">
            <div class="facility-checkbox-item">
              <label style="display: flex; align-items: center; gap: 10px; padding: 8px 20px; cursor: pointer;">
                <input type="checkbox" id="flowDirectionToggle" onchange="toggleFlowDirectionDecorator(this.checked)" style="margin: 0;">
                <i class="fas fa-long-arrow-alt-right" style="color: var(--primary-color); width: 16px;"></i>
                <span>流向粒子</span>
              </label>
            </div>
            <div style="margin-left: 40px; margin-bottom: 10px;">
              <small style="color: var(--text-muted); font-size: 11px;">
                圆点+箭头显示水流方向，可与任意主题叠加
              </small>
            </div>
          </div>
        </div>
        <div class="panel-section">
          <div class="section-header collapsed" onclick="LeftPanel.toggleSection(this)">
            <i class="fas fa-satellite-dish"></i><span>监测点</span>
            <i class="fas fa-chevron-down" style="margin-left:auto; transform: rotate(-90deg);"></i>
          </div>
          <div class="section-content collapsed" id="monitors-section">
            <div class="menu-item active" onclick="toggleMonitors('primary')"><span><i class="fas fa-star" style="color:#FFD700"></i>主控点</span></div>
            <div class="menu-item" onclick="toggleMonitors('all')"><span><i class="fas fa-circle-dot"></i>全部监测点</span></div>
            <div class="menu-item" onclick="toggleMonitors('none')"><span><i class="fas fa-eye-slash"></i>隐藏监测点</span></div>
          </div>
        </div>
        <div class="panel-section">
          <div class="section-header" onclick="LeftPanel.toggleSection(this)">
            <i class="fas fa-cogs"></i><span>监控设施</span>
            <i class="fas fa-chevron-down" style="margin-left:auto;"></i>
          </div>
          <div class="section-content" id="facilities-section">
            <div class="facility-checkbox-item">
              <label style="display: flex; align-items: center; gap: 10px; padding: 8px 20px; cursor: pointer;">
                <input type="checkbox" checked onchange="toggleFacilityType('pump_station', this.checked)" style="margin: 0;">
                <i class="fas fa-industry" style="color: #9b59b6; width: 16px;"></i>
                <span>泵站</span>
              </label>
            </div>
            <div class="facility-checkbox-item">
              <label style="display: flex; align-items: center; gap: 10px; padding: 8px 20px; cursor: pointer;">
                <input type="checkbox" checked onchange="toggleFacilityType('reservoir', this.checked)" style="margin: 0;">
                <i class="fas fa-water" style="color: #2ecc71; width: 16px;"></i>
                <span>水库</span>
              </label>
            </div>
            <div class="facility-checkbox-item">
              <label style="display: flex; align-items: center; gap: 10px; padding: 8px 20px; cursor: pointer;">
                <input type="checkbox" checked onchange="toggleFacilityType('tank', this.checked)" style="margin: 0;">
                <i class="fas fa-building" style="color: #e67e22; width: 16px;"></i>
                <span>水塔</span>
              </label>
            </div>
            <div class="facility-checkbox-item">
              <label style="display: flex; align-items: center; gap: 10px; padding: 8px 20px; cursor: pointer;">
                <input type="checkbox" checked onchange="toggleFacilityType('junction', this.checked)" style="margin: 0;">
                <i class="fas fa-circle" style="color: #3498db; font-size: 10px; width: 16px;"></i>
                <span>管道节点</span>
              </label>
            </div>
            <div class="facility-checkbox-item">
              <label style="display: flex; align-items: center; gap: 10px; padding: 8px 20px; cursor: pointer;">
                <input type="checkbox" checked onchange="toggleFacilityType('valve', this.checked)" style="margin: 0;">
                <i class="fas fa-adjust" style="color: #e74c3c; width: 16px;"></i>
                <span>阀门</span>
              </label>
            </div>
          </div>
        </div>
        <div class="panel-section">
          <div class="section-header" onclick="LeftPanel.toggleSection(this)">
            <i class="fas fa-layer-group"></i><span>图层透明度</span>
            <i class="fas fa-chevron-down" style="margin-left:auto;"></i>
          </div>
          <div class="section-content" id="opacity-section">
            <div class="opacity-control-item">
              <div class="opacity-control-label">
                <span class="layer-icon">
                  <i class="fas fa-water"></i>
                  设施图层
                </span>
                <span class="opacity-value" id="facilityOpacityValue">100%</span>
              </div>
              <input type="range" id="facilityOpacitySlider" class="opacity-slider" 
                     min="0" max="100" value="100" 
                     oninput="updateLayerOpacity('facility', this.value)">
            </div>
            
            <div class="opacity-control-item">
              <div class="opacity-control-label">
                <span class="layer-icon">
                  <i class="fas fa-minus"></i>
                  管道图层
                </span>
                <span class="opacity-value" id="pipelineOpacityValue">100%</span>
              </div>
              <input type="range" id="pipelineOpacitySlider" class="opacity-slider" 
                     min="0" max="100" value="100" 
                     oninput="updateLayerOpacity('pipeline', this.value)">
            </div>
            
            <div class="opacity-control-item">
              <div class="opacity-control-label">
                <span class="layer-icon">
                  <i class="fas fa-arrow-right"></i>
                  流向装饰
                </span>
                <span class="opacity-value" id="decoratorOpacityValue">100%</span>
              </div>
              <input type="range" id="decoratorOpacitySlider" class="opacity-slider" 
                     min="0" max="100" value="100" 
                     oninput="updateLayerOpacity('decorator', this.value)">
            </div>
            
            <div class="opacity-control-item">
              <div class="opacity-control-label">
                <span class="layer-icon">
                  <i class="fas fa-map"></i>
                  底图图层
                </span>
                <span class="opacity-value" id="basemapOpacityValue">100%</span>
              </div>
              <input type="range" id="basemapOpacitySlider" class="opacity-slider" 
                     min="0" max="100" value="100" 
                     oninput="updateLayerOpacity('basemap', this.value)">
            </div>
            
            <div style="margin-top: 15px; text-align: center;">
              <button class="opacity-reset-btn" onclick="resetAllOpacity()" style="width: 100%;">
                <i class="fas fa-undo"></i> 重置所有透明度
              </button>
            </div>
          </div>
        </div>
        <div class="panel-section">
          <div class="section-header collapsed" onclick="LeftPanel.toggleSection(this)">
            <i class="fas fa-exclamation-triangle"></i><span>报警状态</span>
            <i class="fas fa-chevron-down" style="margin-left:auto; transform: rotate(-90deg);"></i>
          </div>
          <div class="section-content collapsed" id="alarms-section">
            <div class="menu-item" onclick="filterByAlarm(null)"><i class="fas fa-list"></i><span>全部状态</span></div>
            <div class="menu-item" onclick="filterByAlarm('critical')"><i class="fas fa-exclamation-triangle" style="color:var(--status-error)"></i><span>严重报警</span></div>
            <div class="menu-item" onclick="filterByAlarm('warning')"><i class="fas fa-exclamation-circle" style="color:var(--status-warn)"></i><span>预警</span></div>
            <div class="menu-item" onclick="filterByAlarm('normal')"><i class="fas fa-check-circle" style="color:var(--status-ok)"></i><span>正常</span></div>
          </div>
        </div>
      `;
    }
  };

  global.LeftPanel = LeftPanel;
})(window); 