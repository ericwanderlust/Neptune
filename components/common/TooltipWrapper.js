// 轻量 Tooltip 封装：支持显式传入文本，或按元素 data-tooltip 读取
// 无依赖，统一菜单与页面内提示的样式与表现

(function(global){
	var bubble;

	function ensureBubble(){
		if (bubble) return bubble;
		bubble = document.createElement('div');
		bubble.className = 'tooltip-bubble';
		bubble.style.position = 'fixed';
		bubble.style.zIndex = '9999';
		bubble.style.maxWidth = '320px';
		bubble.style.padding = '6px 8px';
		bubble.style.background = 'rgba(0,0,0,0.75)';
		bubble.style.color = '#fff';
		bubble.style.borderRadius = '4px';
		bubble.style.fontSize = '12px';
		bubble.style.pointerEvents = 'none';
		bubble.style.display = 'none';
		document.body.appendChild(bubble);
		return bubble;
	}

	function show(text, x, y){
		var el = ensureBubble();
		el.textContent = text || '';
		el.style.left = Math.round(x + 12) + 'px';
		el.style.top = Math.round(y + 12) + 'px';
		el.style.display = text ? 'block' : 'none';
	}

	function hide(){
		if (!bubble) return;
		bubble.style.display = 'none';
	}

	function attach(element, text){
		if (!element) return;
		var getText = function(){
			return text || element.getAttribute('data-tooltip') || element.title || '';
		};
		var onEnter = function(evt){
			var t = getText();
			if (!t) return;
			show(t, evt.clientX, evt.clientY);
		};
		var onMove = function(evt){
			if (!bubble || bubble.style.display === 'none') return;
			show(bubble.textContent, evt.clientX, evt.clientY);
		};
		var onLeave = function(){ hide(); };
		element.addEventListener('mouseenter', onEnter);
		element.addEventListener('mousemove', onMove);
		element.addEventListener('mouseleave', onLeave);
		return function detach(){
			element.removeEventListener('mouseenter', onEnter);
			element.removeEventListener('mousemove', onMove);
			element.removeEventListener('mouseleave', onLeave);
		};
	}

	// 为菜单 anchor 批量挂载 tooltip：按 data-path 或 href 匹配 menu 配置
	function attachForMenu(anchors, menu){
		if (!anchors || !menu) return [];
		var childTooltipMap = {};
		var baseSummaryMap = {};
		for (var i=0;i<menu.length;i++){
			var section = menu[i];
			if (section && section.basePath){
				baseSummaryMap[section.basePath] = section.summary || '';
			}
			if (!section.children) continue;
			for (var j=0;j<section.children.length;j++){
				var item = section.children[j];
				if (item && item.path) childTooltipMap[item.path] = item.tooltip || '';
			}
		}
		var unsubs = [];
		for (var k=0;k<anchors.length;k++){
			var a = anchors[k];
			var base = a.getAttribute('data-basepath');
			var p = a.getAttribute('data-path') || a.getAttribute('href');
			var tip = '';
			if (base && baseSummaryMap[base]) tip = baseSummaryMap[base];
			else if (p && childTooltipMap[p]) tip = childTooltipMap[p];
			if (typeof tip === 'string' && tip.length){
				unsubs.push(attach(a, tip));
			}
		}
		return unsubs;
	}

	global.TooltipWrapper = {
		attach: attach,
		attachForMenu: attachForMenu,
		hide: hide
	};
})(window);


