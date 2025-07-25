#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地HTTP服务器启动脚本
解决静态资源加载问题和MIME类型问题
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse
import mimetypes

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # 处理favicon请求
        if self.path == '/favicon.ico':
            self.path = '/assets/favicon.svg'
            self.send_response(200)
            self.send_header('Content-type', 'image/svg+xml')
            self.end_headers()
            try:
                with open('assets/favicon.svg', 'rb') as f:
                    self.wfile.write(f.read())
            except FileNotFoundError:
                self.send_error(404, "Favicon not found")
            return
        
        # 处理其他请求
        super().do_GET()

    def guess_type(self, path):
        """改进的MIME类型猜测"""
        mimetype, encoding = mimetypes.guess_type(path)
        
        # 特殊处理一些文件类型
        if path.endswith('.svg'):
            return 'image/svg+xml'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.html'):
            return 'text/html; charset=utf-8'
            
        return mimetype

def start_server(port=8000):
    """启动本地HTTP服务器"""
    # 添加MIME类型支持
    mimetypes.add_type('image/svg+xml', '.svg')
    mimetypes.add_type('text/css', '.css')
    mimetypes.add_type('application/javascript', '.js')
    
    Handler = CustomHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), Handler) as httpd:
            print(f"🚀 服务器启动成功!")
            print(f"📍 访问地址: http://localhost:{port}")
            print(f"📂 服务目录: {os.getcwd()}")
            print(f"🔗 主页地址: http://localhost:{port}/index.html")
            print(f"💡 按 Ctrl+C 停止服务器")
            print("-" * 50)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 端口 {port} 已被占用，尝试使用端口 {port + 1}")
            start_server(port + 1)
        else:
            print(f"❌ 启动服务器失败: {e}")

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 端口号必须是数字")
            sys.exit(1)
    
    start_server(port) 