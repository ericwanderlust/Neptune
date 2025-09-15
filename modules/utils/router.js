(function(global){
	var router = { routes: [], menu: [], layout: null };

	function loadJSON(url){
		return fetch(url, { cache: 'no-store' }).then(function(r){ return r.json(); });
	}

	function findSection(menu, path){
		for (var i=0;i<menu.length;i++){
			var s = menu[i]; if (!s.children) continue;
			for (var j=0;j<s.children.length;j++){
				if (s.children[j].path === path) return s;
			}
		}
		return null;
	}

	function firstAllowedChild(section, role){
		if (!section || !section.children) return null;
		for (var i=0;i<section.children.length;i++){
			var p = section.children[i].path;
			if (!global.RBAC || global.RBAC.canAccess(role, p)) return p;
		}
		return section.children[0] && section.children[0].path;
	}

	function navigateTo(path){
		var role = window.__USER_ROLE__ || (JSON.parse(localStorage.getItem('currentUser')||'{}').role) || 'OPERATOR';
		if (global.RBAC && !global.RBAC.canAccess(role, path)){
			alert('无访问权限');
			return;
		}
		var match = router.routes.find(function(r){ return r.path === path; });
		if (!match){
			var section = findSection(router.menu, path);
			if (section){
				var target = firstAllowedChild(section, role);
				if (target){ return navigateTo(target); }
			}
			console.warn('未找到路由：', path);
			return;
		}
		var url = match.component + '?path=' + encodeURIComponent(path);
		window.location.href = url;
	}

	function init(layout){
		router.layout = layout || null;
		return Promise.all([
			loadJSON('config/menu.json').then(function(m){ router.menu = m; }),
			loadJSON('config/routes.json').then(function(r){ router.routes = r; }),
			(global.RBAC ? global.RBAC.load() : Promise.resolve())
		]).then(function(){
			if (router.layout){ router.layout.loadMenu(router.menu); }
		});
	}

	global.Router = { init: init, navigateTo: navigateTo };
})(window);


