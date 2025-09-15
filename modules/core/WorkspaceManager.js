/**
 * 智能工作区管理系统
 * 解决频繁切换工具和菜单的复杂性问题
 * 提供类似现代IDE的工作区体验
 */

class WorkspaceManager {
    constructor() {
        this.workspaces = new Map();
        this.activeWorkspace = null;
        this.tabs = new Map();
        this.recentTabs = [];
        this.pinnedTabs = new Set();
        this.tabGroups = new Map();
        this.settings = {
            maxRecentTabs: 10,
            maxTabsPerGroup: 8,
            autoSaveInterval: 30000, // 30秒自动保存
            enableHotkeys: true
        };
        
        // 预定义工作区模板
        this.workspaceTemplates = {
            'dispatch': {
                name: '调度工作区',
                icon: 'fas fa-route',
                description: '水量预测、调度分析、应急响应一体化工作台',
                defaultTabs: [
                    'dispatch/forecast',
                    'monitor/realtime', 
                    'dispatch/period',
                    'dispatch/emergency'
                ],
                layout: 'grid-2x2'
            },
            'monitor': {
                name: '监控工作区', 
                icon: 'fas fa-desktop',
                description: '实时监控、告警处理、事件跟踪专用工作台',
                defaultTabs: [
                    'monitor/realtime',
                    'monitor/alarm-center',
                    'monitor/incidents',
                    'dashboard/alerts'
                ],
                layout: 'dashboard'
            },
            'analysis': {
                name: '分析工作区',
                icon: 'fas fa-chart-line', 
                description: '数据分析、智能建模、报表生成工作台',
                defaultTabs: [
                    'ai/model-vs-measure',
                    'reports/model',
                    'loss/analysis',
                    'water/forecast'
                ],
                layout: 'vertical-split'
            },
            'maintenance': {
                name: '运维工作区',
                icon: 'fas fa-tools',
                description: '设备维护、工单处理、巡检派工工作台', 
                defaultTabs: [
                    'ops/workorders',
                    'ops/dispatch',
                    'network/priority',
                    'repair/manage'
                ],
                layout: 'horizontal-split'
            }
        };

        this.init();
    }

    init() {
        this.loadUserPreferences();
        this.setupEventListeners();
        this.initializeUI();
        this.restoreLastSession();
        
        if (this.settings.enableHotkeys) {
            this.setupHotkeys();
        }
        
        // 自动保存工作状态
        setInterval(() => this.autoSave(), this.settings.autoSaveInterval);
    }

    /**
     * 创建新工作区
     */
    createWorkspace(id, config) {
        const workspace = {
            id,
            name: config.name,
            icon: config.icon,
            description: config.description,
            tabs: new Set(),
            layout: config.layout || 'auto',
            settings: config.settings || {},
            createdAt: new Date(),
            lastActiveAt: new Date()
        };

        this.workspaces.set(id, workspace);
        
        // 如果提供了默认标签页，添加它们
        if (config.defaultTabs) {
            config.defaultTabs.forEach(tabId => {
                this.addTabToWorkspace(id, tabId);
            });
        }

        this.saveWorkspaces();
        this.updateWorkspaceUI();
        
        return workspace;
    }

    /**
     * 从模板创建工作区
     */
    createWorkspaceFromTemplate(templateId, customName) {
        const template = this.workspaceTemplates[templateId];
        if (!template) {
            console.error('未找到工作区模板:', templateId);
            return null;
        }

        const workspaceId = `${templateId}_${Date.now()}`;
        const config = {
            ...template,
            name: customName || template.name
        };

        return this.createWorkspace(workspaceId, config);
    }

    /**
     * 切换到指定工作区
     */
    switchToWorkspace(workspaceId) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            console.error('工作区不存在:', workspaceId);
            return false;
        }

        // 保存当前工作区状态
        if (this.activeWorkspace) {
            this.saveWorkspaceState(this.activeWorkspace.id);
        }

        this.activeWorkspace = workspace;
        workspace.lastActiveAt = new Date();
        
        // 恢复工作区状态
        this.restoreWorkspaceState(workspaceId);
        this.updateActiveWorkspaceUI();
        this.saveUserPreferences();

        // 触发工作区切换事件
        this.dispatchEvent('workspaceChanged', { workspace });
        
        return true;
    }

    /**
     * 智能标签页管理
     */
    openTab(tabConfig) {
        const tabId = tabConfig.id || `tab_${Date.now()}`;
        
        const tab = {
            id: tabId,
            title: tabConfig.title,
            url: tabConfig.url,
            icon: tabConfig.icon,
            component: tabConfig.component,
            data: tabConfig.data || {},
            state: tabConfig.state || {},
            isPinned: false,
            isActive: false,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            group: tabConfig.group || 'default'
        };

        this.tabs.set(tabId, tab);
        
        // 添加到当前工作区
        if (this.activeWorkspace) {
            this.activeWorkspace.tabs.add(tabId);
        }

        // 更新最近使用列表
        this.updateRecentTabs(tabId);
        
        // 如果是新标签页，激活它
        if (tabConfig.activate !== false) {
            this.activateTab(tabId);
        }

        this.updateTabsUI();
        this.saveTabState();

        return tab;
    }

    /**
     * 关闭标签页
     */
    closeTab(tabId, force = false) {
        const tab = this.tabs.get(tabId);
        if (!tab) return false;

        // 如果是固定标签页且非强制关闭，则忽略
        if (tab.isPinned && !force) {
            console.log('固定标签页无法关闭:', tab.title);
            return false;
        }

        // 保存标签页状态以便恢复
        this.saveTabStateForRecovery(tab);

        // 从所有引用中移除
        this.tabs.delete(tabId);
        this.pinnedTabs.delete(tabId);
        this.recentTabs = this.recentTabs.filter(id => id !== tabId);
        
        // 从工作区中移除
        if (this.activeWorkspace) {
            this.activeWorkspace.tabs.delete(tabId);
        }

        // 从标签组中移除
        for (const [groupId, tabs] of this.tabGroups) {
            tabs.delete(tabId);
            if (tabs.size === 0) {
                this.tabGroups.delete(groupId);
            }
        }

        this.updateTabsUI();
        this.saveTabState();

        return true;
    }

    /**
     * 激活标签页
     */
    activateTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return false;

        // 取消其他标签页的激活状态
        for (const [id, t] of this.tabs) {
            t.isActive = (id === tabId);
        }

        tab.lastActiveAt = new Date();
        this.updateRecentTabs(tabId);
        
        // 加载标签页内容
        this.loadTabContent(tab);
        this.updateActiveTabUI();

        // 触发标签页激活事件
        this.dispatchEvent('tabActivated', { tab });

        return true;
    }

    /**
     * 固定/取消固定标签页
     */
    togglePinTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return false;

        if (tab.isPinned) {
            tab.isPinned = false;
            this.pinnedTabs.delete(tabId);
        } else {
            tab.isPinned = true;
            this.pinnedTabs.add(tabId);
        }

        this.updateTabsUI();
        this.saveTabState();
        
        return tab.isPinned;
    }

    /**
     * 标签页分组管理
     */
    createTabGroup(groupId, groupConfig) {
        const group = {
            id: groupId,
            name: groupConfig.name,
            color: groupConfig.color || '#007acc',
            icon: groupConfig.icon,
            collapsed: false,
            tabs: new Set()
        };

        this.tabGroups.set(groupId, group);
        this.updateTabGroupsUI();
        
        return group;
    }

    addTabToGroup(tabId, groupId) {
        const tab = this.tabs.get(tabId);
        const group = this.tabGroups.get(groupId);
        
        if (!tab || !group) return false;

        // 从其他组中移除
        for (const [gId, g] of this.tabGroups) {
            if (gId !== groupId) {
                g.tabs.delete(tabId);
            }
        }

        group.tabs.add(tabId);
        tab.group = groupId;
        
        this.updateTabGroupsUI();
        this.saveTabState();
        
        return true;
    }

    /**
     * 快速切换功能
     */
    setupHotkeys() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + T: 新建标签页
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.showQuickOpen();
            }
            
            // Ctrl/Cmd + W: 关闭当前标签页
            if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                e.preventDefault();
                this.closeActiveTab();
            }
            
            // Ctrl/Cmd + Tab: 切换到下一个标签页
            if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
                e.preventDefault();
                this.switchToNextTab();
            }
            
            // Ctrl/Cmd + Shift + Tab: 切换到上一个标签页
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Tab') {
                e.preventDefault();
                this.switchToPreviousTab();
            }
            
            // Ctrl/Cmd + P: 快速搜索和切换
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.showCommandPalette();
            }
            
            // Ctrl/Cmd + 数字键: 切换到指定位置的标签页
            if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
                e.preventDefault();
                this.switchToTabByIndex(parseInt(e.key) - 1);
            }
        });
    }

    /**
     * 显示快速打开面板
     */
    showQuickOpen() {
        const overlay = this.createOverlay();
        const modal = document.createElement('div');
        modal.className = 'quick-open-modal';
        modal.innerHTML = `
            <div class="quick-open-header">
                <h3><i class="fas fa-rocket"></i> 快速打开</h3>
                <button class="close-btn" onclick="this.closest('.overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="quick-open-search">
                <input type="text" placeholder="搜索功能模块..." id="quickOpenSearch">
            </div>
            <div class="quick-open-content">
                <div class="quick-open-section">
                    <h4>工作区模板</h4>
                    <div class="workspace-templates">
                        ${Object.entries(this.workspaceTemplates).map(([id, template]) => `
                            <div class="template-item" data-template="${id}">
                                <i class="${template.icon}"></i>
                                <div>
                                    <div class="template-name">${template.name}</div>
                                    <div class="template-desc">${template.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="quick-open-section">
                    <h4>最近使用</h4>
                    <div class="recent-items">
                        ${this.recentTabs.slice(0, 5).map(tabId => {
                            const tab = this.tabs.get(tabId);
                            return tab ? `
                                <div class="recent-item" data-tab="${tabId}">
                                    <i class="${tab.icon || 'fas fa-file'}"></i>
                                    <span>${tab.title}</span>
                                </div>
                            ` : '';
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 聚焦搜索框
        const searchInput = modal.querySelector('#quickOpenSearch');
        searchInput.focus();
        
        // 绑定事件
        this.setupQuickOpenEvents(modal);
    }

    /**
     * 显示命令面板
     */
    showCommandPalette() {
        const overlay = this.createOverlay();
        const modal = document.createElement('div');
        modal.className = 'command-palette-modal';
        modal.innerHTML = `
            <div class="command-palette-search">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="输入命令或搜索功能..." id="commandSearch">
            </div>
            <div class="command-palette-results" id="commandResults">
                <div class="command-section">
                    <div class="section-title">快速操作</div>
                    <div class="command-item" data-command="new-workspace">
                        <i class="fas fa-plus"></i>
                        <span>新建工作区</span>
                        <kbd>Ctrl+N</kbd>
                    </div>
                    <div class="command-item" data-command="switch-workspace">
                        <i class="fas fa-exchange-alt"></i>
                        <span>切换工作区</span>
                        <kbd>Ctrl+Shift+W</kbd>
                    </div>
                    <div class="command-item" data-command="close-all-tabs">
                        <i class="fas fa-times-circle"></i>
                        <span>关闭所有标签页</span>
                        <kbd>Ctrl+Shift+W</kbd>
                    </div>
                </div>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const searchInput = modal.querySelector('#commandSearch');
        searchInput.focus();
        
        this.setupCommandPaletteEvents(modal);
    }

    /**
     * 任务流程导向的导航
     */
    getTaskFlows() {
        return {
            'water-incident': {
                name: '供水事件处理',
                description: '从接警到处置完成的完整流程',
                steps: [
                    { page: 'monitor/alarm-center', title: '接收告警', required: true },
                    { page: 'monitor/incidents', title: '事件登记', required: true },
                    { page: 'ai/extreme', title: '影响评估', required: false },
                    { page: 'dispatch/emergency', title: '应急调度', required: true },
                    { page: 'ops/dispatch', title: '派工处理', required: true },
                    { page: 'ops/archive', title: '归档总结', required: true }
                ]
            },
            'daily-dispatch': {
                name: '日常调度计划',
                description: '制定和执行日常供水调度方案',
                steps: [
                    { page: 'dispatch/forecast', title: '需水预测', required: true },
                    { page: 'dispatch/period', title: '时段分析', required: true },
                    { page: 'dispatch/energy', title: '能耗优化', required: false },
                    { page: 'dispatch/planning', title: '方案制定', required: true },
                    { page: 'dispatch/execute', title: '执行调度', required: true }
                ]
            },
            'leakage-analysis': {
                name: '漏损分析处理',
                description: '从发现漏损到治理完成的分析流程',
                steps: [
                    { page: 'loss/analysis', title: '漏损量分析', required: true },
                    { page: 'loss/localize', title: '定位分析', required: true },
                    { page: 'network/priority', title: '优先级评估', required: false },
                    { page: 'ops/dispatch', title: '维修派工', required: true },
                    { page: 'pressure/optimize', title: '压力优化', required: false }
                ]
            }
        };
    }

    /**
     * 启动任务流程
     */
    startTaskFlow(flowId) {
        const flow = this.getTaskFlows()[flowId];
        if (!flow) return false;

        // 创建任务流程工作区
        const workspaceId = `flow_${flowId}_${Date.now()}`;
        const workspace = this.createWorkspace(workspaceId, {
            name: `${flow.name} - 流程`,
            icon: 'fas fa-list-check',
            description: flow.description,
            defaultTabs: flow.steps.map(step => step.page),
            layout: 'flow'
        });

        // 切换到新工作区
        this.switchToWorkspace(workspaceId);
        
        // 显示流程进度指示器
        this.showFlowProgress(flow);
        
        return true;
    }

    /**
     * 状态持久化
     */
    saveWorkspaceState(workspaceId) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) return;

        const state = {
            activeTab: this.getActiveTabId(),
            tabOrder: Array.from(workspace.tabs),
            layout: workspace.layout,
            settings: workspace.settings
        };

        localStorage.setItem(`workspace_${workspaceId}`, JSON.stringify(state));
    }

    restoreWorkspaceState(workspaceId) {
        const stateData = localStorage.getItem(`workspace_${workspaceId}`);
        if (!stateData) return;

        try {
            const state = JSON.parse(stateData);
            const workspace = this.workspaces.get(workspaceId);
            
            if (workspace && state.activeTab) {
                this.activateTab(state.activeTab);
            }
        } catch (error) {
            console.error('恢复工作区状态失败:', error);
        }
    }

    /**
     * 自动保存功能
     */
    autoSave() {
        this.saveWorkspaces();
        this.saveTabState();
        this.saveUserPreferences();
    }

    /**
     * 更新UI
     */
    updateWorkspaceUI() {
        // 更新工作区选择器
        const workspaceSelector = document.getElementById('workspaceSelector');
        if (workspaceSelector) {
            workspaceSelector.innerHTML = Array.from(this.workspaces.values())
                .map(ws => `
                    <option value="${ws.id}" ${ws.id === this.activeWorkspace?.id ? 'selected' : ''}>
                        <i class="${ws.icon}"></i> ${ws.name}
                    </option>
                `).join('');
        }
    }

    updateTabsUI() {
        // 更新标签页栏
        const tabsContainer = document.getElementById('tabsContainer');
        if (!tabsContainer) return;

        const tabs = this.activeWorkspace ? 
            Array.from(this.activeWorkspace.tabs).map(id => this.tabs.get(id)).filter(Boolean) :
            Array.from(this.tabs.values());

        tabsContainer.innerHTML = tabs.map(tab => `
            <div class="tab ${tab.isActive ? 'active' : ''} ${tab.isPinned ? 'pinned' : ''}" 
                 data-tab="${tab.id}">
                <i class="${tab.icon || 'fas fa-file'}"></i>
                <span class="tab-title">${tab.title}</span>
                ${tab.isPinned ? '' : '<button class="tab-close" onclick="workspaceManager.closeTab(\'' + tab.id + '\')"><i class="fas fa-times"></i></button>'}
            </div>
        `).join('');
    }

    /**
     * 工具方法
     */
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        return overlay;
    }

    dispatchEvent(eventName, data) {
        const event = new CustomEvent(`workspace:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    // ... 其他辅助方法
}

// 全局实例
window.workspaceManager = new WorkspaceManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkspaceManager;
}
