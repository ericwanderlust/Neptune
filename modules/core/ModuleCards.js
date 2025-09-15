(function(global){
	function createCard(item){
		var card = document.createElement('div');
		card.className = 'module-card';
		card.innerHTML = '' +
			'<div class="module-card-icon"><i class="' + (item.icon || 'fas fa-circle') + '"></i></div>' +
			'<div class="module-card-body">' +
				'<div class="module-card-title">' + (item.name || '') + '</div>' +
				'<div class="module-card-desc">' + (item.tooltip || '') + '</div>' +
			'</div>' +
			'<div class="module-card-action"><i class="fas fa-arrow-right"></i></div>';
		card.addEventListener('click', function(e){
			e.preventDefault();
			if (global.Router && global.Router.navigateTo){
				global.Router.navigateTo(item.path);
				return;
			}
			fetch('config/routes.json', { cache: 'no-store' })
				.then(function(r){ return r.json(); })
				.then(function(rs){
					var m = rs.find(function(r){ return r.path === item.path; });
					if (m) { window.location.href = m.component + '?path=' + encodeURIComponent(item.path); }
				});
		});
		return card;
	}

	function render(container, section){
		if (!container || !section) return;
		container.classList.add('module-cards-grid');
		container.innerHTML='';
		(section.children || []).forEach(function(child){
			if (!child.path) return;
			container.appendChild(createCard(child));
		});
	}

	function injectStyles(){
		if (document.getElementById('module-cards-styles')) return;
		var style = document.createElement('style');
		style.id = 'module-cards-styles';
		style.textContent = '\
.module-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}\
.module-card{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--border-color,#e5e7eb);border-radius:12px;background:var(--card-bg,#fff);box-shadow:0 2px 8px rgba(0,0,0,.06);cursor:pointer;transition:all .25s ease}\
.module-card:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.12);border-color:rgba(74,144,184,.35)}\
.module-card-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--bg-color,#f5f6fa),var(--border-color,#e5e7eb));color:var(--primary,#4A90B8)}\
.module-card-title{font-weight:600;color:var(--text-primary,#333);font-size:14px;margin-bottom:4px}\
.module-card-desc{font-size:12px;color:var(--text-secondary,#666)}\
.module-card-action{margin-left:auto;color:#9AA5B1}\
';
		document.head.appendChild(style);
	}

	global.ModuleCards = { render: render, injectStyles: injectStyles };
})(window);


