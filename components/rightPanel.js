/* components/rightPanel.js
   Manage right side multi-tab panel (properties / layers / analysis)
*/
(function (global) {
  const RightPanel = {
    init() {
      console.log('RightPanel: 初始化开始');
      
      // 初始化分析面板
      this.initAnalysisPanel();
      this.addAnalysisStyles();
      
      console.log('RightPanel: 初始化完成');
    },
    switchTab(event, tab) {
      try {
        console.log('RightPanel: 切换标签页到', tab);
        
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        // 移除所有活动状态
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // 激活对应的tab按钮
        const targetButton = event ? event.currentTarget : document.querySelector(`.panel-tab[onclick*="${tab}"]`);
        if (targetButton) {
          targetButton.classList.add('active');
        }
        
        // 激活对应的内容面板
        const panels = { properties: 'propertiesPanel', analysis: 'analysisPanel' };
        const panelId = panels[tab];
        if (panelId) {
          const panel = document.getElementById(panelId);
          if (panel) {
            panel.classList.add('active');
            console.log('RightPanel: 激活面板', panelId);
          } else {
            console.warn('RightPanel: 找不到面板', panelId);
          }
        }
      } catch (error) {
        console.error('RightPanel: 切换标签页错误', error);
      }
    },

    showFacility(facility, isPipe = false) {
      try {
        console.log('RightPanel: 显示设施信息', facility.id || facility.name);
        
        // 展开右侧面板
        const rightPanel = document.getElementById('rightPanel');
        const rightPanelWrapper = document.getElementById('right-panel-wrapper');
        
        if (rightPanel && rightPanel.classList.contains('collapsed')) {
          rightPanel.classList.remove('collapsed');
          if (rightPanelWrapper) {
            rightPanelWrapper.style.display = 'flex';
          }
          
          // 更新toggle按钮
          const toggleIcon = rightPanel.querySelector('.panel-toggle i');
          if (toggleIcon) {
            toggleIcon.className = 'fas fa-chevron-right';
          }
        }
        
        // 切换到属性标签页
        this.switchTab(null, 'properties');
        
        // 隐藏"无选择"提示，显示设施详情
        const noSelection = document.getElementById('noSelection');
        const selectedFacility = document.getElementById('selectedFacility');
        
        if (noSelection) noSelection.style.display = 'none';
        if (selectedFacility) selectedFacility.style.display = 'block';
        
        // 生成设施详情内容
        const content = this.generateFacilityContent(facility, isPipe);
        if (selectedFacility) {
          selectedFacility.innerHTML = content;
        }

        // 同时更新分析面板
        this.showFacilityAnalysis(facility, isPipe);
        
        console.log('RightPanel: 设施信息显示完成');
      } catch (error) {
        console.error('RightPanel: 显示设施信息错误', error);
      }
    },

    generateFacilityContent(facility, isPipe = false) {
      if (isPipe) {
        return `
          <div class="facility-detail">
            <div class="facility-header">
              <div class="facility-info">
                <h4>管道 ${facility.id}</h4>
                <div class="facility-id">从 ${facility.from} 到 ${facility.to}</div>
              </div>
            </div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${facility.diameter || 150}</div>
                <div class="metric-label">管径 (mm)</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${Math.abs(facility.flowRate || 0).toFixed(1)}</div>
                <div class="metric-label">流量 (L/s)</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${facility.velocity || 0}</div>
                <div class="metric-label">流速 (m/s)</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${facility.headloss || 0}</div>
                <div class="metric-label">水损 (m/km)</div>
              </div>
            </div>
          </div>
        `;
      } else {
        const facilityTypeName = this.getFacilityTypeName(facility.type);
        const statusClass = facility.status === 'critical' ? 'error-bad' : 
                           facility.status === 'warning' ? 'error-warning' : 'error-good';
        
        let content = `
          <div class="facility-detail">
            <div class="facility-header">
              <div class="facility-info">
                <h4>${facility.name}</h4>
                <div class="facility-id">${facilityTypeName} • ID: ${facility.id}</div>
              </div>
            </div>
            <div class="metrics-grid">
              <div class="metric-card">
                                 <div class="metric-value">${facility.pressure ? facility.pressure.toFixed(2) : 'N/A'}</div>
                <div class="metric-label">压力 (MPa)</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${facility.elevation ? facility.elevation.toFixed(0) : 'N/A'}</div>
                <div class="metric-label">高程 (m)</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${facility.head ? facility.head.toFixed(0) : 'N/A'}</div>
                <div class="metric-label">总水头 (m)</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${facility.demand ? facility.demand.toFixed(0) : '0'}</div>
                <div class="metric-label">需水量 (L/s)</div>
              </div>
            </div>
        `;
        
        // 如果是监测点，添加模型精度对比
        if (facility.isMonitor && facility.monitored) {
          const pressureError = Math.abs((facility.pressure - facility.monitored.pressure) / facility.monitored.pressure * 100);
          const qualityError = Math.abs((facility.waterQuality.chlorine - facility.monitored.quality) / facility.monitored.quality * 100);
          
          content += `
            <div class="accuracy-comparison">
              <h5>模型精度对比</h5>
              <div class="accuracy-item">
                <strong>压力对比</strong>
                <div class="accuracy-grid">
                  <div class="label">计算值</div>
                  <div class="label">监测值</div>
                  <div class="label">误差</div>
                  <div>${facility.pressure.toFixed(2)}</div>
                  <div>${facility.monitored.pressure.toFixed(2)}</div>
                  <div class="accuracy-error ${pressureError < 10 ? 'error-good' : 'error-bad'}">${pressureError.toFixed(0)}%</div>
                </div>
              </div>
              <div class="accuracy-item">
                <strong>水质对比</strong>
                <div class="accuracy-grid">
                  <div class="label">计算值</div>
                  <div class="label">监测值</div>
                  <div class="label">误差</div>
                  <div>${facility.waterQuality.chlorine.toFixed(2)}</div>
                  <div>${facility.monitored.quality.toFixed(2)}</div>
                  <div class="accuracy-error ${qualityError < 10 ? 'error-good' : 'error-bad'}">${qualityError.toFixed(0)}%</div>
                </div>
              </div>
            </div>
          `;
        }
        
        content += '</div>';
        return content;
      }
    },

    getFacilityTypeName(type) {
      const names = {
        junction: '节点',
        pump_station: '泵站',
        reservoir: '水库',
        tank: '水塔',
        valve: '阀门'
      };
      return names[type] || '未知设施';
    },

    // 初始化分析面板内容
    initAnalysisPanel() {
      try {
        const analysisPanel = document.getElementById('analysisPanel');
        if (!analysisPanel) {
          console.warn('RightPanel: 找不到分析面板元素');
          return;
        }

        analysisPanel.innerHTML = `
          <div style="padding: 20px;">
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">
              <i class="fas fa-chart-line" style="font-size: 32px; margin-bottom: 15px; opacity: 0.5;"></i>
              <p>选择设施后可查看详细分析</p>
            </div>
          </div>
        `;
        
        console.log('RightPanel: 分析面板初始化完成');
      } catch (error) {
        console.error('RightPanel: 分析面板初始化错误', error);
      }
    },

    // 显示设施分析内容
    showFacilityAnalysis(facility, isPipe = false) {
      const analysisPanel = document.getElementById('analysisPanel');
      if (!analysisPanel) return;

      // 隐藏初始提示容器
      const analysisContainer = analysisPanel.querySelector('.analysis-container');
      if (analysisContainer) {
        analysisContainer.style.display = 'none';
      }

      if (isPipe) {
        analysisPanel.innerHTML = this.generatePipeAnalysis(facility);
      } else {
        analysisPanel.innerHTML = this.generateFacilityAnalysis(facility);
      }
    },

    generateFacilityAnalysis(facility) {
      const facilityTypeName = this.getFacilityTypeName(facility.type);
      
      return `
        <div style="padding: 20px;">
          <h4 style="margin: 0 0 20px 0; color: var(--primary-color);">
            <i class="fas fa-chart-line"></i> ${facility.name} 深度分析
          </h4>
          
          ${facility.isMonitor ? this.generateMonitorComparison(facility) : ''}
          
          ${facility.type === 'valve' ? this.generateValveAnalysis(facility) : ''}
          
          <div class="analysis-section">
            <h5><i class="fas fa-tint"></i> 水力特性分析</h5>
            <div class="analysis-chart">
              <div class="chart-item">
                <span class="chart-label">压力状态</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${(facility.pressure / 0.8) * 100}%; background: ${facility.pressure > 0.5 ? '#2ecc71' : facility.pressure > 0.3 ? '#f1c40f' : '#e74c3c'};"></div>
                </div>
                <span class="chart-value">${facility.pressure.toFixed(2)} MPa</span>
              </div>
              
              ${facility.demand > 0 ? `
              <div class="chart-item">
                <span class="chart-label">需水负荷</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${Math.min(100, (facility.demand / 100) * 100)}%; background: #3498db;"></div>
                </div>
                <span class="chart-value">${facility.demand.toFixed(0)} L/s</span>
              </div>
              ` : ''}
              
              ${facility.waterQuality ? `
              <div class="chart-item">
                <span class="chart-label">余氯浓度</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${(facility.waterQuality.chlorine / 1.0) * 100}%; background: #9b59b6;"></div>
                </div>
                <span class="chart-value">${facility.waterQuality.chlorine.toFixed(2)} mg/L</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${this.generateInfluenceAnalysis(facility)}
          
          ${this.generateReliabilityAnalysis(facility)}
          
          ${this.generateOptimizationSuggestions(facility)}
          
          <div class="analysis-section">
            <h5><i class="fas fa-exclamation-triangle"></i> 风险评估</h5>
            <div class="risk-assessment">
              <div class="risk-item risk-${facility.status}">
                <i class="fas fa-${facility.status === 'critical' ? 'times-circle' : facility.status === 'warning' ? 'exclamation-triangle' : 'check-circle'}"></i>
                <span>设施状态: ${facility.status === 'critical' ? '严重' : facility.status === 'warning' ? '警告' : '正常'}</span>
              </div>
              
              ${facility.pressure < 0.25 ? `
              <div class="risk-item risk-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <span>压力偏低，建议检查上游供水</span>
              </div>
              ` : ''}
              
              ${facility.demand > 80 ? `
              <div class="risk-item risk-warning">
                <i class="fas fa-arrow-up"></i>
                <span>需水量较高，关注供水能力</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="analysis-actions">
            <button class="analysis-btn" onclick="RightPanel.showDetailedAnalysis('${facility.id}')">
              <i class="fas fa-search-plus"></i> 详细分析报告
            </button>
            <button class="analysis-btn" onclick="RightPanel.showTrendAnalysis('${facility.id}')">
              <i class="fas fa-chart-line"></i> 历史趋势分析
            </button>
            ${facility.type === 'valve' ? `
            <button class="analysis-btn" onclick="RightPanel.runValveImpactAnalysis('${facility.id}')">
              <i class="fas fa-flask"></i> 关阀影响分析
            </button>
            ` : ''}
          </div>
                 </div>
       `;
     },
     
     // 新增：监测vs模拟对比分析
     generateMonitorComparison(facility) {
      if (!facility.monitored) return '';
      
      const pressureError = Math.abs((facility.pressure - facility.monitored.pressure) / facility.monitored.pressure * 100);
      const qualityError = Math.abs((facility.waterQuality.chlorine - facility.monitored.quality) / facility.monitored.quality * 100);
      
      return `
        <div class="analysis-section highlight-section">
          <h5><i class="fas fa-balance-scale"></i> 实测vs模拟对比</h5>
          <div class="comparison-grid">
            <div class="comparison-item">
              <div class="comparison-header">压力对比 (MPa)</div>
              <div class="comparison-values">
                <div class="value-pair">
                  <span class="value-label">实测:</span>
                  <span class="value-number measured">${facility.monitored.pressure.toFixed(3)}</span>
                </div>
                <div class="value-pair">
                  <span class="value-label">模拟:</span>
                  <span class="value-number simulated">${facility.pressure.toFixed(3)}</span>
                </div>
                <div class="value-pair">
                  <span class="value-label">误差:</span>
                  <span class="value-number error ${pressureError < 5 ? 'good' : pressureError < 15 ? 'warning' : 'bad'}">${pressureError.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div class="comparison-item">
              <div class="comparison-header">水质对比 (mg/L)</div>
              <div class="comparison-values">
                <div class="value-pair">
                  <span class="value-label">实测:</span>
                  <span class="value-number measured">${facility.monitored.quality.toFixed(3)}</span>
                </div>
                <div class="value-pair">
                  <span class="value-label">模拟:</span>
                  <span class="value-number simulated">${facility.waterQuality.chlorine.toFixed(3)}</span>
                </div>
                <div class="value-pair">
                  <span class="value-label">误差:</span>
                  <span class="value-number error ${qualityError < 10 ? 'good' : qualityError < 20 ? 'warning' : 'bad'}">${qualityError.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="model-accuracy">
            <div class="accuracy-summary">
              <i class="fas fa-certificate"></i>
              <span>模型精度评级: ${this.getModelAccuracyRating(pressureError, qualityError)}</span>
            </div>
            <div class="calibration-status">
              <button class="mini-btn" onclick="RightPanel.showCalibrationSuggestions('${facility.id}')">
                <i class="fas fa-wrench"></i> 校准建议
              </button>
            </div>
          </div>
                 </div>
       `;
     },
     
     // 新增：阀门关阀分析
     generateValveAnalysis(facility) {
      return `
        <div class="analysis-section highlight-section">
          <h5><i class="fas fa-stopwatch"></i> 阀门影响分析</h5>
          <div class="valve-analysis">
            <div class="valve-status">
              <div class="status-indicator ${facility.valveStatus || 'open'}">
                <i class="fas fa-${facility.valveStatus === 'closed' ? 'times-circle' : 'check-circle'}"></i>
                <span>阀门状态: ${facility.valveStatus === 'closed' ? '关闭' : '开启'}</span>
              </div>
            </div>
            
            <div class="impact-simulation">
              <div class="impact-header">关阀影响预测</div>
              <div class="impact-metrics">
                <div class="impact-item">
                  <span class="impact-label">影响用户:</span>
                  <span class="impact-value">${Math.floor(Math.random() * 500 + 200)}</span>
                  <span class="impact-unit">户</span>
                </div>
                <div class="impact-item">
                  <span class="impact-label">影响范围:</span>
                  <span class="impact-value">${(Math.random() * 2 + 0.5).toFixed(1)}</span>
                  <span class="impact-unit">km²</span>
                </div>
                <div class="impact-item">
                  <span class="impact-label">压力降幅:</span>
                  <span class="impact-value">${(Math.random() * 0.15 + 0.05).toFixed(2)}</span>
                  <span class="impact-unit">MPa</span>
                </div>
              </div>
            </div>
            
            <div class="alternative-path">
              <div class="path-header">
                <i class="fas fa-route"></i> 替代供水路径
              </div>
              <div class="path-list">
                <div class="path-item">
                  <span class="path-route">路径A: 经由${this.getRandomNearbyFacility()}</span>
                  <span class="path-capacity">容量: 85%</span>
                </div>
                <div class="path-item">
                  <span class="path-route">路径B: 经由${this.getRandomNearbyFacility()}</span>
                  <span class="path-capacity">容量: 72%</span>
                </div>
              </div>
            </div>
          </div>
                 </div>
       `;
     },
     
     // 新增：影响域分析
     generateInfluenceAnalysis(facility) {
      const influenceRadius = this.calculateInfluenceRadius(facility);
      const affectedNodes = Math.floor(Math.random() * 20 + 5);
      
      return `
        <div class="analysis-section">
          <h5><i class="fas fa-bullseye"></i> 影响域分析</h5>
          <div class="influence-analysis">
            <div class="influence-metrics">
              <div class="metric-item">
                <span class="metric-label">影响半径:</span>
                <span class="metric-value">${influenceRadius}m</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">影响节点:</span>
                <span class="metric-value">${affectedNodes}个</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">关键程度:</span>
                <span class="metric-value ${this.getCriticalityClass(facility)}">${this.getCriticalityLevel(facility)}</span>
              </div>
            </div>
            
            <div class="downstream-analysis">
              <div class="downstream-header">下游影响分析</div>
              <div class="downstream-items">
                ${this.generateDownstreamItems(facility)}
              </div>
            </div>
          </div>
                 </div>
       `;
     },
     
     // 新增：供水可靠性分析
     generateReliabilityAnalysis(facility) {
      const reliability = this.calculateReliability(facility);
      
      return `
        <div class="analysis-section">
          <h5><i class="fas fa-shield-alt"></i> 供水可靠性评估</h5>
          <div class="reliability-analysis">
            <div class="reliability-score">
              <div class="score-circle">
                <div class="score-value">${reliability.score}</div>
                <div class="score-label">可靠性评分</div>
              </div>
            </div>
            
            <div class="reliability-factors">
              <div class="factor-item">
                <span class="factor-label">冗余度:</span>
                <div class="factor-bar">
                  <div class="factor-fill" style="width: ${reliability.redundancy}%; background: #3498db;"></div>
                </div>
                <span class="factor-value">${reliability.redundancy}%</span>
              </div>
              
              <div class="factor-item">
                <span class="factor-label">稳定性:</span>
                <div class="factor-bar">
                  <div class="factor-fill" style="width: ${reliability.stability}%; background: #2ecc71;"></div>
                </div>
                <span class="factor-value">${reliability.stability}%</span>
              </div>
              
              <div class="factor-item">
                <span class="factor-label">维护性:</span>
                <div class="factor-bar">
                  <div class="factor-fill" style="width: ${reliability.maintainability}%; background: #f39c12;"></div>
                </div>
                <span class="factor-value">${reliability.maintainability}%</span>
              </div>
            </div>
          </div>
                 </div>
       `;
     },
     
     // 新增：优化建议
     generateOptimizationSuggestions(facility) {
      const suggestions = this.generateSuggestions(facility);
      
      return `
        <div class="analysis-section">
          <h5><i class="fas fa-lightbulb"></i> 优化建议</h5>
          <div class="suggestions-list">
            ${suggestions.map(suggestion => `
              <div class="suggestion-item ${suggestion.priority}">
                <div class="suggestion-icon">
                  <i class="fas fa-${suggestion.icon}"></i>
                </div>
                <div class="suggestion-content">
                  <div class="suggestion-title">${suggestion.title}</div>
                  <div class="suggestion-desc">${suggestion.description}</div>
                </div>
                <div class="suggestion-priority">
                  <span class="priority-badge ${suggestion.priority}">${suggestion.priorityText}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },
    
    // 辅助函数：计算模型精度评级
    getModelAccuracyRating(pressureError, qualityError) {
      const avgError = (pressureError + qualityError) / 2;
      if (avgError < 5) return 'A级 (优秀)';
      if (avgError < 10) return 'B级 (良好)';
      if (avgError < 20) return 'C级 (一般)';
      return 'D级 (需改进)';
    },
    
    // 辅助函数：获取随机附近设施
    getRandomNearbyFacility() {
      const facilities = ['泵站P01', '水库R02', '中继站T03', '调节阀V04'];
      return facilities[Math.floor(Math.random() * facilities.length)];
    },
    
    // 辅助函数：计算影响半径
    calculateInfluenceRadius(facility) {
      const baseRadius = facility.type === 'pump_station' ? 800 : 
                        facility.type === 'reservoir' ? 1200 : 
                        facility.type === 'valve' ? 500 : 300;
      return baseRadius + Math.floor(Math.random() * 200);
    },
    
    // 辅助函数：获取关键程度等级
    getCriticalityLevel(facility) {
      if (facility.type === 'pump_station' || facility.type === 'reservoir') return '高';
      if (facility.isMonitor) return '中';
      return '低';
    },
    
    // 辅助函数：获取关键程度样式类
    getCriticalityClass(facility) {
      const level = this.getCriticalityLevel(facility);
      return level === '高' ? 'critical' : level === '中' ? 'warning' : 'normal';
    },
    
    // 辅助函数：生成下游项目
    generateDownstreamItems(facility) {
      const items = [
        '供水区域A (约150户)',
        '商业区B (约80户)', 
        '居民区C (约220户)'
      ];
      return items.slice(0, Math.floor(Math.random() * 3) + 1)
        .map(item => `<div class="downstream-item">${item}</div>`).join('');
    },
    
    // 辅助函数：计算可靠性
    calculateReliability(facility) {
      const baseScore = 85;
      const variance = Math.random() * 20 - 10;
      const score = Math.round(baseScore + variance);
      
      return {
        score: score,
        redundancy: Math.round(60 + Math.random() * 30),
        stability: Math.round(70 + Math.random() * 25),
        maintainability: Math.round(65 + Math.random() * 30)
      };
    },
    
    // 辅助函数：生成优化建议
    generateSuggestions(facility) {
      const suggestions = [];
      
      if (facility.pressure < 0.3) {
        suggestions.push({
          priority: 'high',
          priorityText: '高',
          icon: 'exclamation-triangle',
          title: '压力过低警告',
          description: '建议检查上游泵站运行状态或增加增压设备'
        });
      }
      
      if (facility.demand > 50) {
        suggestions.push({
          priority: 'medium',
          priorityText: '中',
          icon: 'chart-line',
          title: '需水量监控',
          description: '该区域需水量较高，建议加强监控和预测'
        });
      }
      
      if (facility.isMonitor && facility.monitored) {
        const error = Math.abs((facility.pressure - facility.monitored.pressure) / facility.monitored.pressure * 100);
        if (error > 15) {
          suggestions.push({
            priority: 'high',
            priorityText: '高',
            icon: 'wrench',
            title: '模型校准',
            description: '监测与模拟误差较大，建议重新校准水力模型参数'
          });
        }
      }
      
      if (suggestions.length === 0) {
        suggestions.push({
          priority: 'low',
          priorityText: '低',
          icon: 'check-circle',
          title: '运行正常',
          description: '当前设施运行状态良好，建议保持定期维护'
        });
      }
      
      return suggestions;
    },
    
    // 新增：显示详细分析报告
    showDetailedAnalysis(facilityId) {
      console.log('显示详细分析报告:', facilityId);
      // 这里可以打开一个新的详细分析窗口或跳转到分析页面
      alert(`正在生成 ${facilityId} 的详细分析报告...`);
    },
    
    // 新增：显示趋势分析
    showTrendAnalysis(facilityId) {
      console.log('显示趋势分析:', facilityId);
      // 调用现有的趋势分析功能
      if (typeof TrendAnalysis !== 'undefined') {
        const facility = facilityData.find(f => f.id === facilityId);
        if (facility) {
          TrendAnalysis.show(facility);
        }
      }
    },
    
    // 新增：运行阀门影响分析
    runValveImpactAnalysis(facilityId) {
      console.log('运行阀门影响分析:', facilityId);
      alert(`正在模拟 ${facilityId} 关阀对管网的影响...`);
      // 这里可以实现实际的关阀影响分析算法
    },
    
    // 新增：显示校准建议
    showCalibrationSuggestions(facilityId) {
      console.log('显示校准建议:', facilityId);
      alert(`正在生成 ${facilityId} 的模型校准建议...`);
      // 这里可以显示具体的校准参数建议
    },

    generatePipeAnalysis(pipe) {
      return `
        <div style="padding: 20px;">
          <h4 style="margin: 0 0 20px 0; color: var(--primary-color);">
            <i class="fas fa-chart-line"></i> 管道 ${pipe.id} 分析
          </h4>
          
          <div class="analysis-section">
            <h5><i class="fas fa-water"></i> 流量特性</h5>
            <div class="analysis-chart">
              <div class="chart-item">
                <span class="chart-label">流量大小</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${Math.min(100, Math.abs(pipe.flowRate) / 200 * 100)}%; background: #2196F3;"></div>
                </div>
                <span class="chart-value">${Math.abs(pipe.flowRate).toFixed(0)} L/s</span>
              </div>
              
              <div class="chart-item">
                <span class="chart-label">流速</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${(pipe.velocity / 3) * 100}%; background: #4CAF50;"></div>
                </div>
                <span class="chart-value">${pipe.velocity.toFixed(1)} m/s</span>
              </div>
              
              <div class="chart-item">
                <span class="chart-label">水头损失</span>
                <div class="chart-bar">
                  <div class="chart-fill" style="width: ${(pipe.headloss / 5) * 100}%; background: #FF5722;"></div>
                </div>
                <span class="chart-value">${pipe.headloss.toFixed(1)} m/km</span>
              </div>
            </div>
          </div>

          <div class="analysis-section">
            <h5><i class="fas fa-cog"></i> 管道规格</h5>
            <div class="pipe-specs">
              <div class="spec-item">
                <span class="spec-label">管径:</span>
                <span class="spec-value">${pipe.diameter || 150} mm</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">流向:</span>
                <span class="spec-value">${pipe.flowRate > 0 ? '正向' : pipe.flowRate < 0 ? '反向' : '无流量'}</span>
              </div>
            </div>
          </div>

          <div class="analysis-section">
            <h5><i class="fas fa-exclamation-triangle"></i> 状态评估</h5>
            <div class="risk-assessment">
              ${pipe.velocity > 2.5 ? `
              <div class="risk-item risk-warning">
                <i class="fas fa-tachometer-alt"></i>
                <span>流速偏高，可能产生水锤效应</span>
              </div>
              ` : ''}
              
              ${pipe.headloss > 3 ? `
              <div class="risk-item risk-warning">
                <i class="fas fa-arrow-down"></i>
                <span>水头损失较大，建议检查管道状况</span>
              </div>
              ` : ''}
              
              ${Math.abs(pipe.flowRate) < 10 ? `
              <div class="risk-item risk-normal">
                <i class="fas fa-check-circle"></i>
                <span>流量正常</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    },

    // 添加分析面板样式
    addAnalysisStyles() {
      if (document.querySelector('#analysis-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'analysis-styles';
      style.textContent = `
        .analysis-section {
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 15px;
        }
        
        .analysis-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .analysis-section h5 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .analysis-chart {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .chart-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
        }
        
        .chart-label {
          min-width: 60px;
          color: var(--text-muted);
        }
        
        .chart-bar {
          flex: 1;
          height: 12px;
          background: var(--bg-secondary);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        
        .chart-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 6px;
        }
        
        .chart-value {
          min-width: 50px;
          text-align: right;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .monitor-status {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-item.primary {
          background: rgba(255, 215, 0, 0.1);
          color: #ff8c00;
        }
        
        .status-item.secondary {
          background: var(--bg-secondary);
          color: var(--text-muted);
        }
        
        .monitor-accuracy {
          font-size: 12px;
          color: var(--text-muted);
        }
        
        .accuracy-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .accuracy-badge.good {
          background: rgba(46, 204, 113, 0.1);
          color: var(--status-ok);
        }
        
        .accuracy-badge.unknown {
          background: var(--bg-secondary);
          color: var(--text-muted);
        }
        
        .risk-assessment {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .risk-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .risk-item.risk-normal {
          background: rgba(46, 204, 113, 0.1);
          color: var(--status-ok);
        }
        
        .risk-item.risk-warning {
          background: rgba(255, 165, 2, 0.1);
          color: var(--status-warn);
        }
        
        .risk-item.risk-critical {
          background: rgba(255, 56, 56, 0.1);
          color: var(--status-error);
        }
        
        .pipe-specs {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .spec-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: var(--bg-secondary);
          border-radius: 4px;
          font-size: 12px;
        }
        
        .spec-label {
          color: var(--text-muted);
        }
        
        .spec-value {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        /* 新增分析功能样式 */
        .highlight-section {
          background: linear-gradient(135deg, rgba(74, 144, 184, 0.05), rgba(74, 144, 184, 0.02));
          border: 1px solid rgba(74, 144, 184, 0.1);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .comparison-item {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 12px;
        }
        
        .comparison-header {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        
        .comparison-values {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .value-pair {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }
        
        .value-label {
          color: var(--text-muted);
        }
        
        .value-number {
          font-weight: 600;
        }
        
        .value-number.measured {
          color: var(--primary-color);
        }
        
        .value-number.simulated {
          color: var(--text-muted);
        }
        
        .value-number.error.good {
          color: var(--status-ok);
        }
        
        .value-number.error.warning {
          color: var(--status-warn);
        }
        
        .value-number.error.bad {
          color: var(--status-error);
        }
        
        .model-accuracy {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-secondary);
          padding: 8px 10px;
          border-radius: 4px;
          font-size: 11px;
        }
        
        .accuracy-summary {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }
        
        .mini-btn {
          padding: 4px 8px;
          border: none;
          background: var(--primary-color);
          color: white;
          border-radius: 3px;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .mini-btn:hover {
          background: var(--primary-color-dark);
        }
        
        .valve-analysis {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .valve-status {
          text-align: center;
        }
        
        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-indicator.open {
          background: rgba(46, 204, 113, 0.1);
          color: var(--status-ok);
        }
        
        .status-indicator.closed {
          background: rgba(255, 56, 56, 0.1);
          color: var(--status-error);
        }
        
        .impact-simulation {
          background: var(--bg-secondary);
          border-radius: 6px;
          padding: 10px;
        }
        
        .impact-header {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        
        .impact-metrics {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .impact-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }
        
        .impact-label {
          color: var(--text-muted);
        }
        
        .impact-value {
          font-weight: 600;
          color: var(--primary-color);
        }
        
        .impact-unit {
          color: var(--text-muted);
          margin-left: 2px;
        }
        
        .alternative-path {
          background: var(--bg-secondary);
          border-radius: 6px;
          padding: 10px;
        }
        
        .path-header {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .path-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .path-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          padding: 4px 8px;
          background: var(--bg-primary);
          border-radius: 4px;
        }
        
        .path-route {
          color: var(--text-primary);
        }
        
        .path-capacity {
          color: var(--primary-color);
          font-weight: 600;
        }
        
        .influence-analysis {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .influence-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .metric-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: var(--bg-secondary);
          padding: 8px;
          border-radius: 4px;
          text-align: center;
        }
        
        .metric-label {
          font-size: 10px;
          color: var(--text-muted);
        }
        
        .metric-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .metric-value.critical {
          color: var(--status-error);
        }
        
        .metric-value.warning {
          color: var(--status-warn);
        }
        
        .metric-value.normal {
          color: var(--status-ok);
        }
        
        .downstream-analysis {
          background: var(--bg-secondary);
          border-radius: 6px;
          padding: 10px;
        }
        
        .downstream-header {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        
        .downstream-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .downstream-item {
          font-size: 11px;
          color: var(--text-muted);
          padding: 2px 0;
        }
        
        .reliability-analysis {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .reliability-score {
          text-align: center;
        }
        
        .score-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: conic-gradient(var(--primary-color) 0deg, var(--primary-color) calc(var(--score, 85) * 3.6deg), var(--bg-secondary) calc(var(--score, 85) * 3.6deg));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          position: relative;
        }
        
        .score-circle::before {
          content: '';
          position: absolute;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: var(--bg-primary);
        }
        
        .score-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--primary-color);
          position: relative;
          z-index: 1;
        }
        
        .score-label {
          font-size: 8px;
          color: var(--text-muted);
          position: relative;
          z-index: 1;
        }
        
        .reliability-factors {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .factor-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }
        
        .factor-label {
          min-width: 50px;
          color: var(--text-muted);
        }
        
        .factor-bar {
          flex: 1;
          height: 8px;
          background: var(--bg-secondary);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .factor-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 4px;
        }
        
        .factor-value {
          min-width: 30px;
          text-align: right;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px;
          border-radius: 6px;
          font-size: 11px;
        }
        
        .suggestion-item.high {
          background: rgba(255, 56, 56, 0.05);
          border: 1px solid rgba(255, 56, 56, 0.1);
        }
        
        .suggestion-item.medium {
          background: rgba(255, 165, 2, 0.05);
          border: 1px solid rgba(255, 165, 2, 0.1);
        }
        
        .suggestion-item.low {
          background: rgba(46, 204, 113, 0.05);
          border: 1px solid rgba(46, 204, 113, 0.1);
        }
        
        .suggestion-icon {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: var(--bg-secondary);
          flex-shrink: 0;
        }
        
        .suggestion-content {
          flex: 1;
        }
        
        .suggestion-title {
          font-weight: 600;
          margin-bottom: 2px;
          color: var(--text-primary);
        }
        
        .suggestion-desc {
          color: var(--text-muted);
          line-height: 1.3;
        }
        
        .suggestion-priority {
          flex-shrink: 0;
        }
        
        .priority-badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 600;
        }
        
        .priority-badge.high {
          background: var(--status-error);
          color: white;
        }
        
        .priority-badge.medium {
          background: var(--status-warn);
          color: white;
        }
        
        .priority-badge.low {
          background: var(--status-ok);
          color: white;
        }
        
        .analysis-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color);
        }
        
        .analysis-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 12px;
          border: none;
          background: var(--primary-color);
          color: white;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .analysis-btn:hover {
          background: var(--primary-color-dark);
          transform: translateY(-1px);
        }
      `;
      document.head.appendChild(style);
    }
  };
  global.RightPanel = RightPanel;
})(window); 