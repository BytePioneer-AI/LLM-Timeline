# 🚀 大模型发布时间轴 | AI Model Timeline

> 📊 **实时追踪全球大模型发布动态** | 专业评测 | 开源友好 | 社区驱动

[![GitHub stars](https://img.shields.io/github/stars/your-username/ai-model-timeline?style=social)](https://github.com/your-username/ai-model-timeline)
[![Last Update](https://img.shields.io/badge/最后更新-2025年9月-brightgreen)](https://github.com/BytePioneer-AI/LLM-Timeline)
[![Models Count](https://img.shields.io/badge/收录模型-50+-blue)](https://github.com/BytePioneer-AI/LLM-Timeline/blob/main/timeline-data.json)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 项目简介

**大模型发布时间轴**是一个专注于实时跟踪和记录全球重要AI大模型发布信息的开源项目。我们致力于为AI研究者、开发者和爱好者提供最新、最全面的大模型发布动态。

### ✨ 核心特色

- 🔄 **实时更新** - 第一时间收录最新发布的重要大模型
- 📈 **专业评测** - 深度分析模型性能、优劣势和适用场景  
- 🎨 **可视化展示** - 直观的时间轴界面，支持多维度筛选
- 🌍 **全球覆盖** - 涵盖国内外主流AI公司和研究机构
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🔍 **智能搜索** - 支持模型名称、公司、类型等多维度搜索

## 🎪 在线体验

🌐 **[立即访问时间轴](https://your-username.github.io/ai-model-timeline)**

## 📊 数据源与覆盖

### 🔗 数据源
- **主数据源**: [BytePioneer-AI/LLM-Timeline](https://github.com/BytePioneer-AI/LLM-Timeline/blob/main/timeline-data.json)
- **本地备份**: `./timeline-data.json`
- **自动切换**: 优先使用在线数据源，失败时自动切换到本地备份

### 🏢 收录机构
- **国外**: OpenAI、Google、Meta、Anthropic、Microsoft等
- **国内**: 阿里巴巴、腾讯、百度、字节跳动、智谱AI、月之暗面、面壁智能等

### 🤖 模型类型
- 💬 **语言模型** - GPT系列、Claude、Qwen、GLM等
- 🖼️ **多模态模型** - GPT-4V、Gemini、Qwen-VL等  
- 🎨 **图像生成** - DALL-E、Midjourney、通义万相等
- 🎵 **音频模型** - Whisper、MusicGen等
- 🧬 **科学模型** - AlphaFold、ESM等

### 📈 数据维度
- 📅 发布时间
- 🔢 参数规模  
- 🏷️ 模型类型
- 🔓 开源状态
- 📏 上下文长度
- 🎯 性能评测
- 💡 技术亮点
- ⚡ 优劣势分析

## 🚀 快速开始

### 本地运行

```bash
# 克隆项目
git clone https://github.com/your-username/ai-model-timeline.git
cd ai-model-timeline

# 启动本地服务器（推荐）
python -m http.server 8000
# 或使用 Node.js
npx serve .

# 访问 http://localhost:8000
```

### 直接使用

也可以直接打开 `index.html` 文件在浏览器中查看。

## 🔄 数据更新机制

### 📡 自动数据同步

项目采用**双重数据源**策略确保数据的实时性和可靠性：

1. **🌐 在线数据源** - 从 [BytePioneer-AI/LLM-Timeline](https://github.com/BytePioneer-AI/LLM-Timeline) 实时获取最新数据
2. **💾 本地备份** - 本地 `timeline-data.json` 作为备份数据源
3. **🔄 智能切换** - 在线数据源不可用时自动切换到本地备份

### ⚡ 更新优先级

- ⭐ **P0 - 顶级模型**: GPT、Claude、Gemini等旗舰模型 (24小时内)
- 🔥 **P1 - 重要开源**: Qwen、GLM、DeepSeek等主流开源模型 (48小时内)
- 📈 **P2 - 创新突破**: 技术创新或性能突破的模型 (72小时内)
- 🎯 **P3 - 垂直领域**: 特定领域的专业模型 (1周内)

## 🤝 贡献指南

我们欢迎社区贡献！你可以通过以下方式参与：

### 📢 提交新模型信息

1. **Fork** 本项目
2. 在 `timeline-data.json` 中添加新模型信息
3. 提交 **Pull Request**

### 📋 模型信息格式

```json
{
    "date": "2025-09-05",
    "title": "模型名称",
    "text": "**摘要：** 模型简介...\n\n**模型规格与架构：**\n...",
    "modelSize": "参数量",
    "modelType": "模型类型",
    "openSource": true/false,
    "contextWindow": "上下文长度",
    "officialDoc": "官方文档链接",
    "evaluation": "社区评价（可选）"
}
```

### 🐛 问题反馈

- 发现数据错误？[提交 Issue](https://github.com/your-username/ai-model-timeline/issues)
- 建议新功能？[参与讨论](https://github.com/your-username/ai-model-timeline/discussions)

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **数据**: JSON格式存储，支持在线/本地双重数据源
- **依赖**: marked.js (Markdown渲染)
- **部署**: GitHub Pages / 静态托管

## 📈 项目统计

- 📊 **收录模型**: 50+ 个重要模型
- 🏢 **覆盖机构**: 20+ 家AI公司/研究机构  
- 📅 **时间跨度**: 2024年至今
- 🔄 **更新频率**: 实时同步主数据源

## 🎖️ 致谢

感谢所有为项目贡献的开发者和AI社区的支持！

特别感谢：
- [BytePioneer-AI/LLM-Timeline](https://github.com/BytePioneer-AI/LLM-Timeline) 提供数据源
- 各AI公司官方发布
- Hugging Face Model Hub
- arXiv论文库
- AI社区评测报告

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

## 🔗 相关链接

- 📚 [项目文档](https://github.com/your-username/ai-model-timeline/wiki)
- 💬 [社区讨论](https://github.com/your-username/ai-model-timeline/discussions)  
- 🐛 [问题反馈](https://github.com/your-username/ai-model-timeline/issues)
- 📊 [在线数据源](https://github.com/BytePioneer-AI/LLM-Timeline/blob/main/timeline-data.json)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

Made with ❤️ by AI Community

</div>