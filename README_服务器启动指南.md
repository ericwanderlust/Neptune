# 在线水力模型系统 - 本地服务器启动指南

## 🚨 样式加载问题解决方案

### 问题描述
当启动本地HTTP服务器时，可能遇到以下问题：
- `favicon.ico 404 错误`
- CSS样式文件加载失败
- JavaScript文件加载异常
- MIME类型不正确导致的资源加载问题

### 🔧 快速修复

#### 1. 运行修复脚本
```bash
# 修复所有HTML文件的favicon引用
python fix_favicon.py

# 使用专用服务器启动脚本
python start_server.py
```

#### 2. 手动启动方法

**推荐方式 (Python 3.7+):**
```bash
python start_server.py
# 或指定端口
python start_server.py 8080
```

**替代方式:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (需要安装 http-server)
npx http-server -p 8000 -c-1

# Live Server (VS Code扩展)
# 右键点击index.html -> "Open with Live Server"
```

### 📁 文件结构检查

确保以下文件存在：
```
项目根目录/
├── index.html              ✅ 主页
├── daily_dispatch.html     ✅ 日常调度页面
├── common_styles.css       ✅ 公共样式
├── common.js               ✅ 公共脚本
├── assets/
│   └── favicon.svg         ✅ 网站图标
├── start_server.py         ✅ 服务器启动脚本
└── fix_favicon.py          ✅ 修复脚本
```

### 🛠️ 常见问题及解决方案

#### 问题1: `::1 - - [Date] "GET /favicon.ico HTTP/1.1" 404 -`
**解决方案:**
```bash
# 运行修复脚本
python fix_favicon.py
```

#### 问题2: CSS文件加载失败
**可能原因:**
- 文件路径不正确
- MIME类型设置问题
- 服务器配置问题

**解决方案:**
```bash
# 使用专用服务器脚本
python start_server.py

# 检查文件是否存在
ls -la common_styles.css

# 检查文件权限
chmod 644 common_styles.css
```

#### 问题3: 中文路径或文件名问题
**解决方案:**
- 确保终端编码为UTF-8
- 使用英文文件名
- 在Windows上使用PowerShell而非CMD

#### 问题4: 端口被占用
**解决方案:**
```bash
# 查看端口占用
netstat -an | grep 8000

# 使用其他端口
python start_server.py 8080
```

### 🌐 浏览器访问

启动服务器后访问：
- **主页**: http://localhost:8000/index.html
- **日常调度**: http://localhost:8000/daily_dispatch.html
- **历史对比**: http://localhost:8000/historical_comparison.html

### 🔍 调试技巧

#### 1. 浏览器开发者工具
- 打开 F12 开发者工具
- 查看 Console 标签页的错误信息
- 检查 Network 标签页的资源加载状态

#### 2. 服务器日志
- 观察终端输出的请求日志
- 注意404错误和其他HTTP状态码

#### 3. 缓存清理
```bash
# 强制刷新页面 (清除缓存)
Ctrl + F5 (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 📝 最佳实践

1. **总是使用HTTP服务器**
   - 不要直接用浏览器打开HTML文件 (file://)
   - 使用本地HTTP服务器 (http://localhost)

2. **检查文件编码**
   - 确保所有文件使用UTF-8编码
   - 避免BOM (Byte Order Mark)

3. **使用相对路径**
   - 避免绝对路径引用
   - 确保路径大小写正确

4. **定期清理缓存**
   - 开发时禁用浏览器缓存
   - 使用无缓存请求头

### 🚀 生产环境部署

对于生产环境，建议使用：
- **Nginx** - 高性能Web服务器
- **Apache** - 功能丰富的Web服务器
- **Node.js + Express** - JavaScript全栈解决方案

### 📞 技术支持

如果仍然遇到问题：
1. 检查防火墙设置
2. 确认Python版本 (推荐3.7+)
3. 尝试使用不同的浏览器
4. 检查系统代理设置

---

**注意**: 本指南适用于开发和测试环境，生产环境请使用专业的Web服务器。 