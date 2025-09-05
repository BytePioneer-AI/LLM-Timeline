// 时间轴配置管理
class TimelineConfig {
    constructor(options = {}) {
        // 默认配置
        this.config = {
            // 数据源配置
            dataSources: [
                'timeline-data.yaml'
            ],
            
            // 布局配置
            layout: {
                showTocToggle: false,
                tocVisible: true,
                leftMargin: 0, // 为左侧目录留出的空间
                enableTocAutoHide: true // 小屏幕自动隐藏目录
            },
            
            // 样式配置
            styles: {
                customCSS: '', // 额外的CSS样式
                themeClass: '' // 主题类名
            },
            
            // 功能配置
            features: {
                enableSearch: true,
                enableTypeFilter: true,
                enableSizeFilter: true,
                enableChart: true,
                enableMarkdown: true
            },
            
            // 错误处理配置
            errorHandling: {
                showFallbackData: true,
                fallbackMessage: '数据加载失败，请稍后重试'
            }
        };
        
        // 合并用户配置
        this.mergeConfig(options);
    }
    
    mergeConfig(options) {
        this.config = this.deepMerge(this.config, options);
    }
    
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
    
    get(path) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        
        return current;
    }
    
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.config);
        target[lastKey] = value;
    }
}

// 预定义配置
const TIMELINE_CONFIGS = {
    // 独立HTML版本配置
    standalone: {
        dataSources: [
            'timeline-data.yaml'
        ],
        layout: {
            showTocToggle: true,
            tocVisible: true,
            leftMargin: 290,
            enableTocAutoHide: true
        },
        styles: {
            customCSS: `
                /* 独立版本特殊样式 */
                body {
                    background-color: #edf3f8;
                    margin: 0;
                    padding: 0;
                }
                
                .custom-toc {
                    background: rgba(255, 255, 255, 0.95);
                }
                
                .release-chart-wrapper,
                .timeline-container {
                    margin-left: 290px;
                }
                
                h1 {
                    margin-left: 290px !important;
                }
                
                /* 目录隐藏时的样式 */
                body.toc-hidden .release-chart-wrapper,
                body.toc-hidden .timeline-container {
                    margin-left: auto;
                }
                
                body.toc-hidden h1 {
                    margin-left: 0 !important;
                }
                
                @media (max-width: 1200px) {
                    .release-chart-wrapper,
                    .timeline-container {
                        margin-left: auto;
                    }
                    
                    h1 {
                        margin-left: 0 !important;
                    }
                }
            `
        },
        features: {
            enableSearch: true,
            enableTypeFilter: true,
            enableSizeFilter: true,
            enableChart: true,
            enableMarkdown: true
        }
    },
    
    // 简化版本配置
    simple: {
        dataSources: [
            'timeline-data.yaml'
        ],
        layout: {
            showTocToggle: false,
            tocVisible: true,
            leftMargin: 0,
            enableTocAutoHide: true
        },
        features: {
            enableSearch: true,
            enableTypeFilter: true,
            enableSizeFilter: true,
            enableChart: true,
            enableMarkdown: true
        }
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimelineConfig, TIMELINE_CONFIGS };
} else {
    window.TimelineConfig = TimelineConfig;
    window.TIMELINE_CONFIGS = TIMELINE_CONFIGS;
}