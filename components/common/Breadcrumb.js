// 轻量 Breadcrumb：从 config/menu.json 推导路径
// 适用于纯原生项目，不依赖框架

(function(global){
	function findPathByUrl(menu, path){
		for (var i=0;i<menu.length;i++){
			var section = menu[i];
			if (section.children){
				for (var j=0;j<section.children.length;j++){
					var item = section.children[j];
					if (item.path === path){
						return [section.name, item.name];
					}
				}
			}
		}
		return [];
	}

	function renderBreadcrumb(container, menu, path){
		var crumbs = findPathByUrl(menu, path);
		if (!container) return;
		container.innerHTML = '';
		var wrap = document.createElement('div');
		wrap.className = 'breadcrumb';
		for (var i=0;i<crumbs.length;i++){
			var span = document.createElement('span');
			span.textContent = crumbs[i];
			wrap.appendChild(span);
			if (i < crumbs.length - 1){
				var sep = document.createElement('span');
				sep.className = 'breadcrumb-sep';
				sep.textContent = '/';
				wrap.appendChild(sep);
			}
		}
		container.appendChild(wrap);
	}

	global.Breadcrumb = {
		render: renderBreadcrumb
	};
})(window);


