#!/usr/bin/env node

/**
 * Vercel配置验证脚本
 * 验证vercel.json是否符合最新的Vercel规范
 */

const fs = require('fs');
const path = require('path');

// 颜色定义
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`);
}

function validateVercelConfig() {
  const configPath = path.join(process.cwd(), 'vercel.json');
  
  log('blue', 'Vercel配置验证开始...');
  
  // 检查文件是否存在
  if (!fs.existsSync(configPath)) {
    log('yellow', 'vercel.json文件不存在，将使用默认配置');
    return true;
  }
  
  try {
    // 读取并解析JSON
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    log('green', 'JSON格式验证通过');
    
    // 检查已弃用的属性
    const deprecatedProps = [];
    
    if (config.name) {
      deprecatedProps.push('name - 使用项目设置中的名称替代');
    }
    
    if (config.description) {
      deprecatedProps.push('description - 不再支持此属性');
    }
    
    if (config.alias) {
      deprecatedProps.push('alias - 使用domains替代');
    }
    
    if (config.scope) {
      deprecatedProps.push('scope - 使用团队设置替代');
    }
    
    // 报告已弃用的属性
    if (deprecatedProps.length > 0) {
      log('yellow', '发现已弃用的属性:');
      deprecatedProps.forEach(prop => {
        console.log(`  - ${prop}`);
      });
      return false;
    }
    
    // 验证必需的属性
    if (!config.version) {
      log('red', '缺少必需的version属性');
      return false;
    }
    
    if (config.version !== 2) {
      log('yellow', `建议使用version: 2，当前版本: ${config.version}`);
    }
    
    // 验证functions配置
    if (config.functions) {
      for (const [pattern, funcConfig] of Object.entries(config.functions)) {
        if (funcConfig.maxDuration && funcConfig.maxDuration > 300) {
          log('yellow', `函数${pattern}的maxDuration超过300秒，可能会产生额外费用`);
        }
      }
    }
    
    // 验证regions配置
    if (config.regions && Array.isArray(config.regions)) {
      const validRegions = [
        'iad1', 'cle1', 'pdx1', 'sfo1', 'lhr1', 'fra1', 'nrt1', 'sin1', 'syd1', 'bom1'
      ];
      
      const invalidRegions = config.regions.filter(region => !validRegions.includes(region));
      if (invalidRegions.length > 0) {
        log('yellow', `发现无效的regions: ${invalidRegions.join(', ')}`);
        log('blue', `有效的regions: ${validRegions.join(', ')}`);
      }
    }
    
    // 验证headers配置
    if (config.headers && Array.isArray(config.headers)) {
      config.headers.forEach((headerConfig, index) => {
        if (!headerConfig.source) {
          log('red', `headers[${index}]缺少source属性`);
          return false;
        }
        
        if (!headerConfig.headers || !Array.isArray(headerConfig.headers)) {
          log('red', `headers[${index}]缺少headers数组`);
          return false;
        }
      });
    }
    
    // 验证redirects配置
    if (config.redirects && Array.isArray(config.redirects)) {
      config.redirects.forEach((redirect, index) => {
        if (!redirect.source || !redirect.destination) {
          log('red', `redirects[${index}]缺少source或destination属性`);
          return false;
        }
      });
    }
    
    log('green', '✅ vercel.json配置验证通过');
    
    // 显示配置摘要
    console.log('\n📋 配置摘要:');
    console.log(`  版本: ${config.version}`);
    console.log(`  区域: ${config.regions ? config.regions.join(', ') : '默认'}`);
    console.log(`  函数配置: ${config.functions ? Object.keys(config.functions).length : 0}个`);
    console.log(`  头部配置: ${config.headers ? config.headers.length : 0}个`);
    console.log(`  重定向配置: ${config.redirects ? config.redirects.length : 0}个`);
    
    return true;
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      log('red', `JSON语法错误: ${error.message}`);
    } else {
      log('red', `验证失败: ${error.message}`);
    }
    return false;
  }
}

function generateValidConfig() {
  const validConfig = {
    "version": 2,
    "env": {
      "NODE_ENV": "production"
    },
    "build": {
      "env": {
        "NODE_ENV": "production"
      }
    },
    "regions": ["iad1"],
    "functions": {
      "app/api/**/*.ts": {
        "maxDuration": 30
      }
    },
    "headers": [
      {
        "source": "/api/(.*)",
        "headers": [
          {
            "key": "Access-Control-Allow-Origin",
            "value": "*"
          },
          {
            "key": "Access-Control-Allow-Methods",
            "value": "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            "key": "Access-Control-Allow-Headers",
            "value": "Content-Type, Authorization"
          },
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          }
        ]
      }
    ],
    "github": {
      "silent": true
    }
  };
  
  return JSON.stringify(validConfig, null, 2);
}

function main() {
  console.log('🔍 Vercel配置验证工具\n');
  
  const isValid = validateVercelConfig();
  
  if (!isValid) {
    console.log('\n🔧 建议的有效配置:');
    console.log(generateValidConfig());
    
    console.log('\n💡 修复建议:');
    console.log('1. 移除已弃用的属性 (name, description等)');
    console.log('2. 确保version设置为2');
    console.log('3. 检查regions、functions等配置的有效性');
    
    process.exit(1);
  }
  
  console.log('\n🎉 配置验证完成！');
}

if (require.main === module) {
  main();
}

module.exports = { validateVercelConfig, generateValidConfig };
