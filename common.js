// ===========================
// 在线水力模型BS系统 - 通用功能
// ===========================

// 用户权限管理
const UserPermissions = {
  // 角色定义 - 基于用户场景分析 V1.0
  roleDefinitions: {
    'admin': { 
      name: '系统管理员（平台管理员）', 
      department: 'IT/外部运维',
      permissions: ['all', 'user_management', 'system_config', 'security_audit', 'backup_recovery'],
      defaultUser: '系统管理员',
      description: '用户权限分级管理、菜单接口参数维护、日志审计、安全合规、健康监控、升级备份恢复'
    },
    'executive': {
      name: '管理决策层',
      department: '水司中高层/管理办', 
      permissions: ['view', 'drill_down', 'export', 'remote_control_limited', 'meeting_mode', 'dashboard_custom'],
      defaultUser: '张总',
      description: '全局运营KPI与风险态势监控、趋势历史分析、异常穿透、决策支持、督查问题闭环、绩效统计'
    },
    'dispatcher': {
      name: '生产运行部/调度员', 
      department: '总调度中心/一线班组',
      permissions: ['view', 'operate', 'dispatch', 'emergency', 'simulate', 'workflow', 'batch_operation', 'shift_handover'],
      defaultUser: '李调度',
      description: '实时调度操作、工况模拟、异常应急响应、调度指令仿真、应急分析、工单派发、预案生成'
    },
    'engineer': {
      name: '建模工程师/运维工程师',
      department: '模型专家/系统技术支持',
      permissions: ['view', 'model', 'analyze', 'calibrate', 'export', 'collaborate', 'version_control', 'api_access'],
      defaultUser: '王工程师',
      description: '模型建设、结构参数批量维护、模型调优校核、数据溯源、版本管理、算法接入、定期健康检查'
    },
    'service': {
      name: '客服/服务支持',
      department: '水司客服中心/服务热线',
      permissions: ['view_limited', 'ticket', 'communicate', 'report', 'trace_simple', 'customer_feedback'],
      defaultUser: '陈客服',
      description: '投诉报修事件登记分派、进度跟踪、快速查询事件历史、支持简易溯源、用户回访满意度登记'
    },
    'analyst': {
      name: '信息部/数据分析师',
      department: '信息中心/大数据/BI',
      permissions: ['view', 'analyze', 'report', 'export', 'custom_analysis', 'data_governance', 'api_management'],
      defaultUser: '赵分析师',
      description: '多源数据治理与标签管理、合规报送、接口对接、自助数据提取、专题报表、数据质检修正'
    }
  },

  // 当前用户信息 - 从localStorage读取或默认值
  get currentUser() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        // 补充角色定义信息
        const roleDef = this.roleDefinitions[user.role];
        if (roleDef) {
          return {
            ...user,
            roleDescription: roleDef.description,
            permissions: user.permissions || roleDef.permissions
          };
        }
        return user;
      } catch (e) {
        console.warn('解析用户信息失败:', e);
      }
    }
    
    // 没有有效的用户信息时返回null
    return null;
  },

  // 设置默认用户（用于开发和演示）
  setDefaultUser(role = 'dispatcher') {
    const roleDef = this.roleDefinitions[role];
    if (!roleDef) {
      console.error('无效的角色:', role);
      return false;
    }

    const defaultUser = {
      id: 'user_' + Date.now(),
      name: roleDef.defaultUser,
      role: role,
      department: roleDef.department,
      permissions: roleDef.permissions,
      loginTime: new Date().toISOString()
    };

    this.setCurrentUser(defaultUser);
    console.log('已设置默认用户:', defaultUser);
    return true;
  },

  // 检查并初始化用户
  ensureUserLogin() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // 如果在登录页面，不需要检查用户状态
    if (currentPage === 'login.html') {
      return true;
    }

    // 检查是否有用户信息
    if (!this.currentUser) {
      console.log('UserPermissions: 没有用户信息，重定向到登录页');
      window.location.href = 'login.html';
      return false;
    }

    return true;
  },

  // 设置当前用户
  setCurrentUser(userInfo) {
    localStorage.setItem('currentUser', JSON.stringify(userInfo));
    // 触发用户信息更新事件
    window.dispatchEvent(new CustomEvent('userChanged', { detail: userInfo }));
  },

  // 检查权限
  hasPermission(permission) {
    const user = this.currentUser;
    if (!user) return false; // 没有用户信息时返回false
    if (user.permissions && user.permissions.includes('all')) return true;
    return user.permissions && user.permissions.includes(permission);
  },

  // 获取用户信息
  getUserInfo() {
    return this.currentUser;
  },

  // 获取角色显示名称
  getRoleDisplayName(role) {
    const roleDisplayNames = {
      'admin': '系统管理员',
      'executive': '管理决策层',
      'dispatcher': '调度员',
      'engineer': '建模工程师',
      'service': '客服专员',
      'analyst': '数据分析师'
    };
    return roleDisplayNames[role] || role;
  }
};

// 操作日志记录
const OperationLogger = {
  logs: [],
  
  // 添加日志
  log(action, details = {}) {
    const currentUser = UserPermissions.currentUser;
    if (!currentUser) {
      console.warn('OperationLogger: 无用户信息，跳过日志记录');
      return null;
    }
    
    const log = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      userId: currentUser.id,
      action: action,
      details: details,
      ip: '192.168.1.100' // 模拟IP
    };
    
    this.logs.push(log);
    this.saveToLocal();
    this.notifyListeners(log);
    return log;
  },

  // 保存到本地存储
  saveToLocal() {
    localStorage.setItem('operation_logs', JSON.stringify(this.logs.slice(-1000)));
  },

  // 获取日志
  getLogs(filter = {}) {
    let logs = [...this.logs];
    
    if (filter.user) {
      logs = logs.filter(log => log.user === filter.user);
    }
    if (filter.action) {
      logs = logs.filter(log => log.action.includes(filter.action));
    }
    if (filter.dateFrom) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filter.dateFrom));
    }
    if (filter.dateTo) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filter.dateTo));
    }
    
    return logs;
  },

  // 监听器
  listeners: [],
  
  addListener(callback) {
    this.listeners.push(callback);
  },
  
  notifyListeners(log) {
    this.listeners.forEach(callback => callback(log));
  }
};

// 批量操作管理
const BatchOperationManager = {
  selectedItems: new Set(),
  
  // 选择项目
  select(id) {
    this.selectedItems.add(id);
    this.updateUI();
  },
  
  // 取消选择
  unselect(id) {
    this.selectedItems.delete(id);
    this.updateUI();
  },
  
  // 全选
  selectAll(ids) {
    ids.forEach(id => this.selectedItems.add(id));
    this.updateUI();
  },
  
  // 清空选择
  clearSelection() {
    this.selectedItems.clear();
    this.updateUI();
  },
  
  // 获取选中项
  getSelected() {
    return Array.from(this.selectedItems);
  },
  
  // 更新UI
  updateUI() {
    // 更新批量操作工具栏
    const toolbar = document.querySelector('.batch-toolbar');
    const count = this.selectedItems.size;
    
    if (toolbar) {
      if (count > 0) {
        toolbar.style.display = 'flex';
        toolbar.querySelector('.batch-count').textContent = count;
      } else {
        toolbar.style.display = 'none';
      }
    }
    
    // 更新复选框状态
    document.querySelectorAll('[data-batch-id]').forEach(element => {
      const id = element.dataset.batchId;
      const checkbox = element.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = this.selectedItems.has(id);
      }
    });
  }
};

// 主题管理
const ThemeManager = {
  init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  },
  
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // 更新主题切换按钮（支持旧的内联按钮和新的悬浮按钮）
    const themeToggle = document.querySelector('.theme-toggle');
    const themeToggleFloat = document.querySelector('.theme-toggle-float');
    
    const iconHTML = theme === 'dark' 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
    
    if (themeToggle) {
      themeToggle.innerHTML = iconHTML;
    }
    
    if (themeToggleFloat) {
      themeToggleFloat.innerHTML = iconHTML;
    }
  },
  
  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    
    // 更新粒子流系统颜色（如果存在）
    if (typeof particleFlowSystem !== 'undefined' && particleFlowSystem && particleFlowSystem.updateColors) {
      particleFlowSystem.updateColors();
    }
  }
};

// 实时数据模拟
const RealTimeDataSimulator = {
  subscribers: new Map(),
  
  // 订阅数据更新
  subscribe(key, callback, interval = 5000) {
    if (this.subscribers.has(key)) {
      clearInterval(this.subscribers.get(key).timer);
    }
    
    const timer = setInterval(() => {
      const data = this.generateData(key);
      callback(data);
    }, interval);
    
    this.subscribers.set(key, { callback, timer });
    
    // 立即执行一次
    callback(this.generateData(key));
  },
  
  // 取消订阅
  unsubscribe(key) {
    if (this.subscribers.has(key)) {
      clearInterval(this.subscribers.get(key).timer);
      this.subscribers.delete(key);
    }
  },
  
  // 生成模拟数据
  generateData(key) {
    switch (key) {
      case 'kpi':
        return {
          waterSupply: (1200 + Math.random() * 100).toFixed(2),
          pressure: (98 + Math.random() * 2).toFixed(1),
          alerts: Math.floor(Math.random() * 10),
          tickets: Math.floor(Math.random() * 20)
        };
      case 'alerts':
        return Array.from({ length: 5 }, (_, i) => ({
          id: `alert_${Date.now()}_${i}`,
          type: ['压力异常', '流量波动', '水质预警'][Math.floor(Math.random() * 3)],
          location: `${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}区`,
          time: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
        }));
      default:
        return null;
    }
  }
};

// 协同功能
const CollaborationManager = {
  onlineUsers: [],
  
  // 初始化
  init() {
    // 模拟在线用户
    this.onlineUsers = [
      { id: 'user001', name: '张总', avatar: '👤', status: 'active' },
      { id: 'user002', name: '李工', avatar: '👷', status: 'active' },
      { id: 'user003', name: '王工', avatar: '👨‍💼', status: 'busy' }
    ];
    
    this.updateOnlineStatus();
  },
  
  // 更新在线状态
  updateOnlineStatus() {
    const indicator = document.querySelector('.online-users');
    if (indicator) {
      indicator.innerHTML = `
        <span class="collaboration-indicator">
          <i class="fas fa-users"></i>
          在线 ${this.onlineUsers.length}
        </span>
      `;
    }
  },
  
  // 添加协作标记
  addCollaborationMarker(elementId, userId) {
    const element = document.getElementById(elementId);
    if (element) {
      const user = this.onlineUsers.find(u => u.id === userId);
      if (user) {
        const marker = document.createElement('div');
        marker.className = 'collaboration-marker';
        marker.innerHTML = `${user.avatar} ${user.name}正在编辑`;
        element.appendChild(marker);
      }
    }
  }
};

// 通知管理
const NotificationManager = {
  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} slide-in`;
    notification.innerHTML = `
      <i class="fas fa-${this.getIcon(type)}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    const container = document.querySelector('.notification-container') || this.createContainer();
    container.appendChild(notification);
    
    if (duration > 0) {
      setTimeout(() => notification.remove(), duration);
    }
  },
  
  createContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(container);
    return container;
  },
  
  getIcon(type) {
    const icons = {
      info: 'info-circle',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'times-circle'
    };
    return icons[type] || 'info-circle';
  }
};

// 导出功能
const ExportManager = {
  exportToExcel(data, filename = 'export.xlsx') {
    // 模拟导出
    NotificationManager.show('正在准备Excel文件...', 'info');
    setTimeout(() => {
      NotificationManager.show('Excel导出成功！', 'success');
      OperationLogger.log('导出数据', { format: 'excel', filename });
    }, 1500);
  },
  
  exportToPDF(data, filename = 'export.pdf') {
    // 模拟导出
    NotificationManager.show('正在生成PDF报告...', 'info');
    setTimeout(() => {
      NotificationManager.show('PDF导出成功！', 'success');
      OperationLogger.log('导出数据', { format: 'pdf', filename });
    }, 2000);
  },
  
  exportToCSV(data, filename = 'export.csv') {
    // 实际的CSV导出
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    NotificationManager.show('CSV导出成功！', 'success');
    OperationLogger.log('导出数据', { format: 'csv', filename });
  },
  
  convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }
};

// 智能提示
const AIAssistant = {
  suggestions: {
    dashboard: [
      { title: '异常检测', text: 'B区夜间用水量增长23%，建议安排巡检', type: 'warning' },
      { title: '优化建议', text: '根据历史数据，建议调整C区供水压力', type: 'info' }
    ],
    monitor: [
      { title: '设备预警', text: 'PS002泵站运行时间超过推荐值，建议维护', type: 'warning' }
    ]
  },
  
  getSuggestions(page) {
    return this.suggestions[page] || [];
  },
  
  showSuggestion(suggestion) {
    const container = document.querySelector('.ai-suggestions');
    if (!container) return;
    
    const element = document.createElement('div');
    element.className = 'ai-suggestion fade-in';
    element.innerHTML = `
      <i class="fas fa-robot ai-suggestion-icon"></i>
      <div class="ai-suggestion-content">
        <div class="ai-suggestion-title">${suggestion.title}</div>
        <div class="ai-suggestion-text">${suggestion.text}</div>
      </div>
      <button class="btn btn-sm" onclick="AIAssistant.applySuggestion('${suggestion.title}')">
        应用建议
      </button>
    `;
    
    container.appendChild(element);
  },
  
  applySuggestion(title) {
    NotificationManager.show(`已应用建议：${title}`, 'success');
    OperationLogger.log('应用AI建议', { suggestion: title });
  }
};

// 全局告警效果管理器
const GlobalAlertManager = {
  // 告警状态
  alertStates: {
    high: false,
    medium: false,
    low: false,
    system: false
  },

  // 初始化告警效果
  init() {
    // 只在dashboard页面启用全局告警效果
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'dashboard.html') {
      return;
    }
    
    this.createGlobalStyles();
    this.startAlertSimulation();
    
    // 监听用户变化事件
    window.addEventListener('userChanged', (e) => {
      this.updateUserSpecificAlerts(e.detail);
    });
  },

  // 创建告警样式 - 仅保留浮动窗口样式
  createGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
              /* 页面级别告警状态指示器 - 浮动窗口 */
        .page-alert-indicator {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 10000;
          background: rgba(255, 56, 56, 0.9);
          color: white;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          animation: alertIndicatorPulse 2s ease-in-out infinite;
          display: none;
          max-width: 280px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .page-alert-indicator:hover {
          animation-play-state: paused;
          transform: scale(1.02);
        }
        
        .page-alert-indicator .close-btn {
          position: absolute;
          top: 4px;
          right: 6px;
          background: none;
          border: none;
          color: white;
          font-size: 14px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }
        
        .page-alert-indicator .close-btn:hover {
          opacity: 1;
        }
        
        @keyframes alertIndicatorPulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
    `;
    document.head.appendChild(style);
  },

  // 启动告警模拟
  startAlertSimulation() {
    // 模拟告警状态变化
    setInterval(() => {
      const currentUser = UserPermissions.currentUser;
      
      // 基于用户角色生成不同的告警
      if (currentUser.role === 'dispatcher' || currentUser.role === 'executive') {
        this.simulateHighPriorityAlerts();
      } else if (currentUser.role === 'engineer') {
        this.simulateSystemAlerts();
      } else if (currentUser.role === 'service') {
        this.simulateCustomerAlerts();
      }
      
      this.updateGlobalAlertEffects();
    }, 8000); // 每8秒更新一次告警状态
  },

  // 模拟高优先级告警
  simulateHighPriorityAlerts() {
    this.alertStates.high = Math.random() < 0.3; // 30%概率有高优先级告警
    this.alertStates.medium = Math.random() < 0.6; // 60%概率有中等告警
  },

  // 模拟系统告警
  simulateSystemAlerts() {
    this.alertStates.system = Math.random() < 0.2; // 20%概率有系统告警
    this.alertStates.medium = Math.random() < 0.4; // 40%概率有中等告警
  },

  // 模拟客户告警
  simulateCustomerAlerts() {
    this.alertStates.low = Math.random() < 0.8; // 80%概率有客户相关告警
  },

  // 更新全局告警效果 - 仅保留浮动窗口提示，移除发光效果
  updateGlobalAlertEffects() {
    // 移除所有现有告警类（清理之前的发光效果）
    document.querySelectorAll('.global-alert-high, .global-alert-medium, .global-alert-low').forEach(el => {
      el.classList.remove('global-alert-high', 'global-alert-medium', 'global-alert-low');
    });

    // 移除告警图标动效
    document.querySelectorAll('.alert-icon-pulse').forEach(el => {
      el.classList.remove('alert-icon-pulse');
    });

    // 仅显示浮动窗口告警指示器，不添加发光效果
    if (this.alertStates.high) {
      this.showPageAlertIndicator('HIGH', '高优先级告警');
    } else if (this.alertStates.medium) {
      this.showPageAlertIndicator('MEDIUM', '中等优先级告警');
    } else if (this.alertStates.low) {
      this.showPageAlertIndicator('LOW', '低优先级告警');
    } else {
      this.hidePageAlertIndicator();
    }

    // 更新导航栏告警状态（保留导航提示）
    this.updateNavAlertStatus();
  },

  // 显示页面告警指示器
  showPageAlertIndicator(level, message) {
    let indicator = document.querySelector('.page-alert-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'page-alert-indicator';
      document.body.appendChild(indicator);
    }
    
    // 根据告警级别设置不同颜色
    let bgColor, icon;
    switch (level) {
      case 'HIGH':
        bgColor = 'rgba(255, 56, 56, 0.9)';
        icon = 'fas fa-exclamation-triangle';
        break;
      case 'MEDIUM':
        bgColor = 'rgba(255, 168, 2, 0.9)';
        icon = 'fas fa-exclamation-circle';
        break;
      case 'LOW':
        bgColor = 'rgba(0, 210, 211, 0.9)';
        icon = 'fas fa-info-circle';
        break;
      default:
        bgColor = 'rgba(74, 144, 184, 0.9)';
        icon = 'fas fa-bell';
    }
    
    indicator.style.background = bgColor;
    indicator.innerHTML = `
      <i class="${icon}" style="margin-right: 8px;"></i>
      ${message}
      <button class="close-btn" onclick="this.parentElement.style.display='none'">
        <i class="fas fa-times"></i>
      </button>
    `;
    indicator.style.display = 'block';
  },

  // 隐藏页面告警指示器
  hidePageAlertIndicator() {
    const indicator = document.querySelector('.page-alert-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  },

  // 更新导航栏告警状态
  updateNavAlertStatus() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop();
    
    // 重置导航栏状态
    navLinks.forEach(link => {
      link.classList.remove('nav-alert');
    });

    // 根据告警状态添加导航提示
    if (this.alertStates.high || this.alertStates.medium) {
      const monitorLink = document.querySelector('a[href="monitor.html"]');
      const dispatchLink = document.querySelector('a[href="dispatch_emergency.html"]');
      
      if (monitorLink && currentPage !== 'monitor.html') {
        monitorLink.classList.add('nav-alert');
      }
      
      if (dispatchLink && currentPage !== 'dispatch_emergency.html') {
        dispatchLink.classList.add('nav-alert');
      }
    }
  },

  // 基于用户更新告警
  updateUserSpecificAlerts(userInfo) {
    // 根据用户角色调整告警策略
    console.log('更新用户特定告警:', userInfo.role);
  },

  // 手动触发告警
  triggerAlert(type, element) {
    if (element) {
      element.classList.add(`global-alert-${type}`);
      setTimeout(() => {
        element.classList.remove(`global-alert-${type}`);
      }, 5000);
    }
  }
};

// HK Example 数据管理器
const HKExampleManager = {
  // 数据存储
  data: {
    junctions: [],
    pipes: [],
    pumps: [],
    valves: [],
    tanks: [],
    loaded: false
  },

  // 初始化
  init() {
    this.loadHKExampleData();
  },

  // 加载HK Example数据
  async loadHKExampleData() {
    try {
      // 尝试从多个路径加载数据文件
      const possiblePaths = [
        'DATA/HK%20Example.inp',
        'HKExample.inp', 
        'DATA/香港咸水管网Example.inp',
        'HKExample.txt'
      ];

      let fileContent = null;
      
      for (const path of possiblePaths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            fileContent = await response.text();
            console.log(`成功加载 HK Example 数据从: ${path}`);
            break;
          }
        } catch (e) {
          console.log(`无法从 ${path} 加载数据:`, e.message);
        }
      }

      if (!fileContent) {
        // 如果无法加载文件，使用内置的示例数据
        console.log('使用内置的 HK Example 数据');
        fileContent = this.getBuiltInData();
      }

      this.parseINPFile(fileContent);
      this.data.loaded = true;
      
      // 触发数据加载完成事件
      window.dispatchEvent(new CustomEvent('hkExampleLoaded', { 
        detail: this.data 
      }));
      
      return this.data;
    } catch (error) {
      console.error('加载 HK Example 数据失败:', error);
      NotificationManager.show('HK Example 数据加载失败，使用示例数据', 'warning');
      this.loadFallbackData();
    }
  },

  // 解析INP文件
  parseINPFile(content) {
    const sections = this.parseSections(content);
    
    // 解析节点
    if (sections.JUNCTIONS) {
      this.data.junctions = this.parseJunctions(sections.JUNCTIONS);
    }
    
    // 解析管道
    if (sections.PIPES) {
      this.data.pipes = this.parsePipes(sections.PIPES);
    }
    
    // 解析泵站
    if (sections.PUMPS) {
      this.data.pumps = this.parsePumps(sections.PUMPS);
    }
    
    // 解析阀门
    if (sections.VALVES) {
      this.data.valves = this.parseValves(sections.VALVES);
    }
    
    // 解析水箱
    if (sections.TANKS || sections.RESERVOIRS) {
      this.data.tanks = this.parseTanks(sections.TANKS || sections.RESERVOIRS);
    }
    
    console.log('HK Example 数据解析完成:', this.data);
  },

  // 解析文件段落
  parseSections(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = null;
    let sectionData = [];
    
    for (let line of lines) {
      line = line.trim();
      
      // 跳过注释和空行
      if (!line || line.startsWith(';')) continue;
      
      // 检查是否是新段落
      if (line.startsWith('[') && line.endsWith(']')) {
        // 保存前一个段落
        if (currentSection && sectionData.length > 0) {
          sections[currentSection] = sectionData;
        }
        
        // 开始新段落
        currentSection = line.slice(1, -1);
        sectionData = [];
      } else if (currentSection) {
        sectionData.push(line);
      }
    }
    
    // 保存最后一个段落
    if (currentSection && sectionData.length > 0) {
      sections[currentSection] = sectionData;
    }
    
    return sections;
  },

  // 解析节点数据
  parseJunctions(data) {
    const junctions = [];
    for (const line of data) {
      if (!line.trim() || line.includes(';ID')) continue;
      
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        junctions.push({
          id: parts[0],
          elevation: parseFloat(parts[1]) || 0,
          demand: parseFloat(parts[2]) || 0,
          x: Math.random() * 800 + 100, // 模拟坐标
          y: Math.random() * 600 + 100
        });
      }
    }
    return junctions;
  },

  // 解析管道数据
  parsePipes(data) {
    const pipes = [];
    for (const line of data) {
      if (!line.trim() || line.includes(';ID')) continue;
      
      const parts = line.split(/\s+/);
      if (parts.length >= 7) {
        pipes.push({
          id: parts[0],
          node1: parts[1],
          node2: parts[2],
          length: parseFloat(parts[3]) || 0,
          diameter: parseFloat(parts[4]) || 0,
          roughness: parseFloat(parts[5]) || 110,
          status: parts[7] || 'Open'
        });
      }
    }
    return pipes;
  },

  // 解析泵站数据
  parsePumps(data) {
    const pumps = [];
    for (const line of data) {
      if (!line.trim() || line.includes(';ID')) continue;
      
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        pumps.push({
          id: parts[0],
          node1: parts[1],
          node2: parts[2],
          parameters: parts.slice(3).join(' ')
        });
      }
    }
    return pumps;
  },

  // 解析阀门数据
  parseValves(data) {
    const valves = [];
    for (const line of data) {
      if (!line.trim() || line.includes(';ID')) continue;
      
      const parts = line.split(/\s+/);
      if (parts.length >= 6) {
        valves.push({
          id: parts[0],
          node1: parts[1],
          node2: parts[2],
          diameter: parseFloat(parts[3]) || 0,
          type: parts[4],
          setting: parseFloat(parts[5]) || 0
        });
      }
    }
    return valves;
  },

  // 解析水箱数据
  parseTanks(data) {
    const tanks = [];
    for (const line of data) {
      if (!line.trim() || line.includes(';ID')) continue;
      
      const parts = line.split(/\s+/);
      if (parts.length >= 7) {
        tanks.push({
          id: parts[0],
          elevation: parseFloat(parts[1]) || 0,
          initLevel: parseFloat(parts[2]) || 0,
          minLevel: parseFloat(parts[3]) || 0,
          maxLevel: parseFloat(parts[4]) || 0,
          diameter: parseFloat(parts[5]) || 0
        });
      }
    }
    return tanks;
  },

  // 获取内置数据（当文件加载失败时使用）
  getBuiltInData() {
    return `[TITLE]
HK Example Network

[JUNCTIONS]
;ID                 Elev            Demand          Pattern         
 S00145-11SE14B     5.340311        0                                   
 S00002-11SE14C     5.881317        0                                   
 S01097-11SE19A     43.649142       0                                   
 S00027-11SE14A     5.386212        0                                   
 S00036-11SE14C     7.449674        0                                   
 S01080-11SE19B     3.853642        0                                   

[PIPES]
;ID                 Node1               Node2               Length          Diameter        Roughness       MinorLoss       Status
 P001               S00145-11SE14B      S00002-11SE14C      100             200             110             0               Open   
 P002               S00002-11SE14C      S01097-11SE19A      150             200             110             0               Open   
 P003               S01097-11SE19A      S00027-11SE14A      200             150             110             0               Open   

[PUMPS]
;ID                 Node1               Node2               Parameters
 PUMP001            S00036-11SE14C      S01080-11SE19B      HEAD CURVE1      

[RESERVOIRS]
;ID                 Head            Pattern         
 RESERVOIR1         50              
`;
  },

  // 加载后备数据
  loadFallbackData() {
    this.data = {
      junctions: [
        { id: 'J001', elevation: 10, demand: 0, x: 200, y: 200 },
        { id: 'J002', elevation: 15, demand: 50, x: 400, y: 200 },
        { id: 'J003', elevation: 20, demand: 30, x: 600, y: 200 }
      ],
      pipes: [
        { id: 'P001', node1: 'J001', node2: 'J002', length: 200, diameter: 300, status: 'Open' },
        { id: 'P002', node1: 'J002', node2: 'J003', length: 200, diameter: 250, status: 'Open' }
      ],
      pumps: [
        { id: 'PUMP001', node1: 'J001', node2: 'J002', parameters: 'HEAD CURVE1' }
      ],
      valves: [],
      tanks: [
        { id: 'TANK001', elevation: 50, initLevel: 10, minLevel: 2, maxLevel: 20, diameter: 30 }
      ],
      loaded: true
    };
    
    window.dispatchEvent(new CustomEvent('hkExampleLoaded', { 
      detail: this.data 
    }));
  },

  // 渲染网络到SVG
  renderNetworkToSVG(svgElement, options = {}) {
    if (!this.data.loaded) {
      console.warn('HK Example 数据尚未加载');
      return;
    }

    const defaults = {
      width: 800,
      height: 600,
      nodeRadius: 4,
      pipeWidth: 2,
      showLabels: false
    };
    
    const config = { ...defaults, ...options };
    
    // 清空SVG
    svgElement.innerHTML = '';
    svgElement.setAttribute('viewBox', `0 0 ${config.width} ${config.height}`);
    
    // 创建管道图层
    const pipeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pipeGroup.setAttribute('class', 'pipes-layer');
    
    // 创建节点图层
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('class', 'nodes-layer');
    
    // 渲染管道
    this.data.pipes.forEach(pipe => {
      const node1 = this.data.junctions.find(j => j.id === pipe.node1);
      const node2 = this.data.junctions.find(j => j.id === pipe.node2);
      
      if (node1 && node2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', node1.x);
        line.setAttribute('y1', node1.y);
        line.setAttribute('x2', node2.x);
        line.setAttribute('y2', node2.y);
        line.setAttribute('stroke', pipe.status === 'Open' ? '#4A90B8' : '#ff3838');
        line.setAttribute('stroke-width', config.pipeWidth);
        line.setAttribute('class', 'pipe');
        line.setAttribute('data-pipe-id', pipe.id);
        line.setAttribute('title', `管道 ${pipe.id} - 直径: ${pipe.diameter}mm`);
        
        pipeGroup.appendChild(line);
      }
    });
    
    // 渲染节点
    this.data.junctions.forEach(junction => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', junction.x);
      circle.setAttribute('cy', junction.y);
      circle.setAttribute('r', config.nodeRadius);
      circle.setAttribute('fill', junction.demand > 0 ? '#2ed573' : '#747d8c');
      circle.setAttribute('stroke', '#2f3542');
      circle.setAttribute('stroke-width', 1);
      circle.setAttribute('class', 'junction');
      circle.setAttribute('data-device-id', junction.id);
      circle.setAttribute('title', `节点 ${junction.id} - 标高: ${junction.elevation}m`);
      
      nodeGroup.appendChild(circle);
      
      // 添加标签（如果启用）
      if (config.showLabels) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', junction.x + 8);
        text.setAttribute('y', junction.y - 8);
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', '#2f3542');
        text.textContent = junction.id;
        nodeGroup.appendChild(text);
      }
    });
    
    // 渲染泵站
    this.data.pumps.forEach(pump => {
      const node1 = this.data.junctions.find(j => j.id === pump.node1);
      if (node1) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', node1.x - 6);
        rect.setAttribute('y', node1.y - 6);
        rect.setAttribute('width', 12);
        rect.setAttribute('height', 12);
        rect.setAttribute('fill', '#ffa502');
        rect.setAttribute('stroke', '#2f3542');
        rect.setAttribute('stroke-width', 1);
        rect.setAttribute('class', 'pump');
        rect.setAttribute('data-device-id', pump.id);
        rect.setAttribute('title', `泵站 ${pump.id}`);
        
        nodeGroup.appendChild(rect);
      }
    });
    
    // 添加图层到SVG
    svgElement.appendChild(pipeGroup);
    svgElement.appendChild(nodeGroup);
    
    // 添加交互事件
    this.addSVGInteractions(svgElement);
    
    console.log('HK Example 网络渲染完成');
  },

  // 添加SVG交互
  addSVGInteractions(svgElement) {
    // 管道点击事件
    svgElement.querySelectorAll('.pipe').forEach(pipe => {
      pipe.addEventListener('click', (e) => {
        e.stopPropagation();
        const pipeId = pipe.getAttribute('data-pipe-id');
        this.selectPipe(pipe, pipeId);
      });
    });
    
    // 节点点击事件
    svgElement.querySelectorAll('.junction, .pump').forEach(node => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const deviceId = node.getAttribute('data-device-id');
        this.selectDevice(node, deviceId);
      });
    });
  },

  // 选择管道
  selectPipe(pipeElement, pipeId) {
    // 清除之前的选择
    document.querySelectorAll('.pipe').forEach(p => {
      p.setAttribute('stroke-width', '2');
      p.style.filter = '';
    });
    
    // 高亮选中的管道
    pipeElement.setAttribute('stroke-width', '4');
    pipeElement.style.filter = 'drop-shadow(0 0 8px #FFD700)';
    
    // 显示管道信息
    const pipeData = this.data.pipes.find(p => p.id === pipeId);
    if (pipeData) {
      NotificationManager.show(`选择管道 ${pipeId} - 直径:${pipeData.diameter}mm 长度:${pipeData.length}m`, 'info');
      OperationLogger.log('选择管道', { pipeId, data: pipeData });
    }
  },

  // 选择设备
  selectDevice(deviceElement, deviceId) {
    // 清除之前的选择
    document.querySelectorAll('.junction, .pump').forEach(d => {
      d.style.filter = '';
    });
    
    // 高亮选中的设备
    deviceElement.style.filter = 'drop-shadow(0 0 12px #FFD700)';
    
    // 显示设备信息
    const deviceData = this.data.junctions.find(j => j.id === deviceId) || 
                      this.data.pumps.find(p => p.id === deviceId);
    if (deviceData) {
      NotificationManager.show(`选择设备 ${deviceId}`, 'info');
      OperationLogger.log('选择设备', { deviceId, data: deviceData });
    }
  },

  // 获取统计信息
  getStatistics() {
    return {
      junctions: this.data.junctions.length,
      pipes: this.data.pipes.length,
      pumps: this.data.pumps.length,
      valves: this.data.valves.length,
      tanks: this.data.tanks.length,
      totalLength: this.data.pipes.reduce((sum, pipe) => sum + pipe.length, 0),
      avgDiameter: this.data.pipes.length > 0 ? 
        this.data.pipes.reduce((sum, pipe) => sum + pipe.diameter, 0) / this.data.pipes.length : 0
    };
  }
};

// 导航菜单管理器
const NavigationManager = {
  // 统一一级菜单结构 - 按照用户要求的顺序排列
  unifiedMenus: ['dashboard', 'monitor', 'dispatch', 'water', 'risk_health', 'ai', 'tickets', 'reports', 'admin'],
  
  // 角色配置 - 按照用户要求重新优化权限
  roleConfig: {
    'admin': {
      title: '系统管理员控制台',
      defaultPage: 'admin.html',
      permissions: {
        'dashboard': 'active',     // ✓ 系统管理员
        'monitor': 'active',       // ✓ 系统管理员
        'dispatch_emergency': 'active', // ✓ 系统管理员
        'daily_dispatch': 'active',     // ✓ 系统管理员
        'tickets': 'active',       // ✓ 系统管理员
        'simulation': 'active',    // ✓ 系统管理员
        'historical_comparison': 'active', // ✓ 系统管理员
        'analysis_summary': 'active',      // ✓ 系统管理员
        'water_quality': 'active', // ✓ 系统管理员
        'reports': 'active',       // ✓ 系统管理员
        'admin': 'active'          // ✓ 系统管理员
      }
    },
    'dispatcher': {
      title: '调度指挥中心',
      defaultPage: 'daily_dispatch.html',
      permissions: {
        'dashboard': 'active',
        'monitor': 'active',
        'dispatch_emergency': 'active',
        'daily_dispatch': 'active',
        'tickets': 'active',
        'simulation': 'active',
        'historical_comparison': 'active', // ✓ 调度员需要对比历史方案
        'analysis_summary': 'active',      // ✓ 调度员需要完整权限
        'water_quality': 'active',
        'water': 'active',
        'risk_health': 'active',
        'ai': 'active',
        'reports': 'active',
        'admin': 'hidden'
      }
    },
    'engineer': {
      title: '建模运维工作台',
      defaultPage: 'simulation.html',
      permissions: {
        'dashboard': 'active',
        'monitor': 'active',
        'dispatch_emergency': 'view',
        'daily_dispatch': 'disabled',
        'tickets': 'active', // 工程师也需要处理工单
        'simulation': 'active',
        'historical_comparison': 'active', // ✓ 建模工程师需要历史对比
        'analysis_summary': 'active',      // ✓ 建模工程师需要数据分析
        'water_quality': 'active',
        'water': 'active',
        'risk_health': 'active',
        'ai': 'active',
        'reports': 'active',
        'admin': 'hidden'
      }
    },
    'analyst': {
      title: '信息部数据中心',
      defaultPage: 'reports.html',
      permissions: {
        'dashboard': 'active',
        'monitor': 'active',
        'dispatch_emergency': 'disabled',
        'daily_dispatch': 'disabled',
        'tickets': 'disabled', // 信息部不处理工单
        'simulation': 'disabled',
        'historical_comparison': 'active', // ✓ 数据分析师需要历史对比
        'analysis_summary': 'active',      // ✓ 数据分析师核心功能
        'water_quality': 'disabled',
        'water': 'view',
        'risk_health': 'view',
        'ai': 'active',
        'reports': 'active',
        'admin': 'hidden'
      }
    },
    'service': {
      title: '客服服务中心',
      defaultPage: 'tickets.html',
      permissions: {
        'dashboard': 'disabled',
        'monitor': 'disabled',
        'dispatch_emergency': 'disabled',
        'daily_dispatch': 'disabled',
        'tickets': 'active', // 客服核心功能
        'simulation': 'disabled',
        'historical_comparison': 'disabled', // 客服不需要
        'analysis_summary': 'disabled',      // 客服不需要
        'water_quality': 'view',
        'reports': 'disabled',
        'admin': 'hidden'
      }
    },
    'executive': {
      title: '管理决策驾驶舱',
      defaultPage: 'dashboard.html',
      permissions: {
        'dashboard': 'active',
        'monitor': 'view',
        'dispatch_emergency': 'view',
        'daily_dispatch': 'view',
        'tickets': 'view', // 管理层查看工单
        'simulation': 'view',
        'historical_comparison': 'view',   // ✓ 管理层查看历史对比
        'analysis_summary': 'active',     // ✓ 管理层需要数据分析
        'water_quality': 'view',
        'water': 'view',
        'risk_health': 'view',
        'ai': 'active',
        'reports': 'active',
        'admin': 'view'
      }
    }
  },

  // 统一菜单定义 - 简化结构
  menuDefinitions: {
    'dashboard': { 
      href: 'dashboard.html', 
      label: '运营总览', 
      icon: 'fas fa-tachometer-alt',
      description: '全局KPI监控和态势感知'
    },
    'monitor': { 
      href: 'monitor.html', 
      label: '实时监控', 
      icon: 'fas fa-desktop',
      description: '设备状态和参数监控'
    },
    'dispatch_emergency': { 
      href: 'dispatch_emergency.html', 
      label: '调度应急', 
      icon: 'fas fa-broadcast-tower',
      description: '应急预案和紧急调度'
    },
    'daily_dispatch': { 
      href: 'daily_dispatch.html', 
      label: '日常调度', 
      icon: 'fas fa-calendar-alt',
      description: '日常调度计划和操作管理'
    },
    'dispatch': {
      href: 'dispatch_portal.html',
      label: '调度管理',
      icon: 'fas fa-route',
      description: '计划、执行与应急调度的一站式工作台'
    },
    'simulation': { 
      href: 'simulation.html', 
      label: '仿真模拟', 
      icon: 'fas fa-flask',
      description: '水力模型仿真和调度分析'
    },
    'historical_comparison': { 
      href: 'historical_comparison.html', 
      label: '历史工况对比', 
      icon: 'fas fa-history',
      description: '历史方案对比分析'
    },
    'analysis_summary': { 
      href: 'analysis_summary.html', 
      label: '数据分析', 
      icon: 'fas fa-chart-pie',
      description: '数据分析与经验总结'
    },
    'water': { 
      href: 'water_portal.html', 
      label: '水质管理', 
      icon: 'fas fa-flask',
      description: '水质监测、趋势预测与污染溯源'
    },
    'risk_health': { 
      href: 'risk_health_portal.html', 
      label: '漏损与管网健康', 
      icon: 'fas fa-heartbeat',
      description: '漏损量化、压力优化与健康评估'
    },
    'ai': { 
      href: 'ai_portal.html', 
      label: '智能分析', 
      icon: 'fas fa-brain',
      description: '仿真推演与智能优化专题分析'
    },
    'tickets': { 
      href: 'tickets.html', 
      label: '工单中心', 
      icon: 'fas fa-ticket-alt',
      description: '工单管理和任务流转'
    },
    'water_quality': { 
      href: 'water_quality.html', 
      label: '水质溯源', 
      icon: 'fas fa-microscope',
      description: '水质分析和污染溯源'
    },
    'reports': { 
      href: 'reports.html', 
      label: '数据报表', 
      icon: 'fas fa-chart-bar',
      description: '报表生成和数据分析'
    },
    'admin': { 
      href: 'admin.html', 
      label: '系统管理', 
      icon: 'fas fa-cogs',
      description: '系统配置和用户管理'
    }
  },

  // 初始化导航
  init() {
    console.log('NavigationManager: 开始初始化');
    
    // 等待DOM完全加载后再初始化
    const initializeNavigation = () => {
      const navLinksContainer = document.querySelector('.nav-links');
      const user = UserPermissions.currentUser;
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      
      if (navLinksContainer) {
        if (user) {
          console.log('NavigationManager: DOM元素和用户信息已找到，开始更新导航');
          this.updateNavigation();
          
          // 初始化页面权限控制
          const pageType = this.getPageTypeFromFilename(currentPage);
          if (pageType && typeof PermissionController !== 'undefined') {
            // 延迟执行权限控制，确保页面DOM完全加载
            setTimeout(() => {
              PermissionController.initPagePermissions(pageType);
            }, 500);
          }
        } else {
          // DOM已就绪但没有用户信息
          if (currentPage === 'login.html') {
            console.log('NavigationManager: 当前在登录页面，跳过用户检查');
            return;
          } else {
            console.log('NavigationManager: 没有用户信息，等待登录或重定向');
            // 不要无限重试，避免死循环
            return;
          }
        }
      } else {
        console.log('NavigationManager: DOM元素未就绪，延迟重试');
        setTimeout(initializeNavigation, 200);
      }
    };
    
    // 立即尝试，如果失败则延迟重试
    initializeNavigation();
    
    // 监听用户变化
    window.addEventListener('userChanged', () => {
      console.log('NavigationManager: 用户信息变化，重新更新导航');
      this.updateNavigation();
    });
    
    // 监听localStorage变化（当用户在其他页面设置时）
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentUser') {
        console.log('NavigationManager: localStorage用户信息变化');
        this.updateNavigation();
      }
    });
    
    // 页面加载完成后进行权限检查
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.redirectToRoleHomepage();
      }, 500);
    });
  },

  // 根据文件名获取页面类型
  getPageTypeFromFilename(filename) {
    const mapping = {
      'dashboard.html': 'dashboard',
      'dashboard_overview.html': 'dashboard',
      'monitor.html': 'monitor',
      'monitor_realtime_map.html': 'monitor',
      'daily_dispatch.html': 'daily_dispatch',
      'schedule_planning.html': 'daily_dispatch',
      'dispatch_workflow_builder.html': 'daily_dispatch',
      'dispatch_emergency.html': 'dispatch_emergency',
      'dispatch_emergency_main.html': 'dispatch_emergency',
      'simulation.html': 'simulation',
      'modeling_workspace.html': 'simulation',
      'model_maintenance.html': 'simulation',  // ✓ 添加模型维护页面映射
      'historical_comparison.html': 'historical_comparison',
      'analysis_summary.html': 'analysis_summary',
      'water_quality.html': 'water_quality',
      'water_portal.html': 'water',
      'risk_health_portal.html': 'risk_health',
      'ai_portal.html': 'ai',
      'dispatch_portal.html': 'dispatch',
      'quality_trace_analysis.html': 'water_quality',
      'reports.html': 'reports',
      'admin.html': 'admin',
      'system_admin_panel.html': 'admin',
      'tickets.html': 'tickets',
      'service_complaint_center.html': 'tickets'
    };
    return mapping[filename] || null;
  },

  // 更新导航菜单
  updateNavigation() {
    try {
      const user = UserPermissions.currentUser;
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      console.log('NavigationManager: 当前用户信息', user);
      
      if (!user || !user.role) {
        // 如果没有用户信息，检查是否在登录页
        if (currentPage === 'login.html') {
          console.log('NavigationManager: 当前在登录页面，跳过导航更新');
          return;
        } else {
          console.warn('NavigationManager: 没有找到用户信息，重定向到登录页');
          window.location.href = 'login.html';
          return;
        }
      }
      
      const roleConfig = this.roleConfig[user.role];
      if (!roleConfig) {
        console.warn(`NavigationManager: 找不到角色 ${user.role} 的配置`);
        return;
      }
      console.log('NavigationManager: 使用角色配置', roleConfig);
      
      // 更新页面标题
      this.updatePageTitle(roleConfig.title, user.name);
      
      // 更新导航链接
      this.updateNavLinks(roleConfig);
      
      // 更新用户信息显示
      this.updateUserDisplay(user);
    } catch (error) {
      console.error('NavigationManager: 更新导航失败', error);
      // 不要显示默认导航，避免显示错误的用户信息
    }
  },
  
  // 显示默认导航（错误时的fallback）
  showDefaultNavigation() {
    try {
      // 检查是否是登录页面
      const currentPage = window.location.pathname.split('/').pop();
      if (currentPage === 'login.html') {
        return; // 在登录页面不处理用户信息
      }
      
      // 如果没有用户信息且不在登录页，重定向到登录页
      if (!UserPermissions.currentUser) {
        console.log('NavigationManager: 无用户信息，重定向到登录页');
        window.location.href = 'login.html';
        return;
      }
      
      // 使用访客权限显示基本菜单
      const defaultConfig = {
        permissions: {
          'dashboard': 'view',
          'monitor': 'view',
          'dispatch_emergency': 'disabled',
          'daily_dispatch': 'disabled',
          'tickets': 'disabled',
          'water_quality': 'disabled',
          'reports': 'view',
          'admin': 'hidden'
        }
      };
      
      this.updateNavLinks(defaultConfig);
      
      // 如果有用户信息，使用真实用户信息；否则不显示用户信息
      const currentUser = UserPermissions.currentUser;
      if (currentUser) {
        this.updateUserDisplay(currentUser);
      }
      
      // 确保样式已加载
      this.addNavigationStyles();
    } catch (e) {
      console.error('NavigationManager: 显示默认导航失败', e);
    }
  },

  // 更新页面标题
  updatePageTitle(title, userName) {
    const brandElement = document.querySelector('.logo span');
    if (brandElement) {
      // 保持统一的系统名称，不因角色而改变
      brandElement.textContent = '智慧管网管理系统';
    }
    
    // 更新浏览器标题，包含角色工作台信息
    document.title = `${title} - ${userName}`;
  },
  


  // 更新导航链接 - 新版支持一级菜单+下拉二级，带 tooltip 与 RBAC
  updateNavLinks(roleConfig) {
    const navLinksContainer = document.querySelector('.nav-links');
    if (!navLinksContainer) { console.warn('NavigationManager: 找不到 .nav-links 容器'); return; }
    const self = this;
    const role = (window.__USER_ROLE__ || localStorage.getItem('rbacRole') || (UserPermissions.currentUser && UserPermissions.currentUser.role) || 'OPERATOR');

    function loadJSON(url){ return fetch(url, { cache: 'no-store' }).then(r=>r.json()); }

    function renderFromMenu(menu){
      try{
        navLinksContainer.innerHTML='';
        navLinksContainer.classList.add('nav2');
        const roleNorm = (window.RBAC && RBAC.normalizeRole) ? RBAC.normalizeRole(role) : String(role).toUpperCase();
        const whitelist = (window.RBAC && RBAC.getWhitelist) ? RBAC.getWhitelist(roleNorm) : null;
        const allow = function(path){ if(!whitelist) return true; if (roleNorm==='ADMIN') return true; if (whitelist.indexOf('*')>=0) return true; return whitelist.indexOf(path)>=0; };
        // 当前路径用于高亮
        var currentPathParam = new URLSearchParams(window.location.search||'').get('path');

        // 单级导航：每个一级菜单跳转 basePath 落地页
        menu.forEach(section=>{
          const a = document.createElement('a');
          a.className = 'nav-link';
          a.textContent = section.name;
          const base = section.basePath || (section.children && section.children[0] && section.children[0].path.split('/').slice(0,2).join('/'));
          if (!base) return;
          a.setAttribute('data-basepath', base);
          if (section.icon){ a.innerHTML = `<i class="${section.icon}"></i>${section.name}`; }
          // hover 解释：一级菜单 summary
          if (section.summary){ try{ if (window.TooltipWrapper){ TooltipWrapper.attach(a, section.summary); } else { a.title = section.summary; } }catch(e){ a.title = section.summary; } }

          // 首页驾驶舱：不使用 Router 跳转，直接停留/打开首页页面
          if (base === '/dashboard'){
            a.href = 'dashboard_overview.html';
            a.addEventListener('click', function(e){
              e.preventDefault();
              var currentPage = (window.location.pathname.split('/').pop() || 'index.html');
              if (currentPage === 'dashboard_overview.html' || currentPage === 'dashboard.html'){
                return; // 已经在首页驾驶舱，避免跳转
              }
              window.location.href = 'dashboard_overview.html';
            });
          } else {
            a.href = base;
            a.addEventListener('click', function(e){ e.preventDefault();
              if (window.Router && Router.navigateTo){ Router.navigateTo(base); return; }
              loadJSON('config/routes.json').then(rs=>{ const m = rs.find(r=>r.path===base); if(!m){ console.warn('未找到落地路由', base); const dash = rs.find(r=>r.path==='/dashboard'); window.location.href = (dash?dash.component:'dashboard_overview.html'); return; } window.location.href = m.component + '?path=' + encodeURIComponent(base); });
            });
          }

          // 选中视觉：当 URL 中 path 属于该 basePath 时高亮
          if (currentPathParam && (currentPathParam === base || currentPathParam.indexOf(base + '/') === 0)){
            a.classList.add('active');
          } else {
            // 当直接处于首页驾驶舱文件时，高亮首页
            var cp = (window.location.pathname.split('/').pop() || 'index.html');
            if (base === '/dashboard' && (cp === 'dashboard_overview.html' || cp === 'dashboard.html')){
              a.classList.add('active');
            }
          }

          navLinksContainer.appendChild(a);
        });
        try{ if (window.TooltipWrapper){ TooltipWrapper.attachForMenu(navLinksContainer.querySelectorAll('.nav-link'), menu); } }catch(e){}
        self.addNavigationStyles();
      }catch(err){ console.error('渲染新菜单失败，回退旧菜单', err); renderFallback(); }
    }

    function renderFallback(){
      navLinksContainer.innerHTML='';
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      self.unifiedMenus.forEach(menuKey=>{
        const menuDef = self.menuDefinitions[menuKey]; if(!menuDef) return;
        const permission = roleConfig.permissions[menuKey] || 'hidden'; if (permission==='hidden') return;
        const link=document.createElement('a'); link.className='nav-link'; link.title=menuDef.description; link.innerHTML=`<i class="${menuDef.icon}"></i>${menuDef.label}`;
        switch(permission){
          case 'active': link.href=menuDef.href; link.classList.add('nav-active'); break;
          case 'view': link.href=menuDef.href; link.classList.add('nav-view'); link.innerHTML=`<i class="${menuDef.icon}"></i>${menuDef.label}<i class="fas fa-eye nav-view-icon"></i>`; break;
          case 'disabled': link.href='#'; link.classList.add('nav-disabled'); link.innerHTML=`<i class=\"${menuDef.icon}\"></i>${menuDef.label}<i class=\"fas fa-lock nav-lock-icon\"></i>`; link.onclick=(e)=>{e.preventDefault(); NotificationManager.show('您没有权限访问此功能','warning');}; break;
          case 'notify': link.href=menuDef.href; link.classList.add('nav-notify'); link.innerHTML+='<span class="nav-notification-dot"></span>'; break;
        }
        if (currentPage===menuDef.href || currentPage===menuDef.href.split('/').pop()) link.classList.add('active');
        navLinksContainer.appendChild(link);
      });
      self.addNavigationStyles();
    }

    fetch('config/menu.json', { cache: 'no-store' })
      .then(r=> r.ok ? r.json() : Promise.reject('menu.json not found'))
      .then(menu => renderFromMenu(menu))
      .catch(()=> renderFallback());
  },

  // 更新用户显示
  updateUserDisplay(user) {
    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(element => {
      element.innerHTML = `
        <div class="user-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="user-details">
          <div class="user-name">${user.name}</div>
          <div class="user-role">${UserPermissions.getRoleDisplayName(user.role)}</div>
        </div>
      `;
    });
  },

  // 添加导航样式
  addNavigationStyles() {
    if (document.querySelector('#navigation-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'navigation-styles';
    style.textContent = `
      /* 导航链接基础样式 */
      .nav-links { display:flex; align-items:center; gap:8px; }
      
      .nav-link {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px; /* 稍微减少内边距，节省空间 */
        color: var(--text-primary, #333);
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.3s ease;
        white-space: nowrap;
        position: relative;
        font-weight: 500;
        background: transparent;
        border: 1px solid transparent;
      }
      
      .nav-link:hover {
        background: rgba(74, 144, 184, 0.12);
        color: var(--primary, #4A90B8);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(74, 144, 184, 0.15);
        border-color: rgba(74, 144, 184, 0.2);
      }
      
      .nav-link.active {
        background: linear-gradient(135deg, rgba(74, 144, 184, 0.2) 0%, rgba(74, 144, 184, 0.1) 100%);
        color: var(--primary, #4A90B8);
        font-weight: 600;
        border-color: rgba(74, 144, 184, 0.3);
        box-shadow: 0 2px 8px rgba(74, 144, 184, 0.2);
      }
      
      .nav-highlight {
        background: linear-gradient(135deg, rgba(74, 144, 184, 0.15) 0%, rgba(74, 144, 184, 0.08) 100%) !important;
        border: 1px solid rgba(74, 144, 184, 0.25) !important;
        position: relative;
      }
      
      .nav-highlight::before {
        content: '';
        position: absolute;
        top: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        height: 3px;
        background: linear-gradient(90deg, transparent, var(--primary, #4A90B8), transparent);
        border-radius: 2px;
      }
      
      .permission-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: linear-gradient(135deg, rgba(255, 168, 2, 0.2) 0%, rgba(255, 168, 2, 0.1) 100%);
        color: var(--warning, #ffa502);
        font-size: 10px;
        padding: 3px 8px;
        border-radius: 12px;
        margin-left: 8px;
        font-weight: 600;
        border: 1px solid rgba(255, 168, 2, 0.3);
        text-shadow: 0 1px 2px rgba(255, 168, 2, 0.3);
        animation: badgePulse 2s ease-in-out infinite;
      }
      
      /* 权限状态样式 */
      .nav-active {
        /* 正常可点击状态 */
      }
      
      .nav-view {
        /* 只读状态，颜色稍淡 */
        opacity: 0.85;
        background: rgba(74, 144, 184, 0.08);
        border: 1px solid rgba(74, 144, 184, 0.15);
      }
      
      .nav-view:hover {
        background: rgba(74, 144, 184, 0.12) !important;
        border-color: rgba(74, 144, 184, 0.25) !important;
      }
      
      .nav-view-icon {
        font-size: 11px;
        color: #74a9d8;
        margin-left: 6px;
        opacity: 0.7;
      }
      
      .nav-disabled {
        /* 禁用状态，置灰 */
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: auto; /* 允许点击以显示提示 */
        background: rgba(128, 128, 128, 0.1);
        border: 1px solid rgba(128, 128, 128, 0.2);
        color: #999 !important;
      }
      
      .nav-disabled:hover {
        background: rgba(128, 128, 128, 0.15) !important;
        color: #999 !important;
        transform: none !important;
        box-shadow: 0 2px 8px rgba(128, 128, 128, 0.2) !important;
        border-color: rgba(128, 128, 128, 0.3) !important;
      }
      
      .nav-lock-icon {
        font-size: 12px;
        color: #ff6b6b;
        margin-left: 8px;
        animation: lockPulse 2s ease-in-out infinite;
      }
      
      @keyframes lockPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      
      .nav-notify {
        /* 有通知提醒状态 */
        position: relative;
      }
      
      .nav-notification-dot {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 8px;
        height: 8px;
        background: #ff4757;
        border-radius: 50%;
        border: 2px solid var(--bg-primary, #ffffff);
        animation: notificationPulse 2s infinite;
      }
      
      @keyframes notificationPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes badgePulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--text-primary, #333);
        background: rgba(255, 255, 255, 0.08);
        padding: 8px 12px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }
      
      .user-info:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(74, 144, 184, 0.2);
        box-shadow: 0 4px 12px rgba(74, 144, 184, 0.1);
      }
      
      .user-avatar {
        position: relative;
      }
      
      .user-avatar i {
        font-size: 28px;
        color: var(--primary, #4A90B8);
        text-shadow: 0 2px 4px rgba(74, 144, 184, 0.3);
      }
      
      .user-avatar::after {
        content: '';
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 8px;
        height: 8px;
        background: #2ecc71;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      
      .user-details {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      
      .user-name {
        font-weight: 700;
        font-size: 15px;
        color: var(--text-primary, #333);
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      
      .user-role {
        font-size: 12px;
        color: var(--text-secondary, #666);
        background: rgba(74, 144, 184, 0.1);
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 500;
      }

      /* 二级菜单布局（新） */
      .nav2{display:flex;gap:8px}
      .nav2-top{position:relative}
      .nav2-topbtn{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:8px;text-decoration:none;color:#333;border:1px solid transparent}
      .nav2-topbtn:hover{background:rgba(74,144,184,.12);border-color:rgba(74,144,184,.2)}
      .nav2-submenu{position:absolute;top:calc(100% + 6px);left:0;min-width:240px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 12px 28px rgba(0,0,0,.15);padding:6px;display:none;z-index:50}
      .nav2-top.open .nav2-submenu{display:block}
      .nav2-item{display:block;padding:8px 10px;border-radius:6px;text-decoration:none;color:#374151}
      .nav2-item:hover{background:#eef2ff}

      .navbar-divider {
        width: 1px;
        height: 16px;
        background-color: var(--border-color);
        margin: 0 4px;
      }

      .current-time-container {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.5px;
      }

      [data-theme="dark"] .current-time-container {
        color: var(--text-secondary-dark);
      }
      
      /* 响应式调整 */
      @media (max-width: 1024px) {
        .user-details {
          display: none;
        }
        
        .permission-badge {
          display: none;
        }
        
        .nav-link {
          padding: 6px 12px;
          font-size: 14px;
        }
      }

      .navbar-content {
        max-width: 1920px;
        margin: 0 auto;
        padding: 0 24px; /* 统一左右内边距 */
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    `;
    document.head.appendChild(style);
    console.log('NavigationManager: 导航样式已添加');
  },

  // 根据角色重定向到合适的首页
  redirectToRoleHomepage() {
    const user = UserPermissions.currentUser;
    if (!user || !user.role) {
      console.log('NavigationManager: 没有用户信息，跳过权限检查');
      return;
    }
    
    const config = this.roleConfig[user.role];
    if (!config) {
      console.log(`NavigationManager: 找不到角色 ${user.role} 的配置`);
      return;
    }
    
    const currentPage = window.location.pathname.split('/').pop();
    console.log(`NavigationManager: 检查页面权限 - 用户: ${user.role}, 页面: ${currentPage}`);
    
    // 简化权限检查：只检查是否有权限访问当前页面
    const currentMenuKey = Object.keys(this.menuDefinitions).find(key => 
      this.menuDefinitions[key].href === currentPage
    );
    
    if (currentMenuKey) {
      const permission = config.permissions[currentMenuKey];
      if (permission === 'hidden') {
        console.log(`用户角色 ${user.role} 无权访问 ${currentPage}，重定向到 ${config.defaultPage}`);
        
        // 显示权限提示并重定向
        this.showAccessDeniedMessage(user.role, currentPage, config.defaultPage);
        
        setTimeout(() => {
          window.location.href = config.defaultPage;
        }, 2000);
      }
    }
  },
  
  // 显示访问拒绝消息
  showAccessDeniedMessage(role, currentPage, defaultPage) {
    const roleNames = {
      'admin': '系统管理员',
      'executive': '管理决策层', 
      'dispatcher': '调度指挥',
      'engineer': '建模工程师',
      'service': '客服支持',
      'analyst': '数据分析师'
    };
    
    const message = document.createElement('div');
    message.className = 'access-denied-message';
    message.innerHTML = `
      <div class="access-denied-content">
        <div class="access-denied-icon">🚫</div>
        <h3>访问受限</h3>
        <p>当前角色 <strong>${roleNames[role]}</strong> 无权访问此页面</p>
        <p>正在重定向到默认页面...</p>
        <div class="access-denied-progress"></div>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      .access-denied-message {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(10px);
      }
      
      .access-denied-content {
        background: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: accessDeniedShow 0.5s ease-out;
      }
      
      .access-denied-icon {
        font-size: 48px;
        margin-bottom: 20px;
      }
      
      .access-denied-content h3 {
        color: #e74c3c;
        margin-bottom: 15px;
        font-size: 24px;
      }
      
      .access-denied-content p {
        color: #666;
        margin-bottom: 10px;
        line-height: 1.6;
      }
      
      .access-denied-progress {
        height: 4px;
        background: #ecf0f1;
        border-radius: 2px;
        overflow: hidden;
        margin-top: 20px;
      }
      
      .access-denied-progress::after {
        content: '';
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #3498db, #2980b9);
        width: 100%;
        animation: progressBar 2s ease-out;
      }
      
      @keyframes accessDeniedShow {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      
      @keyframes progressBar {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(message);
    
    // 2秒后移除
    setTimeout(() => {
      message.remove();
    }, 2000);
  }
};

// 可拖拽控件管理器
const DraggableWidgetManager = {
  // 当前激活的控件
  activeWidget: null,
  
  // 控件状态存储
  widgetStates: new Map(),

  // 初始化
  init() {
    this.createDraggableStyles();
    this.initializeWidgets();
    this.setupGlobalEvents();
  },

  // 创建拖拽样式
  createDraggableStyles() {
    const style = document.createElement('style');
    style.id = 'draggable-widget-styles';
    style.textContent = `
      .draggable-widget {
        position: relative;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        transition: all 0.3s ease;
        min-width: 200px;
        min-height: 150px;
      }
      
      .draggable-widget.dragging {
        transform: rotate(3deg);
        box-shadow: var(--shadow-xl);
        z-index: 1000;
        opacity: 0.9;
      }
      
      .draggable-widget.collapsed {
        height: 40px !important;
        overflow: hidden;
      }
      
      .draggable-widget.maximized {
        position: fixed !important;
        top: 60px !important;
        left: 20px !important;
        right: 20px !important;
        bottom: 20px !important;
        width: auto !important;
        height: auto !important;
        z-index: 999;
        box-shadow: 0 25px 50px rgba(0,0,0,0.3);
      }
      
      .widget-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        cursor: move;
        user-select: none;
      }
      
      .widget-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .widget-controls {
        display: flex;
        gap: 4px;
      }
      
      .widget-control-btn {
        width: 20px;
        height: 20px;
        border: none;
        background: none;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--text-secondary);
        font-size: 12px;
        transition: all 0.2s ease;
      }
      
      .widget-control-btn:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }
      
      .widget-control-btn.close:hover {
        background: var(--danger);
        color: white;
      }
      
      .widget-body {
        padding: 12px;
        height: calc(100% - 40px);
        overflow: auto;
      }
      
      .widget-resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 16px;
        height: 16px;
        cursor: se-resize;
        background: linear-gradient(-45deg, transparent 40%, var(--border-color) 40%, var(--border-color) 60%, transparent 60%);
      }
      
      .widget-resize-handle:hover {
        background: linear-gradient(-45deg, transparent 40%, var(--primary) 40%, var(--primary) 60%, transparent 60%);
      }
      
      /* 吸附效果 */
      .widget-snap-zone {
        position: absolute;
        background: rgba(74, 144, 184, 0.2);
        border: 2px dashed var(--primary);
        border-radius: var(--radius-md);
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
      }
      
      .widget-snap-zone.active {
        opacity: 1;
      }
      
      /* 空状态提示 */
      .widget-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-tertiary);
        font-size: 14px;
        text-align: center;
        flex-direction: column;
        gap: 8px;
      }
      
      .widget-placeholder i {
        font-size: 24px;
        opacity: 0.5;
      }
    `;
    document.head.appendChild(style);
  },

  // 初始化所有控件
  initializeWidgets() {
    document.querySelectorAll('.draggable-widget').forEach(widget => {
      this.makeWidgetDraggable(widget);
    });
  },

  // 使控件可拖拽
  makeWidgetDraggable(widget) {
    const id = widget.id || `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    widget.id = id;
    
    // 初始化控件状态
    this.widgetStates.set(id, {
      position: { x: 0, y: 0 },
      size: { width: widget.offsetWidth, height: widget.offsetHeight },
      collapsed: false,
      maximized: false,
      hidden: false
    });
    
    // 确保有标题栏
    if (!widget.querySelector('.widget-header')) {
      this.addWidgetHeader(widget);
    }
    
    // 添加resize手柄
    if (!widget.querySelector('.widget-resize-handle')) {
      this.addResizeHandle(widget);
    }
    
    // 绑定事件
    this.bindWidgetEvents(widget);
  },

  // 添加控件标题栏
  addWidgetHeader(widget) {
    const title = widget.dataset.title || '控件面板';
    const icon = widget.dataset.icon || 'fas fa-window-maximize';
    
    const header = document.createElement('div');
    header.className = 'widget-header';
    header.innerHTML = `
      <div class="widget-title">
        <i class="${icon}"></i>
        ${title}
      </div>
      <div class="widget-controls">
        <button class="widget-control-btn" data-action="collapse" title="收起/展开">
          <i class="fas fa-minus"></i>
        </button>
        <button class="widget-control-btn" data-action="maximize" title="最大化/还原">
          <i class="fas fa-expand"></i>
        </button>
        <button class="widget-control-btn close" data-action="hide" title="隐藏">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // 将现有内容包装到body中
    const body = document.createElement('div');
    body.className = 'widget-body';
    while (widget.firstChild) {
      body.appendChild(widget.firstChild);
    }
    
    widget.appendChild(header);
    widget.appendChild(body);
  },

  // 添加resize手柄
  addResizeHandle(widget) {
    const handle = document.createElement('div');
    handle.className = 'widget-resize-handle';
    widget.appendChild(handle);
  },

  // 绑定控件事件
  bindWidgetEvents(widget) {
    const header = widget.querySelector('.widget-header');
    const controls = widget.querySelectorAll('.widget-control-btn');
    const resizeHandle = widget.querySelector('.widget-resize-handle');
    
    // 拖拽事件
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.widget-control-btn')) return;
      
      isDragging = true;
      this.activeWidget = widget;
      widget.classList.add('dragging');
      
      const rect = widget.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      
      e.preventDefault();
    });
    
    // 控制按钮事件
    controls.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        this.handleWidgetAction(widget, action);
      });
    });
    
    // Resize事件
    if (resizeHandle) {
      let isResizing = false;
      
      resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        this.activeWidget = widget;
        e.preventDefault();
        e.stopPropagation();
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isResizing || this.activeWidget !== widget) return;
        
        const rect = widget.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        const newHeight = e.clientY - rect.top;
        
        if (newWidth > 200 && newHeight > 150) {
          widget.style.width = newWidth + 'px';
          widget.style.height = newHeight + 'px';
          
          // 更新状态
          const state = this.widgetStates.get(widget.id);
          state.size = { width: newWidth, height: newHeight };
        }
      });
      
      document.addEventListener('mouseup', () => {
        isResizing = false;
      });
    }
    
    // 双击标题栏最大化
    header.addEventListener('dblclick', () => {
      this.handleWidgetAction(widget, 'maximize');
    });
  },

  // 设置全局事件
  setupGlobalEvents() {
    // 全局鼠标移动事件
    document.addEventListener('mousemove', (e) => {
      if (!this.activeWidget || !this.activeWidget.classList.contains('dragging')) return;
      
      const widget = this.activeWidget;
      const state = this.widgetStates.get(widget.id);
      
      // 计算新位置
      const newX = e.clientX - (widget.offsetWidth / 2);
      const newY = e.clientY - 20;
      
      // 限制在视窗内
      const maxX = window.innerWidth - widget.offsetWidth;
      const maxY = window.innerHeight - widget.offsetHeight;
      
      const x = Math.max(0, Math.min(newX, maxX));
      const y = Math.max(0, Math.min(newY, maxY));
      
      widget.style.position = 'fixed';
      widget.style.left = x + 'px';
      widget.style.top = y + 'px';
      
      // 更新状态
      state.position = { x, y };
    });
    
    // 全局鼠标释放事件
    document.addEventListener('mouseup', () => {
      if (this.activeWidget) {
        this.activeWidget.classList.remove('dragging');
        this.activeWidget = null;
      }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'h': // Ctrl+H 隐藏/显示所有控件
            e.preventDefault();
            this.toggleAllWidgets();
            break;
          case 'm': // Ctrl+M 最大化当前控件
            e.preventDefault();
            if (this.activeWidget) {
              this.handleWidgetAction(this.activeWidget, 'maximize');
            }
            break;
        }
      }
    });
  },

  // 处理控件操作
  handleWidgetAction(widget, action) {
    const state = this.widgetStates.get(widget.id);
    const controls = widget.querySelector('.widget-controls');
    
    switch (action) {
      case 'collapse':
        state.collapsed = !state.collapsed;
        widget.classList.toggle('collapsed', state.collapsed);
        
        const collapseBtn = controls.querySelector('[data-action="collapse"] i');
        collapseBtn.className = state.collapsed ? 'fas fa-plus' : 'fas fa-minus';
        
        OperationLogger.log('控件折叠切换', { 
          widgetId: widget.id, 
          collapsed: state.collapsed 
        });
        break;
        
      case 'maximize':
        state.maximized = !state.maximized;
        widget.classList.toggle('maximized', state.maximized);
        
        const maxBtn = controls.querySelector('[data-action="maximize"] i');
        maxBtn.className = state.maximized ? 'fas fa-compress' : 'fas fa-expand';
        
        OperationLogger.log('控件最大化切换', { 
          widgetId: widget.id, 
          maximized: state.maximized 
        });
        break;
        
      case 'hide':
        state.hidden = true;
        widget.style.display = 'none';
        
        NotificationManager.show(`控件已隐藏，按 Ctrl+H 可显示所有控件`, 'info');
        OperationLogger.log('隐藏控件', { widgetId: widget.id });
        break;
        
      case 'show':
        state.hidden = false;
        widget.style.display = 'block';
        break;
    }
  },

  // 切换所有控件显示状态
  toggleAllWidgets() {
    document.querySelectorAll('.draggable-widget').forEach(widget => {
      const state = this.widgetStates.get(widget.id);
      if (state && state.hidden) {
        this.handleWidgetAction(widget, 'show');
      }
    });
    
    NotificationManager.show('所有隐藏控件已显示', 'success');
  },

  // 创建新控件
  createWidget(options = {}) {
    const defaults = {
      title: '新控件',
      icon: 'fas fa-window-maximize',
      width: 300,
      height: 200,
      x: 100,
      y: 100,
      content: '<div class="widget-placeholder"><i class="fas fa-cube"></i><span>空控件</span></div>'
    };
    
    const config = { ...defaults, ...options };
    
    const widget = document.createElement('div');
    widget.className = 'draggable-widget';
    widget.dataset.title = config.title;
    widget.dataset.icon = config.icon;
    widget.style.position = 'fixed';
    widget.style.left = config.x + 'px';
    widget.style.top = config.y + 'px';
    widget.style.width = config.width + 'px';
    widget.style.height = config.height + 'px';
    widget.innerHTML = config.content;
    
    document.body.appendChild(widget);
    this.makeWidgetDraggable(widget);
    
    return widget;
  },

  // 保存控件布局
  saveLayout() {
    const layout = {};
    this.widgetStates.forEach((state, id) => {
      const widget = document.getElementById(id);
      if (widget) {
        layout[id] = {
          ...state,
          position: {
            x: parseInt(widget.style.left) || 0,
            y: parseInt(widget.style.top) || 0
          },
          size: {
            width: widget.offsetWidth,
            height: widget.offsetHeight
          }
        };
      }
    });
    
    localStorage.setItem('widgetLayout', JSON.stringify(layout));
    NotificationManager.show('控件布局已保存', 'success');
  },

  // 恢复控件布局
  restoreLayout() {
    const saved = localStorage.getItem('widgetLayout');
    if (!saved) return;
    
    try {
      const layout = JSON.parse(saved);
      
      Object.entries(layout).forEach(([id, state]) => {
        const widget = document.getElementById(id);
        if (!widget) return;
        
        // 恢复位置和大小
        widget.style.position = 'fixed';
        widget.style.left = state.position.x + 'px';
        widget.style.top = state.position.y + 'px';
        widget.style.width = state.size.width + 'px';
        widget.style.height = state.size.height + 'px';
        
        // 恢复状态
        if (state.collapsed) {
          this.handleWidgetAction(widget, 'collapse');
        }
        if (state.maximized) {
          this.handleWidgetAction(widget, 'maximize');
        }
        if (state.hidden) {
          this.handleWidgetAction(widget, 'hide');
        }
        
        this.widgetStates.set(id, state);
      });
      
      NotificationManager.show('控件布局已恢复', 'success');
    } catch (e) {
      console.error('恢复控件布局失败:', e);
    }
  }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('开始初始化页面组件...');
    
    // 初始化主题
    ThemeManager.init();
    console.log('主题管理器初始化完成');
    
    // 初始化协同功能
    CollaborationManager.init();
    console.log('协同功能初始化完成');
    
    // 用户信息显示将由NavigationManager处理，这里不再重复处理
  
    // 更新时间
    function updateTime() {
      try {
        const timeElements = document.querySelectorAll('.current-time');
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        timeElements.forEach(el => {
          if (el) {
            el.textContent = timeString;
          }
        });
      } catch (e) {
        console.error('时间更新失败:', e);
      }
    }
    
    updateTime();
    setInterval(updateTime, 1000);
    console.log('时间更新功能已启动');
  
    // 绑定批量操作
    try {
      document.querySelectorAll('[data-batch-checkbox]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
          try {
            const container = this.closest('[data-batch-id]');
            if (container) {
              const id = container.dataset.batchId;
              if (this.checked) {
                BatchOperationManager.select(id);
              } else {
                BatchOperationManager.unselect(id);
              }
            }
          } catch (e) {
            console.error('批量操作绑定失败:', e);
          }
        });
      });
      
      // 绑定全选
      const selectAllCheckbox = document.querySelector('[data-select-all]');
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
          try {
            const allIds = Array.from(document.querySelectorAll('[data-batch-id]'))
              .map(el => el.dataset.batchId)
              .filter(id => id); // 过滤掉undefined值
            
            if (this.checked) {
              BatchOperationManager.selectAll(allIds);
            } else {
              BatchOperationManager.clearSelection();
            }
          } catch (e) {
            console.error('全选操作失败:', e);
          }
        });
      }
      console.log('批量操作功能绑定完成');
    } catch (e) {
      console.error('批量操作初始化失败:', e);
    }
  
    // 初始化全局告警效果
    GlobalAlertManager.init();
    console.log('全局告警管理器初始化完成');
    
    // 添加导航栏告警样式
    const navStyle = document.createElement('style');
    navStyle.textContent = `
      .nav-alert {
        position: relative;
      }
      .nav-alert::after {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        width: 8px;
        height: 8px;
        background: #ff3838;
        border-radius: 50%;
        animation: navAlertBlink 1s infinite;
      }
      @keyframes navAlertBlink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(navStyle);
    console.log('导航栏告警样式已添加');
    
    // 初始化HK Example数据管理器
    HKExampleManager.init();
    console.log('HK Example数据管理器初始化完成');
    
    // 初始化导航管理器
    NavigationManager.init();
    console.log('导航管理器初始化完成');
    
    // 检查页面访问权限
    setTimeout(() => {
      try {
        NavigationManager.redirectToRoleHomepage();
      } catch (e) {
        console.error('页面访问权限检查失败:', e);
      }
    }, 1000);
    
    // 初始化拖拽控件管理器
    DraggableWidgetManager.init();
    console.log('拖拽控件管理器初始化完成');
    
    // 自动恢复布局（延迟执行）
    setTimeout(() => {
      try {
        DraggableWidgetManager.restoreLayout();
      } catch (e) {
        console.error('控件布局恢复失败:', e);
      }
    }, 2000);
    
    // 初始化时钟
    Clock.init();
    
    console.log('所有页面组件初始化完成');
  } catch (error) {
    console.error('页面初始化过程中发生错误:', error);
    // 显示错误通知
    if (typeof NotificationManager !== 'undefined') {
      NotificationManager.show('页面初始化失败，请刷新页面重试', 'error');
    }
  }
});

// 全局错误处理
window.addEventListener('error', function(event) {
  console.error('全局JavaScript错误:', event.error);
  console.error('错误文件:', event.filename);
  console.error('错误行号:', event.lineno);
  
  // 如果是严重错误，尝试恢复基本功能
  if (event.error && event.error.message) {
    if (typeof NotificationManager !== 'undefined') {
      NotificationManager.show('页面加载遇到问题，正在尝试恢复...', 'warning');
    }
    
    // 延迟尝试恢复导航
    setTimeout(() => {
      if (typeof NavigationManager !== 'undefined') {
        NavigationManager.showDefaultNavigation();
      }
    }, 1000);
  }
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('未处理的Promise拒绝:', event.reason);
  event.preventDefault();
});

// 通用工具函数
const Utils = {
  // 格式化数字
  formatNumber(num, decimals = 2) {
    return Number(num).toFixed(decimals);
  },
  
  // 格式化时间
  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleString('zh-CN');
  },
  
  // 防抖
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // 节流
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// 权限控制管理器
const PermissionController = {
  // 检查当前用户是否有编辑权限
  canEdit(pageType) {
    const user = UserPermissions.currentUser;
    if (!user || !user.role) return false;
    
    const roleConfig = NavigationManager.roleConfig[user.role];
    if (!roleConfig) return false;
    
    const permission = roleConfig.permissions[pageType];
    return permission === 'active';
  },

  // 检查当前用户是否只有查看权限
  isViewOnly(pageType) {
    const user = UserPermissions.currentUser;
    if (!user || !user.role) return true;
    
    const roleConfig = NavigationManager.roleConfig[user.role];
    if (!roleConfig) return true;
    
    const permission = roleConfig.permissions[pageType];
    return permission === 'view';
  },

  // 初始化页面权限控制
  initPagePermissions(pageType) {
    if (this.isViewOnly(pageType)) {
      this.enableViewOnlyMode();
    }
  },

  // 启用只读模式
  enableViewOnlyMode() {
    // 禁用所有编辑按钮
    const editButtons = document.querySelectorAll(
      'button[onclick*="save"], button[onclick*="edit"], button[onclick*="delete"], ' +
      'button[onclick*="add"], button[onclick*="create"], button[onclick*="update"], ' +
      'button[onclick*="execute"], button[onclick*="run"], .btn-primary:not(.theme-toggle)'
    );
    
    editButtons.forEach(button => {
      if (!button.classList.contains('view-allowed')) {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        button.title = '管理决策层仅有查看权限，无法执行此操作';
        
        // 添加点击提示
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof NotificationManager !== 'undefined') {
            NotificationManager.show('管理决策层仅有查看权限，无法执行修改操作', 'warning');
          }
        });
      }
    });

    // 禁用所有表单输入
    const inputs = document.querySelectorAll('input:not([readonly]), textarea:not([readonly]), select:not([readonly])');
    inputs.forEach(input => {
      if (!input.classList.contains('view-allowed')) {
        input.readOnly = true;
        input.style.backgroundColor = '#f8f9fa';
        input.style.cursor = 'default';
      }
    });

    // 添加只读模式提示
    this.showViewOnlyBanner();
  },

  // 显示只读模式横幅
  showViewOnlyBanner() {
    const existingBanner = document.getElementById('viewOnlyBanner');
    if (existingBanner) return;

    const banner = document.createElement('div');
    banner.id = 'viewOnlyBanner';
    banner.style.cssText = `
      position: fixed;
      top: 60px;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 20px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    banner.innerHTML = `
      <i class="fas fa-eye" style="margin-right: 8px;"></i>
      当前为管理决策层查看模式 - 可查看所有数据和报表，但无法执行修改操作
      <button onclick="this.parentElement.style.display='none'" 
              style="background:none;border:none;color:white;margin-left:15px;cursor:pointer;">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(banner);
    
    // 调整主内容区域的上边距
    const mainContent = document.querySelector('.main-container, .admin-layout, .daily-dispatch-layout, .simulation-layout, .workflow-layout');
    if (mainContent) {
      mainContent.style.marginTop = '40px';
    }
  },

  // 为特定元素标记为查看模式下允许的操作
  markAsViewAllowed(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.add('view-allowed'));
  }
};

// 全局时钟
const Clock = {
  init() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
  },

  updateTime() {
    const timeElements = document.querySelectorAll('.current-time');
    if (timeElements.length > 0) {
      const now = new Date();
      const timeString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      timeElements.forEach(el => {
        el.textContent = timeString;
      });
    }
  }
};

// 开发调试工具 - 全局函数
window.setDemoUser = function(role) {
  const roles = ['admin', 'executive', 'dispatcher', 'engineer', 'service', 'analyst'];
  
  if (!role) {
    console.log('可用角色:', roles.join(', '));
    console.log('使用方法: setDemoUser("dispatcher")');
    return;
  }
  
  if (!roles.includes(role)) {
    console.error('无效角色，可用角色:', roles.join(', '));
    return;
  }
  
  if (UserPermissions.setDefaultUser(role)) {
    console.log(`已设置演示用户为: ${role}`);
    console.log('刷新页面以查看效果...');
    
    // 延迟刷新，让用户看到消息
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
};

window.clearUser = function() {
  localStorage.removeItem('currentUser');
  try { localStorage.removeItem('rbacRole'); } catch(e) {}
  console.log('已清除用户信息，将重定向到登录页');
  window.location.href = 'login.html';
};

// 兼容首页等页面使用的全局退出方法
// 部分页面调用 logout()，这里提供别名以避免未定义错误
if (typeof window.logout !== 'function') {
  window.logout = function(){
    if (typeof window.clearUser === 'function') {
      window.clearUser();
    } else {
      try { localStorage.removeItem('currentUser'); localStorage.removeItem('rbacRole'); } catch(e) {}
      window.location.href = 'login.html';
    }
  }
}

// 在控制台输出帮助信息
if (typeof window !== 'undefined') {
  console.log('%c智慧管网管理系统 - 开发工具', 'color: #4A90B8; font-weight: bold; font-size: 16px;');
  console.log('%c可用命令:', 'color: #2ecc71; font-weight: bold;');
  console.log('setDemoUser("角色") - 设置演示用户');
  console.log('clearUser() - 清除用户信息');
  console.log('可用角色: admin, executive, dispatcher, engineer, service, analyst');
}