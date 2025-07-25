/**
 * 🎮 模拟播放控制器
 * 控制水力模拟的播放、暂停、步进等功能
 */

(function(global) {
    'use strict';

    const SimPlayback = {
        // 播放状态
        isPlaying: false,
        currentTime: 0,
        duration: 24 * 60, // 24小时，以分钟为单位
        speed: 1, // 播放速度倍数
        
        // 状态监听器
        statusListeners: [],
        
        /**
         * 🚀 初始化模块
         */
        async init() {
            console.log('[SimPlayback] 模拟播放控制器初始化');
            this.createControls();
            this.bindEvents();
            return Promise.resolve();
        },

        /**
         * 🎛️ 创建播放控件
         */
        createControls() {
            const container = document.querySelector('.map-toolbar');
            if (!container) {
                console.warn('[SimPlayback] 未找到地图工具栏容器');
                return;
            }

            const controlsHTML = `
                <div class="sim-playback-controls" style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    font-size: 12px;
                ">
                    <button id="playPauseBtn" class="control-btn" style="
                        border: none;
                        background: #4A90B8;
                        color: white;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="time-display" style="
                        font-family: monospace;
                        font-weight: 600;
                        color: #333;
                        min-width: 60px;
                    ">
                        00:00
                    </div>
                    <input type="range" id="timeSlider" min="0" max="1440" value="0" style="
                        flex: 1;
                        min-width: 100px;
                        margin: 0 8px;
                    ">
                    <select id="speedSelect" style="
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 4px 8px;
                        background: white;
                        font-size: 11px;
                    ">
                        <option value="0.5">0.5x</option>
                        <option value="1" selected>1x</option>
                        <option value="2">2x</option>
                        <option value="4">4x</option>
                    </select>
                </div>
            `;

            container.innerHTML = controlsHTML;
        },

        /**
         * 🔗 绑定事件
         */
        bindEvents() {
            const playPauseBtn = document.getElementById('playPauseBtn');
            const timeSlider = document.getElementById('timeSlider');
            const speedSelect = document.getElementById('speedSelect');

            if (playPauseBtn) {
                playPauseBtn.addEventListener('click', () => this.togglePlayPause());
            }

            if (timeSlider) {
                timeSlider.addEventListener('input', (e) => {
                    this.currentTime = parseInt(e.target.value);
                    this.updateTimeDisplay();
                    this.notifyStatusChange();
                });
            }

            if (speedSelect) {
                speedSelect.addEventListener('change', (e) => {
                    this.speed = parseFloat(e.target.value);
                });
            }
        },

        /**
         * ⏯️ 切换播放/暂停
         */
        togglePlayPause() {
            this.isPlaying = !this.isPlaying;
            const btn = document.getElementById('playPauseBtn');
            if (btn) {
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
                }
            }

            if (this.isPlaying) {
                this.startPlayback();
            } else {
                this.stopPlayback();
            }
        },

        /**
         * ▶️ 开始播放
         */
        startPlayback() {
            this.playInterval = setInterval(() => {
                this.currentTime += this.speed;
                if (this.currentTime >= this.duration) {
                    this.currentTime = 0; // 循环播放
                }
                this.updateTimeDisplay();
                this.updateSlider();
                this.notifyStatusChange();
            }, 1000); // 每秒更新
        },

        /**
         * ⏹️ 停止播放
         */
        stopPlayback() {
            if (this.playInterval) {
                clearInterval(this.playInterval);
                this.playInterval = null;
            }
        },

        /**
         * 🕐 更新时间显示
         */
        updateTimeDisplay() {
            const timeDisplay = document.querySelector('.time-display');
            if (timeDisplay) {
                const hours = Math.floor(this.currentTime / 60);
                const minutes = this.currentTime % 60;
                timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        },

        /**
         * 🎚️ 更新滑块
         */
        updateSlider() {
            const slider = document.getElementById('timeSlider');
            if (slider) {
                slider.value = this.currentTime;
            }
        },

        /**
         * 📢 通知状态变化
         */
        notifyStatusChange() {
            const status = {
                isPlaying: this.isPlaying,
                currentTime: this.currentTime,
                speed: this.speed
            };

            this.statusListeners.forEach(listener => {
                try {
                    listener(status);
                } catch (error) {
                    console.error('[SimPlayback] 状态监听器错误:', error);
                }
            });
        },

        /**
         * 👂 开始状态监控
         */
        startStatusMonitoring() {
            console.log('[SimPlayback] 开始状态监控');
            // 模拟数据更新
            this.monitorInterval = setInterval(() => {
                // 这里可以添加实际的数据监控逻辑
                if (Math.random() < 0.1) { // 10%概率更新
                    console.log('[SimPlayback] 模拟数据更新');
                }
            }, 5000);
        },

        /**
         * 📡 添加状态监听器
         */
        addStatusListener(listener) {
            this.statusListeners.push(listener);
        },

        /**
         * 🗑️ 移除状态监听器
         */
        removeStatusListener(listener) {
            const index = this.statusListeners.indexOf(listener);
            if (index > -1) {
                this.statusListeners.splice(index, 1);
            }
        },

        /**
         * 🧹 清理资源
         */
        destroy() {
            this.stopPlayback();
            if (this.monitorInterval) {
                clearInterval(this.monitorInterval);
            }
            this.statusListeners = [];
        }
    };

    // 注册到全局命名空间
    global.SimPlayback = SimPlayback;

})(window); 