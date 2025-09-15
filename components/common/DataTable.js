// 纯原生表格封装：筛选 + 分页 + CSV 导出
// 使用方式：new DataTable(container, { columns, rows })

(function(global){
	function createEl(tag, cls, text){
		var el = document.createElement(tag);
		if (cls) el.className = cls;
		if (text != null) el.textContent = text;
		return el;
	}

	function toCSV(rows, headers){
		var lines = [];
		lines.push(headers.join(','));
		for (var i=0;i<rows.length;i++){
			var r = rows[i];
			var line = [];
			for (var j=0;j<headers.length;j++){
				var v = r[headers[j]];
				var s = v == null ? '' : String(v);
				s = '"' + s.replace(/"/g, '""') + '"';
				line.push(s);
			}
			lines.push(line.join(','));
		}
		return lines.join('\n');
	}

	function DataTable(container, options){
		this.container = container;
		this.columns = options.columns || [];
		this.rows = options.rows || [];
		this.pageSize = options.pageSize || 10;
		this.page = 1;
		this.filter = '';
		this._render();
	}

	DataTable.prototype._filteredRows = function(){
		if (!this.filter) return this.rows.slice();
		var f = this.filter.toLowerCase();
		return this.rows.filter(function(r){
			for (var k in r){
				if (r[k] != null && String(r[k]).toLowerCase().indexOf(f) !== -1) return true;
			}
			return false;
		});
	};

	DataTable.prototype._render = function(){
		var root = createEl('div', 'datatable');
		// toolbar
		var toolbar = createEl('div', 'datatable-toolbar');
		var input = createEl('input', 'datatable-filter');
		input.type = 'search';
		input.placeholder = '筛选...';
		var exportBtn = createEl('button', 'datatable-export', '导出 CSV');
		toolbar.appendChild(input);
		toolbar.appendChild(exportBtn);
		root.appendChild(toolbar);

		// table
		var table = createEl('table', 'datatable-table');
		var thead = createEl('thead');
		var thr = createEl('tr');
		var headers = this.columns.map(function(c){ return c.key; });
		for (var i=0;i<this.columns.length;i++){
			thr.appendChild(createEl('th', null, this.columns[i].title || this.columns[i].key));
		}
		thead.appendChild(thr);
		table.appendChild(thead);
		var tbody = createEl('tbody');
		table.appendChild(tbody);
		root.appendChild(table);

		// pagination
		var pager = createEl('div', 'datatable-pager');
		var prev = createEl('button', 'datatable-prev', '上一页');
		var next = createEl('button', 'datatable-next', '下一页');
		var info = createEl('span', 'datatable-info');
		pager.appendChild(prev);
		pager.appendChild(next);
		pager.appendChild(info);
		root.appendChild(pager);

		this.container.innerHTML = '';
		this.container.appendChild(root);

		var self = this;
		function update(){
			var all = self._filteredRows();
			var totalPages = Math.max(1, Math.ceil(all.length / self.pageSize));
			if (self.page > totalPages) self.page = totalPages;
			var start = (self.page - 1) * self.pageSize;
			var pageRows = all.slice(start, start + self.pageSize);
			tbody.innerHTML = '';
			for (var r=0;r<pageRows.length;r++){
				var tr = createEl('tr');
				for (var c=0;c<headers.length;c++){
					var td = createEl('td');
					td.textContent = pageRows[r][headers[c]] != null ? String(pageRows[r][headers[c]]) : '';
					tr.appendChild(td);
				}
				tbody.appendChild(tr);
			}
			info.textContent = '第 ' + self.page + ' / ' + totalPages + ' 页';
			prev.disabled = self.page <= 1;
			next.disabled = self.page >= totalPages;
		}

		prev.addEventListener('click', function(){ self.page = Math.max(1, self.page - 1); update(); });
		next.addEventListener('click', function(){ self.page = self.page + 1; update(); });
		input.addEventListener('input', function(){ self.filter = input.value; self.page = 1; update(); });
		exportBtn.addEventListener('click', function(){
			var csv = toCSV(self._filteredRows(), headers);
			var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url; a.download = 'export.csv'; a.click();
			URL.revokeObjectURL(url);
		});

		update();
	};

	global.DataTable = DataTable;
})(window);


