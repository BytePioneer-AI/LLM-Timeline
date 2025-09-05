# 🚀 大模型发布时间轴

专注于收录和展示全球重要AI大模型发布信息的开源项目，为AI研究者和开发者提供最新的模型动态。

## 🌐 在线访问

**[立即查看时间轴](https://bytepioneer-ai.github.io/LLM-Timeline/)**

## 📊 数据源

- **数据源**: [BytePioneer-AI/LLM-Timeline](https://github.com/BytePioneer-AI/LLM-Timeline/blob/main/timeline-data.json)

## 🤝 贡献

欢迎提交新模型信息或改进建议！

**如何贡献：**
1. 在 [timeline-data.json](https://github.com/BytePioneer-AI/LLM-Timeline/blob/main/timeline-data.json) 中添加新模型信息
2. 提交 Pull Request

**完整示例：**
```json
{
    "date": "2025-09-05",
    "title": "⭐智谱 GLM-4.5V",
    "text": "**摘要：** 智谱AI发布的旗舰级开源多模态模型...\n\n**模型规格与架构：**\n- **参数量：** 106B总参数，12B激活参数\n- **架构/范式：** 采用MoE架构...",
    "modelSize": "106B (激活 12B)",
    "modelType": "多模态",
    "openSource": true,
    "contextWindow": "128K",
    "officialDoc": "https://github.com/zai-org/GLM-V",
    "evaluation": "曾经的国产之光，智谱好像回来了。"
}
```

**模型信息格式：**

| 字段 | 类型 | 必填 | 格式要求 | 示例 |
|------|------|------|----------|------|
| `date` | 字符串 | ✅ | YYYY-MM-DD 格式 | `"2025-09-05"` |
| `title` | 字符串 | ✅ | 模型名称，可包含 ⭐ 标记重要模型 | `"⭐OpenAI GPT-5"` |
| `text` | 字符串 | ✅ | 详细描述，支持 Markdown 语法 |  |
| `modelSize` | 字符串 | ❌ | 参数量信息 | `"8B"`, `"560B (激活 27B)"` |
| `modelType` | 字符串 | ❌ | 模型类型，多个类型用逗号分隔 | `"多模态"`, `"语言, 代码"` |
| `openSource` | 布尔值 | ❌ | 是否开源 | `true`, `false` |
| `contextWindow` | 字符串 | ❌ | 上下文窗口长度 | `"128K"`, `"32K"`, `""` |
| `officialDoc` | 字符串 | ❌ | 官方文档链接 | `"https://github.com/..."` |
| `evaluation` | 字符串 | ❌ | 评价内容，支持 Markdown | `"实测效果不错"` |

## 📄 许可证

[MIT License](LICENSE)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个Star！**

</div>