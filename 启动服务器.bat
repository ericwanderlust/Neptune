@echo off
chcp 65001 >nul
echo.
echo ====================================
echo    在线水力模型系统 - 本地服务器
echo ====================================
echo.

echo 🔧 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python，请确保Python已安装并添加到PATH
    echo 💡 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python环境正常
echo.

echo 🔧 修复favicon引用...
python fix_favicon.py
echo.

echo 🚀 启动HTTP服务器...
echo 📍 服务器地址: http://localhost:8000
echo 🔗 主页地址: http://localhost:8000/index.html
echo 💡 按 Ctrl+C 停止服务器
echo.

python start_server.py

echo.
echo 🛑 服务器已停止
pause 