#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

/**
 * YAML数据验证脚本
 * 验证timeline-data.yaml的格式和数据完整性
 */

const YAML_FILE = 'timeline-data.yaml';

// 数据验证规则
const VALIDATION_RULES = {
    date: {
        required: true,
        type: 'string',
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        description: '日期格式必须为YYYY-MM-DD'
    },
    title: {
        required: true,
        type: 'string',
        minLength: 1,
        description: '标题不能为空'
    },
    text: {
        required: true,
        type: 'string',
        minLength: 10,
        description: '描述文本至少10个字符'
    },
    modelSize: {
        required: false,
        type: 'string',
        description: '模型参数量信息'
    },
    modelType: {
        required: false,
        type: 'string',
        description: '模型类型'
    },
    openSource: {
        required: false,
        type: 'boolean',
        description: '是否开源'
    },
    contextWindow: {
        required: false,
        type: 'string',
        description: '上下文窗口大小'
    },
    officialDoc: {
        required: false,
        type: 'string',
        pattern: /^https?:\/\/.+/,
        description: '官方文档链接必须是有效的URL'
    },
    evaluation: {
        required: false,
        type: 'string',
        description: '评价内容'
    }
};

class ValidationReport {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.stats = {
            totalRecords: 0,
            validRecords: 0,
            invalidRecords: 0
        };
    }
    
    addError(recordIndex, field, message) {
        this.errors.push({
            record: recordIndex,
            field: field,
            message: message,
            type: 'error'
        });
    }
    
    addWarning(recordIndex, field, message) {
        this.warnings.push({
            record: recordIndex,
            field: field,
            message: message,
            type: 'warning'
        });
    }
    
    isValid() {
        return this.errors.length === 0;
    }
    
    generateReport() {
        const report = [];
        
        report.push('📊 YAML数据验证报告');
        report.push('='.repeat(50));
        report.push('');
        
        // 统计信息
        report.push('📈 统计信息:');
        report.push(`   总记录数: ${this.stats.totalRecords}`);
        report.push(`   有效记录: ${this.stats.validRecords}`);
        report.push(`   无效记录: ${this.stats.invalidRecords}`);
        report.push(`   验证通过率: ${((this.stats.validRecords / this.stats.totalRecords) * 100).toFixed(1)}%`);
        report.push('');
        
        // 错误信息
        if (this.errors.length > 0) {
            report.push('❌ 错误信息:');
            this.errors.forEach((error, index) => {
                report.push(`   ${index + 1}. 记录 #${error.record + 1} - ${error.field}: ${error.message}`);
            });
            report.push('');
        }
        
        // 警告信息
        if (this.warnings.length > 0) {
            report.push('⚠️  警告信息:');
            this.warnings.forEach((warning, index) => {
                report.push(`   ${index + 1}. 记录 #${warning.record + 1} - ${warning.field}: ${warning.message}`);
            });
            report.push('');
        }
        
        // 总结
        if (this.isValid()) {
            report.push('✅ 验证结果: 通过');
        } else {
            report.push('❌ 验证结果: 失败');
            report.push(`   发现 ${this.errors.length} 个错误，${this.warnings.length} 个警告`);
        }
        
        return report.join('\n');
    }
}

function validateField(value, fieldName, rules, recordIndex, report) {
    // 检查必填字段
    if (rules.required && (value === undefined || value === null || value === '')) {
        report.addError(recordIndex, fieldName, `必填字段缺失 (值: ${JSON.stringify(value)})`);
        return false;
    }
    
    // 如果字段为空且非必填，跳过后续验证
    if (!rules.required && (value === undefined || value === null || value === '')) {
        return true;
    }
    
    // 检查数据类型
    if (rules.type && typeof value !== rules.type) {
        report.addError(recordIndex, fieldName, `数据类型错误，期望 ${rules.type}，实际 ${typeof value}`);
        return false;
    }
    
    // 检查字符串长度
    if (rules.type === 'string' && rules.minLength && value.length < rules.minLength) {
        report.addError(recordIndex, fieldName, `字符串长度不足，最少需要 ${rules.minLength} 个字符`);
        return false;
    }
    
    // 检查正则表达式
    if (rules.pattern && !rules.pattern.test(value)) {
        report.addError(recordIndex, fieldName, rules.description || '格式不正确');
        return false;
    }
    
    return true;
}

function validateRecord(record, recordIndex, report) {
    let isValid = true;
    
    // 检查记录是否为对象
    if (typeof record !== 'object' || record === null) {
        report.addError(recordIndex, 'record', '记录必须是对象类型');
        return false;
    }
    
    // 验证每个字段
    for (const [fieldName, rules] of Object.entries(VALIDATION_RULES)) {
        const fieldValid = validateField(record[fieldName], fieldName, rules, recordIndex, report);
        if (!fieldValid) {
            isValid = false;
        }
    }
    
    // 检查未知字段
    const knownFields = Object.keys(VALIDATION_RULES);
    const recordFields = Object.keys(record);
    const unknownFields = recordFields.filter(field => !knownFields.includes(field));
    
    if (unknownFields.length > 0) {
        unknownFields.forEach(field => {
            report.addWarning(recordIndex, field, '未知字段，可能需要添加到验证规则中');
        });
    }
    
    return isValid;
}

function validateYamlData(data) {
    const report = new ValidationReport();
    
    // 检查数据是否为数组
    if (!Array.isArray(data)) {
        report.addError(0, 'root', 'YAML数据必须是数组格式');
        return report;
    }
    
    report.stats.totalRecords = data.length;
    
    // 验证每条记录
    data.forEach((record, index) => {
        const isValid = validateRecord(record, index, report);
        if (isValid) {
            report.stats.validRecords++;
        } else {
            report.stats.invalidRecords++;
        }
    });
    
    return report;
}

function validateYamlSyntax(content) {
    try {
        const data = yaml.load(content);
        return { valid: true, data: data };
    } catch (error) {
        return {
            valid: false,
            error: {
                message: error.message,
                line: error.mark ? error.mark.line + 1 : null,
                column: error.mark ? error.mark.column + 1 : null
            }
        };
    }
}

function main() {
    try {
        console.log('🔍 开始YAML数据验证...');
        
        // 检查文件是否存在
        if (!fs.existsSync(YAML_FILE)) {
            throw new Error(`YAML文件 ${YAML_FILE} 不存在`);
        }
        
        // 读取YAML文件
        console.log(`📖 读取文件: ${YAML_FILE}`);
        const yamlContent = fs.readFileSync(YAML_FILE, 'utf8');
        
        // 验证YAML语法
        console.log('🔧 验证YAML语法...');
        const syntaxResult = validateYamlSyntax(yamlContent);
        
        if (!syntaxResult.valid) {
            console.error('❌ YAML语法错误:');
            console.error(`   错误信息: ${syntaxResult.error.message}`);
            if (syntaxResult.error.line) {
                console.error(`   位置: 第 ${syntaxResult.error.line} 行，第 ${syntaxResult.error.column} 列`);
            }
            process.exit(1);
        }
        
        console.log('✅ YAML语法验证通过');
        
        // 验证数据内容
        console.log('🔍 验证数据内容...');
        const validationReport = validateYamlData(syntaxResult.data);
        
        // 生成并显示报告
        const reportContent = validationReport.generateReport();
        console.log('\n' + reportContent);
        
        // 保存验证报告
        const reportFile = 'validation-report.txt';
        fs.writeFileSync(reportFile, reportContent, 'utf8');
        console.log(`\n📄 验证报告已保存到: ${reportFile}`);
        
        // 根据验证结果设置退出码
        if (!validationReport.isValid()) {
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ 验证失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { validateYamlData, validateYamlSyntax, VALIDATION_RULES };