(function(global){
	var cache = { perms: null };

	function loadJSON(url){
		return fetch(url, { cache: 'no-store' }).then(function(r){ return r.json(); });
	}

	function normalizeRole(role){
		if (!role) return 'OPERATOR';
		var map = {
			'admin':'ADMIN', 'ADMIN':'ADMIN',
			'executive':'EXECUTIVE', 'EXECUTIVE':'EXECUTIVE',
			'dispatcher':'OPERATOR', 'DISPATCHER':'OPERATOR',
			'operator':'OPERATOR', 'OPERATOR':'OPERATOR',
			'engineer':'ENGINEER', 'ENGINEER':'ENGINEER'
		};
		var key = String(role).trim();
		return map[key] || key.toUpperCase();
	}

	function canAccessSync(role, path){
		if (!cache.perms) return true; // 未加载时不拦截
		var r = normalizeRole(role);
		if (r === 'ADMIN') return true;
		var w = (cache.perms.whitelist && cache.perms.whitelist[r]) || [];
		if (!w || !w.length) return false;
		if (w.indexOf('*') >= 0) return true;
		return w.indexOf(path) >= 0;
	}

	function getWhitelistSync(role){
		if (!cache.perms) return [];
		var r = normalizeRole(role);
		if (r === 'ADMIN') return ['*'];
		return (cache.perms.whitelist && cache.perms.whitelist[r]) || [];
	}

	function ensureLoaded(){
		if (cache.loading) return cache.loading;
		cache.loading = loadJSON('config/permissions.json').then(function(json){
			cache.perms = json || { roles: [], whitelist: {} };
			return cache.perms;
		});
		return cache.loading;
	}

	var RBAC = {
		load: ensureLoaded,
		canAccess: function(role, path){ return canAccessSync(role, path); },
		getWhitelist: function(role){ return getWhitelistSync(role); },
		normalizeRole: normalizeRole
	};

	global.RBAC = RBAC;
})(window);


