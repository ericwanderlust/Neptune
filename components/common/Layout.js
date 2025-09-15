// 统一布局：顶部一级菜单 + 左侧二级菜单 + 内容区
// 从 config/menu.json 渲染，结合 RBAC(canAccess)

(function(global){
	function Layout(root){
		this.root = root;
		this.menu = [];
		this.currentPath = (location.pathname + location.search).split('?path=').pop() || location.pathname;
		this.role = (window.__USER_ROLE__ || 'OPERATOR');
		this._renderBase();
	}

	Layout.prototype._renderBase = function(){
		this.root.innerHTML = '';
		var wrap = document.createElement('div');
		wrap.className = 'app-layout';
		var top = document.createElement('div');
		top.className = 'layout-topbar';
		var side = document.createElement('div');
		side.className = 'layout-sidebar';
		var main = document.createElement('div');
		main.className = 'layout-main';
		var crumb = document.createElement('div');
		crumb.className = 'layout-breadcrumb';
		var content = document.createElement('div');
		content.className = 'layout-content';

		main.appendChild(crumb);
		main.appendChild(content);
		wrap.appendChild(top);
		wrap.appendChild(side);
		wrap.appendChild(main);
		this.root.appendChild(wrap);

		this.el = { top: top, side: side, crumb: crumb, content: content };
	};

	Layout.prototype.loadMenu = function(menu){
		this.menu = menu || [];
		this._renderTopbar();
		this._renderSidebar();
		this._renderBreadcrumb();
	};

	Layout.prototype._renderTopbar = function(){
		var self = this;
		this.el.top.innerHTML = '';
		for (var i=0;i<this.menu.length;i++){
			var section = this.menu[i];
			var a = document.createElement('a');
			var base = section.basePath || (section.children && section.children[0] && (section.children[0].path.split('/').slice(0,2).join('/')));
			a.href = base || '#';
			a.textContent = section.name;
			var isActive = false;
			if (this.currentPath){
				if (base && (this.currentPath === base || this.currentPath.indexOf(base + '/') === 0)) {
					isActive = true;
				} else if (section.children && section.children.length){
					for (var c=0;c<section.children.length;c++){
						var cp = section.children[c].path;
						if (this.currentPath === cp || this.currentPath.indexOf(cp + '/') === 0){ isActive = true; break; }
					}
				}
			}
			a.className = 'topmenu-link' + (isActive ? ' active' : '');
			if (base) a.setAttribute('data-basepath', base);
			(function(path){
				a.addEventListener('click', function(e){
					e.preventDefault();
					if (global.Router && global.Router.navigateTo){
						global.Router.navigateTo(path);
						return;
					}
					// 兼容无Router时的跳转：根据 routes.json 解析到落地页
					fetch('config/routes.json', { cache: 'no-store' })
						.then(function(r){ return r.json(); })
						.then(function(rs){
							var landing = rs.find(function(r){ return r.path === path; });
							if (landing) { window.location.href = landing.component + '?path=' + encodeURIComponent(path); }
							else {
								// 回退到首页驾驶舱新的落地
								var dash = rs.find(function(r){ return r.path === '/dashboard'; });
								window.location.href = (dash ? dash.component : 'dashboard_overview.html');
							}
						});
				});
			})(base);
			this.el.top.appendChild(a);
		}
		TooltipWrapper && TooltipWrapper.attachForMenu(this.el.top.querySelectorAll('a'), this.menu);
	};

	Layout.prototype._findSectionByPath = function(path){
		for (var i=0;i<this.menu.length;i++){
			var s = this.menu[i];
			if (s.basePath && (path === s.basePath || path.indexOf(s.basePath + '/') === 0)) return s;
			if (!s.children) continue;
			for (var j=0;j<s.children.length;j++){
				var p = s.children[j].path;
				if (p === path || path.indexOf(p + '/') === 0) return s;
			}
		}
		return null;
	};

	Layout.prototype._renderSidebar = function(){
		var self = this;
		this.el.side.innerHTML = '';
		var section = this._findSectionByPath(this.currentPath) || this.menu[0];
		if (!section || !section.children) return;
		for (var i=0;i<section.children.length;i++){
			var item = section.children[i];
			if (global.RBAC && typeof global.RBAC.canAccess === 'function'){
				if (!global.RBAC.canAccess(this.role, item.path)) continue;
			}
			var a = document.createElement('a');
			a.href = item.path;
			a.textContent = item.name;
			a.className = 'sidemenu-link' + (item.path === this.currentPath ? ' active' : '');
			a.addEventListener('click', function(e){
				e.preventDefault();
				global.Router && global.Router.navigateTo(this.getAttribute('href'));
			});
			this.el.side.appendChild(a);
		}
		TooltipWrapper && TooltipWrapper.attachForMenu(this.el.side.querySelectorAll('a'), [section]);
	};

	Layout.prototype._renderBreadcrumb = function(){
		if (!global.Breadcrumb) return;
		global.Breadcrumb.render(this.el.crumb, this.menu, this.currentPath);
	};

	Layout.prototype.setPath = function(path){
		this.currentPath = path;
		this._renderTopbar();
		this._renderSidebar();
		this._renderBreadcrumb();
	};

	Layout.prototype.mountContent = function(node){
		this.el.content.innerHTML = '';
		this.el.content.appendChild(node);
	};

	global.AppLayout = Layout;
})(window);


