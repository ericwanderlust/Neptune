/**
 * 工作区管理器UI组件
 * 提供完整的用户界面来管理工作区和标签页
 */

class WorkspaceManagerUI {
    constructor(workspaceManager) {
        this.workspaceManager = workspaceManager;
        this.isInitialized = false;
        this.currentLayout = 'standard';
        
        // 绑定事件监听器
        this.bindWorkspaceEvents();
    }

    /**
     * 初始化UI
     */
    init() {
        if (this.isInitialized) return;
        
        this.createMainContainer();
        this.createWorkspaceSelector();
        this.createTabsContainer();
        this.createQuickActions();
        this.setupDragAndDrop();
        
        this.isInitialized = true;
        console.log('WorkspaceManagerUI 初始化完成');
    }

    /**
     * 创建主容器
     */
    createMainContainer() {
        // 检查是否已存在
        let container = document.getElementById('workspaceManagerContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'workspaceManagerContainer';
            container.className = 'workspace-manager-container';
            
            // 插入到导航栏之后
            const nav = document.querySelector('nav') || document.querySelector('.navbar');
            if (nav) {
                nav.insertAdjacentElement('afterend', container);
            } else {
                document.body.insertAdjacentElement('afterbegin', container);
            }
        }
        
        this.container = container;
    }

    /**
     * 创建工作区选择器
     */
    createWorkspaceSelector() {
        const selectorHTML = `
            <div class="workspace-selector">
                <div class="workspace-current">
                    <i class="fas fa-briefcase"></i>
                    <select id="workspaceSelector" onchange="workspaceManagerUI.switchWorkspace(this.value)">
                        <option value="">选择工作区...</option>
                    </select>
                </div>
                <div class="workspace-actions">
                    <button class="workspace-action-btn" onclick="workspaceManagerUI.showWorkspaceTemplates()" title="新建工作区">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="workspace-action-btn" onclick="workspaceManagerUI.showTaskFlows()" title="任务流程">
                        <i class="fas fa-list-check"></i>
                    </button>
                    <button class="workspace-action-btn" onclick="workspaceManagerUI.showCommandPalette()" title="命令面板 (Ctrl+P)">
                        <i class="fas fa-terminal"></i>
                    </button>
                    <button class="workspace-action-btn" onclick="workspaceManagerUI.toggleTabGroups()" title="标签组">
                        <i class="fas fa-layer-group"></i>
                    </button>
                </div>
            </div>
        `;
        
        this.container.innerHTML = selectorHTML + this.container.innerHTML;
        this.updateWorkspaceSelector();
    }

    /**
     * 创建标签页容器
     */
    createTabsContainer() {
        const tabsHTML = `
            <div class="tabs-container" id="tabsContainer">
                <div class="tabs-list" id="tabsList">
                    <!-- 标签页将动态插入这里 -->
                </div>
                <div class="tabs-controls">
                    <button class="tab-control-btn" onclick="workspaceManagerUI.showTabMenu()" title="标签页选项">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <button class="tab-control-btn" onclick="workspaceManagerUI.addNewTab()" title="新建标签页 (Ctrl+T)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        
        this.container.insertAdjacentHTML('beforeend', tabsHTML);
        
        // 添加标签组侧边栏
        this.createTabGroupsSidebar();
    }

    /**
     * 创建标签组侧边栏
     */
    createTabGroupsSidebar() {
        const sidebarHTML = `
            <div class="tab-groups-sidebar" id="tabGroupsSidebar" style="display: none;">
                <div class="tab-groups-header">
                    <h4><i class="fas fa-layer-group"></i> 标签组</h4>
                    <button class="btn-close" onclick="workspaceManagerUI.toggleTabGroups()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="tab-groups-content" id="tabGroupsContent">
                    <!-- 标签组内容 -->
                </div>
                <div class="tab-groups-actions">
                    <button class="btn btn-sm btn-primary" onclick="workspaceManagerUI.createNewTabGroup()">
                        <i class="fas fa-plus"></i> 新建分组
                    </button>
                </div>
            </div>
        `;
        
        this.container.insertAdjacentHTML('beforeend', sidebarHTML);
    }

    /**
     * 创建快捷操作区
     */
    createQuickActions() {
        // 如果当前是任务流程模式，显示进度指示器
        if (this.workspaceManager.activeWorkspace?.layout === 'flow') {
            this.showFlowProgress();
        }
    }

    /**
     * 显示工作区模板选择
     */
    showWorkspaceTemplates() {
        const overlay = this.createOverlay();
        const modal = document.createElement('div');
        modal.className = 'workspace-templates-modal';
        
        const templates = this.workspaceManager.workspaceTemplates;
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3><i class="fas fa-briefcase"></i> 选择工作区模板</h3>
                <button class="close-btn" onclick="this.closest('.overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="templates-grid">
                    ${Object.entries(templates).map(([id, template]) => `
                        <div class="template-card" data-template="${id}" onclick="workspaceManagerUI.createFromTemplate('${id}')">
                            <div class="template-icon">
                                <i class="${template.icon}"></i>
                            </div>
                            <div class="template-info">
                                <h4>${template.name}</h4>
                                <p>${template.description}</p>
                                <div class="template-features">
                                    <span class="feature-tag">${template.defaultTabs?.length || 0} 个默认标签</span>
                                    <span class="feature-tag">${template.layout} 布局</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="custom-workspace">
                    <button class="btn btn-outline" onclick="workspaceManagerUI.createCustomWorkspace()">
                        <i class="fas fa-cog"></i> 自定义工作区
                    </button>
                </div>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    /**
     * 显示任务流程
     */
    showTaskFlows() {
        const overlay = this.createOverlay();
        const modal = document.createElement('div');
        modal.className = 'task-flows-modal';
        
        const taskFlows = this.workspaceManager.getTaskFlows();
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3><i class="fas fa-list-check"></i> 选择任务流程</h3>
                <button class="close-btn" onclick="this.closest('.overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="flows-list">
                    ${Object.entries(taskFlows).map(([id, flow]) => `
                        <div class="flow-card" data-flow="${id}" onclick="workspaceManagerUI.startTaskFlow('${id}')">
                            <div class="flow-header">
                                <h4><i class="fas fa-play-circle"></i> ${flow.name}</h4>
                                <span class="flow-steps-count">${flow.steps.length} 步骤</span>
                            </div>
                            <p class="flow-description">${flow.description}</p>
                            <div class="flow-steps-preview">
                                ${flow.steps.slice(0, 3).map(step => `
                                    <span class="step-preview ${step.required ? 'required' : 'optional'}">
                                        ${step.title}
                                    </span>
                                `).join('')}
                                ${flow.steps.length > 3 ? `<span class="more-steps">+${flow.steps.length - 3} 更多</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    /**
     * 显示命令面板
     */
    showCommandPalette() {
        this.workspaceManager.showCommandPalette();
    }

    /**
     * 切换标签组显示
     */
    toggleTabGroups() {
        const sidebar = document.getElementById('tabGroupsSidebar');
        if (sidebar) {
            const isVisible = sidebar.style.display !== 'none';
            sidebar.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.updateTabGroups();
            }
        }
    }

    /**
     * 更新工作区选择器
     */
    updateWorkspaceSelector() {
        const selector = document.getElementById('workspaceSelector');
        if (!selector) return;

        const workspaces = Array.from(this.workspaceManager.workspaces.values());
        const currentWorkspace = this.workspaceManager.activeWorkspace;
        
        selector.innerHTML = `
            <option value="">选择工作区...</option>
            ${workspaces.map(ws => `
                <option value="${ws.id}" ${ws.id === currentWorkspace?.id ? 'selected' : ''}>
                    ${ws.name}
                </option>
            `).join('')}
        `;
    }

    /**
     * 更新标签页显示
     */
    updateTabs() {
        const tabsList = document.getElementById('tabsList');
        if (!tabsList) return;

        const currentWorkspace = this.workspaceManager.activeWorkspace;
        if (!currentWorkspace) {
            tabsList.innerHTML = '<div class="no-tabs">没有打开的标签页</div>';
            return;
        }

        const tabs = Array.from(currentWorkspace.tabs)
            .map(id => this.workspaceManager.tabs.get(id))
            .filter(Boolean);

        if (tabs.length === 0) {
            tabsList.innerHTML = '<div class="no-tabs">没有打开的标签页</div>';
            return;
        }

        tabsList.innerHTML = tabs.map(tab => `
            <div class="tab ${tab.isActive ? 'active' : ''} ${tab.isPinned ? 'pinned' : ''}" 
                 data-tab="${tab.id}"
                 onclick="workspaceManagerUI.activateTab('${tab.id}')"
                 oncontextmenu="workspaceManagerUI.showTabContextMenu(event, '${tab.id}')">
                <i class="${tab.icon || 'fas fa-file'}"></i>
                <span class="tab-title" title="${tab.title}">${tab.title}</span>
                ${tab.isPinned ? '<i class="fas fa-thumbtack tab-pin-icon"></i>' : ''}
                ${!tab.isPinned ? `
                    <button class="tab-close" onclick="event.stopPropagation(); workspaceManagerUI.closeTab('${tab.id}')" title="关闭">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * 更新标签组
     */
    updateTabGroups() {
        const content = document.getElementById('tabGroupsContent');
        if (!content) return;

        const groups = Array.from(this.workspaceManager.tabGroups.values());
        
        if (groups.length === 0) {
            content.innerHTML = '<div class="no-groups">暂无标签组</div>';
            return;
        }

        content.innerHTML = groups.map(group => `
            <div class="tab-group ${group.collapsed ? 'collapsed' : ''}" data-group="${group.id}">
                <div class="tab-group-header" onclick="workspaceManagerUI.toggleTabGroup('${group.id}')">
                    <div class="tab-group-color" style="background-color: ${group.color}"></div>
                    <span class="tab-group-name">${group.name}</span>
                    <span class="tab-group-count">(${group.tabs.size})</span>
                    <i class="fas fa-chevron-down tab-group-toggle"></i>
                </div>
                <div class="tab-group-items">
                    ${Array.from(group.tabs).map(tabId => {
                        const tab = this.workspaceManager.tabs.get(tabId);
                        return tab ? `
                            <div class="tab-group-item ${tab.isActive ? 'active' : ''}" 
                                 onclick="workspaceManagerUI.activateTab('${tabId}')">
                                <i class="${tab.icon || 'fas fa-file'}"></i>
                                <span>${tab.title}</span>
                            </div>
                        ` : '';
                    }).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * 显示流程进度
     */
    showFlowProgress() {
        // 获取当前工作区的流程信息
        const workspace = this.workspaceManager.activeWorkspace;
        if (!workspace || workspace.layout !== 'flow') return;

        // 创建流程进度指示器
        const progressHTML = `
            <div class="flow-progress" id="flowProgress">
                <span class="flow-title">
                    <i class="fas fa-route"></i>
                    任务流程进度:
                </span>
                <div class="flow-steps" id="flowSteps">
                    <!-- 流程步骤将在这里动态生成 -->
                </div>
            </div>
        `;

        // 插入到标签页容器之前
        const tabsContainer = document.getElementById('tabsContainer');
        if (tabsContainer) {
            tabsContainer.insertAdjacentHTML('beforebegin', progressHTML);
        }
    }

    /**
     * 设置拖拽功能
     */
    setupDragAndDrop() {
        // 标签页拖拽重排序
        const tabsList = document.getElementById('tabsList');
        if (tabsList) {
            this.setupTabsDragAndDrop(tabsList);
        }
    }

    setupTabsDragAndDrop(container) {
        let draggedTab = null;

        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('tab')) {
                draggedTab = e.target;
                e.target.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('tab')) {
                e.target.style.opacity = '';
                draggedTab = null;
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedTab && e.target.classList.contains('tab') && e.target !== draggedTab) {
                // 重新排序标签页
                this.reorderTabs(draggedTab, e.target);
            }
        });
    }

    /**
     * 绑定工作区事件
     */
    bindWorkspaceEvents() {
        document.addEventListener('workspace:workspaceChanged', (e) => {
            this.updateWorkspaceSelector();
            this.updateTabs();
        });

        document.addEventListener('workspace:tabActivated', (e) => {
            this.updateTabs();
        });

        document.addEventListener('workspace:tabClosed', (e) => {
            this.updateTabs();
        });
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

    /**
     * 委托方法 - 调用工作区管理器的相应方法
     */
    switchWorkspace(workspaceId) {
        this.workspaceManager.switchToWorkspace(workspaceId);
    }

    activateTab(tabId) {
        this.workspaceManager.activateTab(tabId);
    }

    closeTab(tabId) {
        this.workspaceManager.closeTab(tabId);
    }

    createFromTemplate(templateId) {
        this.workspaceManager.createWorkspaceFromTemplate(templateId);
        document.querySelector('.overlay')?.remove();
    }

    startTaskFlow(flowId) {
        this.workspaceManager.startTaskFlow(flowId);
        document.querySelector('.overlay')?.remove();
    }

    addNewTab() {
        this.workspaceManager.showQuickOpen();
    }

    // ... 其他UI交互方法
}

// 全局实例
window.workspaceManagerUI = new WorkspaceManagerUI(window.workspaceManager);

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    if (window.workspaceManager && window.workspaceManagerUI) {
        window.workspaceManagerUI.init();
    }
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorkspaceManagerUI;
}
