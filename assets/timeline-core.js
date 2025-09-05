// 大模型时间轴 - 核心JavaScript逻辑

class TimelineCore {
    constructor(config) {
        this.config = config;
        this.timelineData = [];
        this.allTimelineData = [];
        this.currentChartData = [];
        this.currentFilterQuery = '';
        this.currentSelectedTypes = new Set();
        this.currentSelectedSize = null;
        
        // 初始化 marked.js
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                sanitize: false,
                smartLists: true,
                smartypants: true
            });
        }
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadTimelineData();
            this.setupUI();
            this.bindEvents();
            console.log('时间轴初始化成功');
        } catch (error) {
            console.error('时间轴初始化失败:', error);
            this.handleError(error);
        }
    }
    
    async loadTimelineData() {
        const dataSources = this.config.get('dataSources');
        
        for (let i = 0; i < dataSources.length; i++) {
            try {
                console.log(`🔄 尝试从数据源 ${i + 1} 加载数据:`, dataSources[i]);
                const response = await fetch(dataSources[i]);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.timelineData = await response.json();
                this.timelineData = Array.isArray(this.timelineData) ? this.timelineData : [];
                this.allTimelineData = this.timelineData.map((d, i) => ({ ...d, __idx: i }));
                this.timelineData = this.allTimelineData;
                console.log('✅ 时间轴数据加载成功:', this.timelineData.length, '个项目');
                return this.timelineData;
            } catch (error) {
                console.warn(`❌ 数据源 ${i + 1} 加载失败:`, error.message);
                if (i === dataSources.length - 1) {
                    throw new Error('所有数据源都无法访问');
                }
            }
        }
    }
    
    setupUI() {
        // 应用自定义样式
        const customCSS = this.config.get('styles.customCSS');
        if (customCSS) {
            const style = document.createElement('style');
            style.textContent = customCSS;
            document.head.appendChild(style);
        }
        
        // 设置布局
        this.setupLayout();
        
        // 渲染组件
        this.renderChart();
        this.renderFilters();
        this.renderTimelineAndToc();
        
        // 设置目录切换
        if (this.config.get('layout.showTocToggle')) {
            this.setupTocToggle();
        }
    }
    
    setupLayout() {
        const leftMargin = this.config.get('layout.leftMargin');
        if (leftMargin > 0) {
            const style = document.createElement('style');
            style.textContent = `
                .release-chart-wrapper,
                .timeline-container {
                    margin-left: ${leftMargin}px;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    bindEvents() {
        // 搜索框事件
        const searchInput = document.getElementById('timeline-search');
        if (searchInput && this.config.get('features.enableSearch')) {
            searchInput.addEventListener('input', () => {
                this.filterAndRenderByTitle(searchInput.value);
            });
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.filterAndRenderByTitle('');
                }
            });
        }
        
        // 滚动事件
        window.addEventListener('scroll', () => this.handleScroll());
        
        // 窗口大小变化事件
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.renderChart(), 150);
        });
        
        // 目录点击事件
        this.bindTocEvents();
    }
    
    renderChart() {
        if (!this.config.get('features.enableChart')) return;
        
        this.currentChartData = this.timelineData;
        this.renderReleaseTimelineChart(this.currentChartData);
    }
    
    renderFilters() {
        if (this.config.get('features.enableTypeFilter')) {
            this.renderTypeChips();
        }
        if (this.config.get('features.enableSizeFilter')) {
            this.renderSizeSelect();
        }
    }
    
    renderTimelineAndToc() {
        this.clearTimelineAndToc();
        this.renderTimelineItems(this.timelineData);
        
        // 初始化第一个项目为活跃状态
        setTimeout(() => {
            this.updateActiveTocItem('timeline-item-0');
        }, 500);
    }
    
    // 解析日期字符串
    parseDateToMs(dateStr) {
        if (!dateStr) return NaN;
        const trimmed = String(dateStr).trim();
        const normalized = /^\d{4}-\d{2}$/.test(trimmed) ? `${trimmed}-01` : trimmed;
        const ms = Date.parse(normalized);
        return isNaN(ms) ? NaN : ms;
    }
    
    // 渲染发布时间图表
    renderReleaseTimelineChart(data) {
        const container = document.getElementById('release-chart');
        if (!container) return;

        // 清空并创建结构
        container.innerHTML = '';
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.id = 'release-chart-tooltip';
        container.appendChild(tooltip);

        const inner = document.createElement('div');
        inner.className = 'rc-inner';
        container.appendChild(inner);

        const btnLeft = document.createElement('button');
        btnLeft.className = 'pan-btn pan-left';
        btnLeft.setAttribute('aria-label', '向左移动');
        btnLeft.innerHTML = '<span>‹</span>';
        const btnRight = document.createElement('button');
        btnRight.className = 'pan-btn pan-right';
        btnRight.setAttribute('aria-label', '向右移动');
        btnRight.innerHTML = '<span>›</span>';
        container.appendChild(btnLeft);
        container.appendChild(btnRight);

        // 视口尺寸
        const viewportW = container.clientWidth;
        const viewportH = container.clientHeight;
        const margin = { left: 40, right: 6, top: 16, bottom: 28 };
        const guard = 42;
        const visibleWidth = Math.max(0, viewportW - guard * 2);
        const innerViewportW = Math.max(0, visibleWidth - margin.left - margin.right);
        const innerH = Math.max(0, viewportH - margin.top - margin.bottom);

        // 数据处理
        const items = (data || [])
            .map((d, idx) => ({
                idx: (d && d.__idx != null ? d.__idx : idx),
                title: d.title || '',
                hasStar: (d.title || '').includes('⭐'),
                rawDate: d.date,
                t: this.parseDateToMs(d.date)
            }))
            .filter(d => !isNaN(d.t))
            .sort((a, b) => a.t - b.t);

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8aa3c0;font-size:12px;';
            empty.textContent = '暂无可用的发布时间数据';
            container.appendChild(empty);
            return;
        }

        const minT = items[0].t;
        const maxT = items[items.length - 1].t;

        // 同日分组处理
        const dayKey = (t) => {
            const d = new Date(t);
            return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        };
        const dayGroups = new Map();
        items.forEach(it => {
            const k = dayKey(it.t);
            let arr = dayGroups.get(k);
            if (!arr) {
                arr = [];
                dayGroups.set(k, arr);
            }
            it.groupIndex = arr.length;
            arr.push(it);
        });
        dayGroups.forEach(arr => {
            const maxAbs = Math.ceil((arr.length - 1) / 2);
            arr.forEach(it => {
                const gi = it.groupIndex;
                const s = gi === 0 ? 0 : Math.ceil(gi / 2);
                const laneIdx = gi === 0 ? 0 : (gi % 2 === 1 ? s : -s);
                it.groupSize = arr.length;
                it.maxAbsLane = maxAbs;
                it.laneIndex = laneIdx;
            });
        });

        // 计算内容宽度
        const totalSpanMs = Math.max(1, maxT - minT);
        const innerBase = innerViewportW;
        let minDeltaMs = Infinity;
        for (let i = 0; i < items.length - 1; i++) {
            const dt = items[i + 1].t - items[i].t;
            if (dt > 0 && dt < minDeltaMs) minDeltaMs = dt;
        }
        const desiredMinGap = 34;
        const maxScale = 12;
        let contentInnerW = innerBase;
        if (isFinite(minDeltaMs) && minDeltaMs > 0) {
            const candidate = Math.round((desiredMinGap * totalSpanMs) / minDeltaMs);
            contentInnerW = Math.max(innerBase, Math.min(innerBase * maxScale, candidate));
        }
        const contentW = margin.left + margin.right + contentInnerW;
        inner.style.width = contentW + 'px';

        if (contentW <= visibleWidth) {
            const leftPad = Math.max(0, Math.floor(guard + (visibleWidth - contentW) / 2));
            inner.style.left = leftPad + 'px';
        } else {
            inner.style.left = '0px';
        }

        // 生成刻度
        const oneDay = 86400000;
        const spanDays = Math.max(1, Math.round(totalSpanMs / oneDay));
        const targetTicks = Math.min(10, Math.max(6, Math.floor(contentInnerW / 160)));
        let useMonthTicks = spanDays >= 120;
        let ticks = [];

        if (useMonthTicks) {
            const stepMonthsChoices = [1, 2, 3, 6, 12];
            const dMin = new Date(minT);
            const dMax = new Date(maxT);
            const start = new Date(Date.UTC(dMin.getUTCFullYear(), dMin.getUTCMonth(), 1));
            const end = new Date(Date.UTC(dMax.getUTCFullYear(), dMax.getUTCMonth(), 1));
            const monthsDiff = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
            let bestStep = 1, bestDiff = Infinity;
            for (const s of stepMonthsChoices) {
                const cnt = Math.ceil(monthsDiff / s) + 1;
                const diff = Math.abs(cnt - targetTicks);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestStep = s;
                }
            }
            let y = start.getUTCFullYear();
            let m = start.getUTCMonth();
            while (true) {
                const t = Date.UTC(y, m, 1);
                if (t > maxT) break;
                ticks.push(t);
                m += bestStep;
                while (m >= 12) {
                    y++;
                    m -= 12;
                }
            }
        } else {
            const allowedDays = [1, 2, 3, 5, 7, 10, 14, 21, 30, 60];
            let bestStep = 7, bestDiff = Infinity;
            for (const s of allowedDays) {
                const cnt = Math.ceil(spanDays / s) + 1;
                const diff = Math.abs(cnt - targetTicks);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestStep = s;
                }
            }
            const firstTick = Math.ceil(minT / oneDay) * oneDay;
            for (let t = firstTick; t <= maxT; t += bestStep * oneDay) {
                ticks.push(t);
            }
        }

        // X坐标映射函数
        function getXForDate(t) {
            if (maxT === minT) return margin.left + contentInnerW / 2;
            const clamped = Math.max(minT, Math.min(maxT, t));
            const ratio = (clamped - minT) / (maxT - minT);
            return margin.left + ratio * contentInnerW;
        }

        // 创建SVG
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', contentW);
        svg.setAttribute('height', viewportH);

        // 基线
        const baselineY = margin.top + innerH * 0.68;
        const axis = document.createElementNS(svgNS, 'line');
        axis.setAttribute('x1', margin.left);
        axis.setAttribute('x2', margin.left + contentInnerW);
        axis.setAttribute('y1', baselineY);
        axis.setAttribute('y2', baselineY);
        axis.setAttribute('stroke', 'rgba(86,152,195,0.45)');
        axis.setAttribute('stroke-width', '1');
        svg.appendChild(axis);

        // 刻度
        ticks.forEach((t, idx) => {
            const x = getXForDate(t);
            const tick = document.createElementNS(svgNS, 'line');
            tick.setAttribute('x1', x);
            tick.setAttribute('x2', x);
            tick.setAttribute('y1', baselineY - 8);
            tick.setAttribute('y2', baselineY + 8);
            tick.setAttribute('stroke', 'rgba(86,152,195,0.35)');
            tick.setAttribute('stroke-width', '1');
            svg.appendChild(tick);

            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', baselineY - 12);
            if (idx === 0) label.setAttribute('text-anchor', 'start');
            else if (idx === ticks.length - 1) label.setAttribute('text-anchor', 'end');
            else label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '12');
            label.setAttribute('fill', '#3c6a93');
            const d = new Date(t);
            const y = d.getUTCFullYear();
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
            if (spanDays >= 120) {
                label.textContent = `${y}-${mm}`;
            } else {
                label.textContent = `${mm}-${String(d.getUTCDate()).padStart(2, '0')}`;
            }
            svg.appendChild(label);
        });

        // 散点
        const rng = (seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280)(123456);
        const laneGap = Math.max(10, Math.round(innerH * 0.18));
        const jitterAmp = Math.max(4, innerH * 0.15);

        items.forEach(d => {
            const x = getXForDate(d.t);
            const laneOffset = (d?.laneIndex || 0) * laneGap;
            const jitter = (rng() - 0.5) * 2 * jitterAmp;
            const y = baselineY - laneOffset - jitter * 0.25;
            let node;
            
            if (d.hasStar) {
                const star = document.createElementNS(svgNS, 'text');
                star.setAttribute('x', x);
                star.setAttribute('y', y);
                star.setAttribute('text-anchor', 'middle');
                star.setAttribute('dominant-baseline', 'middle');
                star.setAttribute('font-size', '12');
                star.textContent = '⭐';
                node = star;
            } else {
                const circle = document.createElementNS(svgNS, 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', 4.5);
                circle.setAttribute('fill', '#2f6bd8');
                circle.setAttribute('opacity', '0.95');
                node = circle;
            }
            node.style.cursor = 'pointer';

            // 事件处理
            node.addEventListener('mouseenter', (e) => {
                tooltip.style.display = 'block';
                const rect = container.getBoundingClientRect();
                tooltip.style.left = `${e.clientX - rect.left}px`;
                tooltip.style.top = `${e.clientY - rect.top - 8}px`;
                const dt = new Date(d.t);
                const y = dt.getFullYear();
                const m = `${dt.getMonth() + 1}`.padStart(2, '0');
                const day = `${dt.getDate()}`.padStart(2, '0');
                tooltip.textContent = `${y}-${m}-${day} · ${d.title || '未命名'}`;
            });
            
            node.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                tooltip.style.left = `${e.clientX - rect.left}px`;
                tooltip.style.top = `${e.clientY - rect.top - 8}px`;
            });
            
            node.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
            
            node.addEventListener('click', () => {
                tooltip.style.display = 'none';
                const targetId = `timeline-item-${d.idx}`;
                this.scrollToElement(targetId);
            });

            svg.appendChild(node);
        });

        inner.appendChild(svg);

        // 平移控制
        let offset = 0;
        const maxOffset = Math.max(0, contentW - visibleWidth);

        const applyTransform = () => {
            inner.style.transform = `translateX(${-offset}px)`;
            if (maxOffset <= 0) {
                btnLeft.disabled = true;
                btnRight.disabled = true;
            } else {
                btnLeft.disabled = offset <= 1;
                btnRight.disabled = offset >= maxOffset - 1;
            }
        };

        const panBy = (dx) => {
            offset = Math.max(0, Math.min(maxOffset, offset + dx));
            applyTransform();
        };

        const clickStep = Math.max(120, Math.round(visibleWidth * 0.6));
        btnLeft.addEventListener('click', () => panBy(-clickStep));
        btnRight.addEventListener('click', () => panBy(clickStep));

        // 长按移动
        const hold = (btn, dir) => {
            let raf = 0;
            let running = false;
            const speed = Math.max(6, Math.round(visibleWidth / 200));
            const step = () => {
                panBy(dir * speed);
                raf = requestAnimationFrame(step);
            };
            const start = () => {
                if (running) return;
                running = true;
                raf = requestAnimationFrame(step);
            };
            const stop = () => {
                running = false;
                cancelAnimationFrame(raf);
            };
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', stop);
            btn.addEventListener('mouseleave', stop);
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                start();
            }, { passive: false });
            btn.addEventListener('touchend', stop);
            btn.addEventListener('touchcancel', stop);
        };
        hold(btnLeft, -1);
        hold(btnRight, 1);

        // 滚轮支持
        container.addEventListener('wheel', (e) => {
            if (maxOffset <= 0) return;
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (delta !== 0) {
                e.preventDefault();
                panBy(delta);
            }
        }, { passive: false });

        // 初始位置
        offset = contentW > visibleWidth ? maxOffset : 0;
        applyTransform();
    }
    
    // 解析Markdown
    parseMarkdown(text) {
        if (!text) return '';
        
        if (typeof marked !== 'undefined' && this.config.get('features.enableMarkdown')) {
            let html = marked.parse(text);
            html = html.replace(/<a href/g, '<a target="_blank" href');
            return html;
        }
        
        // 简单的文本处理
        return text.replace(/\n/g, '<br>');
    }
    
    // 创建时间轴项目
    createTimelineItem(item, index) {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.id = `timeline-item-${index}`;
        
        const isLongText = item.text && item.text.length > 250;
        const truncatedText = isLongText ? item.text.substring(0, 250) + '...' : item.text;
        
        const parsedText = this.parseMarkdown(item.text);
        const parsedTruncatedText = this.parseMarkdown(truncatedText);
        
        const evaluationHTML = item.evaluation ? `
            <div class="timeline-evaluation">
                <div class="timeline-evaluation-label">评价</div>
                <div class="timeline-evaluation-text">${this.parseMarkdown(item.evaluation)}</div>
            </div>
        ` : '';
        
        const detailsItems = [];
        if (item.modelSize && item.modelSize.trim()) {
            detailsItems.push(`<li><strong>模型规模：</strong>${item.modelSize}</li>`);
        }
        if (item.modelType && item.modelType.trim()) {
            detailsItems.push(`<li><strong>模型类型：</strong>${item.modelType}</li>`);
        }
        if (item.contextWindow && item.contextWindow.trim()) {
            detailsItems.push(`<li><strong>上下文窗口：</strong>${item.contextWindow}</li>`);
        }
        
        const detailsHTML = detailsItems.length > 0 ? `
            <div class="timeline-details">
                <ul>
                    ${detailsItems.join('')}
                </ul>
            </div>
        ` : '';
        
        const officialLinkHTML = (item.officialDoc && item.officialDoc.trim()) ?
            `<a href="${item.officialDoc}" target="_blank" class="timeline-link">官方文档</a>` : '';
        
        timelineItem.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <h3 class="timeline-title">${item.title}
                    ${typeof item.openSource === 'boolean' ? `
                        <span class="badge ${item.openSource ? 'badge-open' : 'badge-closed'}" title="${item.openSource ? '开源' : '闭源'}">${item.openSource ? '开源' : '闭源'}</span>
                    ` : ''}
                </h3>
                <div class="timeline-date">${item.date}</div>
                ${item.text ? `
                    <div class="timeline-text-container">
                        <div class="timeline-text ${isLongText ? 'text-truncated' : ''}" id="text-${index}">
                            ${isLongText ? parsedTruncatedText : parsedText}
                        </div>
                        ${isLongText ? `<button class="expand-btn" onclick="window.timelineCore.toggleText(${index})">显示更多</button>` : ''}
                    </div>
                ` : ''}
                ${evaluationHTML}
                ${detailsHTML}
                ${officialLinkHTML}
            </div>
        `;
        
        return timelineItem;
    }
    
    // 创建目录项
    createTocItem(item, index) {
        const tocItem = document.createElement('li');
        const displayOrder = (item && item.__displayIndex != null) ? item.__displayIndex : index;
        const realIndex = index;
        tocItem.innerHTML = `<a href="#timeline-item-${realIndex}" data-target="timeline-item-${realIndex}">${displayOrder + 1}. ${item.title}</a>`;
        return tocItem;
    }
    
    // 清空时间轴和目录
    clearTimelineAndToc() {
        const timelineContainer = document.getElementById('timeline');
        const tocList = document.getElementById('toc-list');
        if (timelineContainer) timelineContainer.innerHTML = '';
        if (tocList) tocList.innerHTML = '';
    }
    
    // 渲染时间轴项目
    renderTimelineItems(list) {
        const timelineContainer = document.getElementById('timeline');
        const tocList = document.getElementById('toc-list');
        if (!timelineContainer || !tocList) return;
        
        list.forEach((item, i) => {
            try {
                item.__displayIndex = i;
            } catch (_) {}
            const realIndex = (item && item.__idx != null) ? item.__idx : i;
            const timelineItem = this.createTimelineItem(item, realIndex);
            const tocItem = this.createTocItem(item, realIndex);
            timelineContainer.appendChild(timelineItem);
            tocList.appendChild(tocItem);
        });
        
        this.bindTocEvents();
    }
    
    // 绑定目录事件
    bindTocEvents() {
        document.querySelectorAll('.custom-toc a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                this.scrollToElement(targetId);
            });
        });
    }
    
    // 滚动到元素
    scrollToElement(targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            this.updateActiveTocItem(targetId);
        }
    }
    
    // 更新活跃目录项
    updateActiveTocItem(activeId) {
        const tocLinks = document.querySelectorAll('.custom-toc a');
        let activeLink = null;
        
        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === activeId) {
                link.classList.add('active');
                activeLink = link;
            }
        });
        
        if (activeLink) {
            this.scrollTocToActiveItem(activeLink);
        }
    }
    
    // 滚动目录到活跃项
    scrollTocToActiveItem(activeLink) {
        const tocContent = document.querySelector('.custom-toc-content');
        if (!tocContent || !activeLink) return;
        
        const linkTop = activeLink.offsetTop;
        const linkHeight = activeLink.offsetHeight;
        const tocHeight = tocContent.clientHeight;
        const tocScrollTop = tocContent.scrollTop;
        
        const targetScrollTop = linkTop - tocHeight / 3;
        
        const linkVisibleTop = linkTop - tocScrollTop;
        const linkVisibleBottom = linkVisibleTop + linkHeight;
        
        if (linkVisibleTop < 0 || linkVisibleBottom > tocHeight || linkVisibleTop < tocHeight / 4 || linkVisibleBottom > tocHeight * 3 / 4) {
            tocContent.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
            });
        }
    }
    
    // 切换文本展开/收起
    toggleText(index) {
        const textElement = document.getElementById(`text-${index}`);
        const button = textElement.nextElementSibling;
        const item = this.timelineData[index];
        
        if (textElement.classList.contains('text-truncated')) {
            textElement.innerHTML = this.parseMarkdown(item.text);
            textElement.classList.remove('text-truncated');
            button.textContent = '收起';
        } else {
            const truncatedText = item.text.substring(0, 250) + '...';
            textElement.innerHTML = this.parseMarkdown(truncatedText);
            textElement.classList.add('text-truncated');
            button.textContent = '显示更多';
        }
    }
    
    // 处理滚动事件
    handleScroll() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        
        let activeItem = null;
        timelineItems.forEach(item => {
            const itemTop = item.offsetTop;
            const itemBottom = itemTop + item.offsetHeight;
            
            if (scrollPosition >= itemTop && scrollPosition <= itemBottom) {
                activeItem = item.id;
            }
        });
        
        if (activeItem) {
            this.updateActiveTocItem(activeItem);
        }
    }
    
    // 类型选项
    TYPE_OPTIONS = [
        { key: 'lang', label: '语言', match: ['语言', '语言模型', '文本', 'LLM', 'language'] },
        { key: 'multi', label: '多模态', match: ['多模态', 'multimodal', '视频+图像+文本'] },
        { key: 'img', label: '图像', match: ['图像生成', '文生图', 'image'] },
        { key: 'video', label: '视频', match: ['视频生成', '文生视频', 'video'] },
        { key: 'code', label: '代码', match: ['代码', 'code', '编程'] },
        { key: 'voice', label: '语音', match: ['语音生成', '语音', '音频'] },
        { key: 'doc', label: '文档解析', match: ['文档', 'OCR', 'doc', '文档解析', '文档解析模型'] },
        { key: 'other', label: '其他', match: [] }
    ];
    
    // 尺寸选项
    SIZE_OPTIONS = [
        { label: '≤3B', type: 'lte', value: 3 },
        { label: '≤7B', type: 'lte', value: 7 },
        { label: '≤32B', type: 'lte', value: 32 },
        { label: '≤72B', type: 'lte', value: 72 },
        { label: '≤120B', type: 'lte', value: 120 },
        { label: '≤400B', type: 'lte', value: 400 },
        { label: '>400B', type: 'gt', value: 400 }
    ];
    
    // 渲染类型筛选
    renderTypeChips() {
        const wrap = document.getElementById('type-filter');
        if (!wrap) return;
        wrap.innerHTML = '';
        this.TYPE_OPTIONS.forEach(opt => {
            const span = document.createElement('span');
            span.className = 'type-chip';
            span.textContent = opt.label;
            span.dataset.key = opt.key;
            span.addEventListener('click', () => {
                const k = span.dataset.key;
                if (this.currentSelectedTypes.has(k)) {
                    this.currentSelectedTypes.delete(k);
                    span.classList.remove('selected');
                } else {
                    this.currentSelectedTypes.add(k);
                    span.classList.add('selected');
                }
                this.applyFilters();
            });
            wrap.appendChild(span);
        });
    }
    
    // 渲染尺寸选择器
    renderSizeSelect() {
        const host = document.getElementById('size-select-custom');
        if (!host) return;
        host.innerHTML = '';
        const label = document.createElement('div');
        label.textContent = this.currentSelectedSize ? 
            this.SIZE_OPTIONS.find(o => o.type === this.currentSelectedSize.type && o.value === this.currentSelectedSize.value)?.label || '参数量（全部）' : 
            '参数量（全部）';
        host.appendChild(label);
        const drop = document.createElement('div');
        drop.className = 'size-dropdown';
        this.SIZE_OPTIONS.forEach(opt => {
            const optDom = document.createElement('div');
            optDom.className = 'size-option' + (this.currentSelectedSize && this.currentSelectedSize.type === opt.type && this.currentSelectedSize.value === opt.value ? ' active' : '');
            optDom.textContent = opt.label;
            optDom.addEventListener('click', (e) => {
                e.stopPropagation();
                closeDrop();
                if (this.currentSelectedSize && this.currentSelectedSize.type === opt.type && this.currentSelectedSize.value === opt.value) {
                    this.currentSelectedSize = null;
                } else {
                    this.currentSelectedSize = { type: opt.type, value: opt.value };
                }
                this.applyFilters();
                this.renderSizeSelect();
            });
            drop.appendChild(optDom);
        });
        host.appendChild(drop);

        let onDocClick = null;
        const closeDrop = () => {
            host.classList.remove('open');
            drop.classList.remove('open');
            if (onDocClick) {
                document.removeEventListener('click', onDocClick, true);
                onDocClick = null;
            }
        };
        const toggle = (e) => {
            e.stopPropagation();
            const willOpen = !host.classList.contains('open');
            if (willOpen) {
                host.classList.add('open');
                drop.classList.add('open');
                onDocClick = (evt) => {
                    if (!host.contains(evt.target)) closeDrop();
                };
                document.addEventListener('click', onDocClick, true);
            } else {
                closeDrop();
            }
        };
        host.onclick = null;
        host.onkeydown = null;
        host.onclick = toggle;
        host.setAttribute('role', 'button');
        host.setAttribute('tabindex', '0');
        host.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle(e);
            }
        };
    }
    
    // 解析模型尺寸
    parseModelSizesToBList(modelSize) {
        if (!modelSize || typeof modelSize !== 'string') return [];
        const head = modelSize.split('(')[0];
        const parts = head.split(',');
        const result = [];
        const re = /([0-9]+(?:\.[0-9]+)?)\s*B/i;
        parts.forEach(p => {
            const m = p.match(re);
            if (m) {
                const v = parseFloat(m[1]);
                if (!isNaN(v)) result.push(v);
            }
        });
        return result;
    }
    
    // 检查项目是否匹配类型
    itemMatchesTypes(item) {
        if (this.currentSelectedTypes.size === 0) return true;
        const mt = (item.modelType || '').toLowerCase();
        let belongs = false;

        for (const opt of this.TYPE_OPTIONS) {
            if (!this.currentSelectedTypes.has(opt.key)) continue;
            if (opt.key === 'other') continue;
            if (opt.match.some(kw => mt.includes(kw.toLowerCase()))) {
                belongs = true;
                break;
            }
        }

        if (!belongs && this.currentSelectedTypes.has('other')) {
            const isKnown = this.TYPE_OPTIONS.some(opt => 
                opt.key !== 'other' && opt.match.some(kw => mt.includes(kw.toLowerCase()))
            );
            if (!isKnown || mt.trim() === '') return true;
        }

        return belongs;
    }
    
    // 检查项目是否匹配尺寸
    itemMatchesSize(item) {
        if (this.currentSelectedSize == null) return true;
        const sizes = this.parseModelSizesToBList(item.modelSize || '');
        if (sizes.length === 0) return false;
        
        if (this.currentSelectedSize.type === 'lte') {
            const idx = this.SIZE_OPTIONS.findIndex(o => o.type === 'lte' && o.value === this.currentSelectedSize.value);
            let lower = -Infinity;
            if (idx > 0) {
                for (let i = idx - 1; i >= 0; i--) {
                    if (this.SIZE_OPTIONS[i].type === 'lte') {
                        lower = this.SIZE_OPTIONS[i].value;
                        break;
                    }
                }
            }
            if (!isFinite(lower)) {
                return sizes.some(v => v <= this.currentSelectedSize.value);
            }
            return sizes.some(v => v > lower && v <= this.currentSelectedSize.value);
        } else if (this.currentSelectedSize.type === 'gt') {
            return sizes.some(v => v > this.currentSelectedSize.value);
        }
        return true;
    }
    
    // 应用筛选
    applyFilters() {
        const q = (this.currentFilterQuery || '').toLowerCase();
        const filtered = this.allTimelineData.filter(d => {
            const titleOk = !q || (d.title || '').toLowerCase().includes(q);
            const typeOk = this.itemMatchesTypes(d);
            const sizeOk = this.itemMatchesSize(d);
            return titleOk && typeOk && sizeOk;
        });
        this.currentChartData = filtered;
        this.renderReleaseTimelineChart(this.currentChartData);
        this.clearTimelineAndToc();
        this.renderTimelineItems(filtered);
        if (filtered.length > 0) {
            setTimeout(() => this.updateActiveTocItem(`timeline-item-${(filtered[0].__idx != null ? filtered[0].__idx : 0)}`), 200);
        }
    }
    
    // 按标题筛选
    filterAndRenderByTitle(query) {
        this.currentFilterQuery = query;
        this.applyFilters();
    }
    
    // 设置目录切换
    setupTocToggle() {
        const toggleBtn = document.getElementById('toggleToc');
        const toc = document.getElementById('custom-toc');
        const body = document.body;
        
        if (!toggleBtn || !toc) return;
        
        let tocVisible = this.config.get('layout.tocVisible');
        
        toggleBtn.addEventListener('click', () => {
            tocVisible = !tocVisible;
            
            if (tocVisible) {
                toc.style.display = 'flex';
                body.classList.remove('toc-hidden');
                toggleBtn.textContent = '📋 隐藏目录';
            } else {
                toc.style.display = 'none';
                body.classList.add('toc-hidden');
                toggleBtn.textContent = '📋 显示目录';
            }
        });
    }
    
    // 错误处理
    handleError(error) {
        const timelineContainer = document.getElementById('timeline');
        if (timelineContainer && this.config.get('errorHandling.showFallbackData')) {
            timelineContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #721c24; margin-bottom: 15px;">❌ ${this.config.get('errorHandling.fallbackMessage')}</h3>
                    <p style="color: #721c24; margin-bottom: 15px;">请检查网络连接或稍后重试。</p>
                </div>
            `;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelineCore;
} else {
    window.TimelineCore = TimelineCore;
}