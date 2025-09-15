// 图表卡片容器：标题 + 工具栏 + 内容区挂载点
// 可用于 ECharts/地图/Canvas 等

(function(global){
	function createEl(tag, cls, text){
		var el = document.createElement(tag);
		if (cls) el.className = cls;
		if (text != null) el.textContent = text;
		return el;
	}

	function ChartCard(container, options){
		this.container = container;
		this.title = options.title || '';
		this.tooltip = options.tooltip || '';
		this.toolbar = options.toolbar || [];
		this.height = options.height || 320;
		this._render();
	}

	ChartCard.prototype._render = function(){
		var root = createEl('div', 'chart-card');
		var header = createEl('div', 'chart-card-header');
		var title = createEl('div', 'chart-card-title', this.title);
		var tools = createEl('div', 'chart-card-tools');
		header.appendChild(title);
		header.appendChild(tools);
		root.appendChild(header);

		if (this.tooltip){
			TooltipWrapper && TooltipWrapper.attach(title, this.tooltip);
		}

		for (var i=0;i<this.toolbar.length;i++){
			var btnCfg = this.toolbar[i];
			var btn = createEl('button', 'chart-card-btn', btnCfg.text || '');
			if (btnCfg.onClick) btn.addEventListener('click', btnCfg.onClick);
			if (btnCfg.tooltip) TooltipWrapper && TooltipWrapper.attach(btn, btnCfg.tooltip);
			tools.appendChild(btn);
		}

		var body = createEl('div', 'chart-card-body');
		body.style.height = this.height + 'px';
		root.appendChild(body);

		this.container.innerHTML = '';
		this.container.appendChild(root);
		this.bodyEl = body;
	};

	ChartCard.prototype.mountTo = function(callback){
		if (typeof callback === 'function'){
			callback(this.bodyEl);
		}
	};

	global.ChartCard = ChartCard;
})(window);


