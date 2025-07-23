#!/usr/bin/env node

/**
 * 数据库连接测试工具
 * 帮助验证DATABASE_URL格式和连接
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function validateDatabaseUrl(url) {
  const issues = [];
  const suggestions = [];

  if (!url) {
    issues.push('❌ DATABASE_URL is empty');
    suggestions.push('Provide a valid PostgreSQL connection string');
    return { valid: false, issues, suggestions };
  }

  // 检查基本格式
  if (!url.startsWith('postgresql://')) {
    issues.push('❌ URL should start with postgresql://');
    suggestions.push('Use format: postgresql://user:password@host:port/database');
  }

  // 检查Supabase特定格式
  const supabasePattern = /postgresql:\/\/postgres\.([a-z0-9]+):(.+)@aws-0-([a-z0-9-]+)\.pooler\.supabase\.com:6543\/postgres/;
  const match = url.match(supabasePattern);

  if (!match) {
    issues.push('❌ Not a valid Supabase connection string format');
    suggestions.push('Expected format: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres');
    suggestions.push('Get the correct format from Supabase Dashboard → Settings → Database → Connection string');
  } else {
    const [, projectRef, password, region] = match;
    
    console.log('✅ Valid Supabase connection string format detected:');
    console.log(`   Project Reference: ${projectRef}`);
    console.log(`   Password Length: ${password.length} characters`);
    console.log(`   Region: ${region}`);
    
    if (projectRef !== 'pjnqbsnmrfhkyhoqfekv') {
      issues.push(`❌ Project reference mismatch. Expected: pjnqbsnmrfhkyhoqfekv, Got: ${projectRef}`);
    }
    
    if (password.length < 8) {
      issues.push('❌ Password seems too short');
      suggestions.push('Verify your database password in Supabase Dashboard');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
    parsed: match ? {
      projectRef: match[1],
      passwordLength: match[2].length,
      region: match[3]
    } : null
  };
}

async function main() {
  console.log('🔍 Supabase数据库连接验证工具\n');
  
  console.log('当前问题: "Tenant or user not found" 错误');
  console.log('这通常表示DATABASE_URL格式不正确或凭据错误\n');
  
  const databaseUrl = await askQuestion('请输入你的DATABASE_URL: ');
  
  console.log('\n📋 验证结果:');
  console.log('=' .repeat(50));
  
  const validation = validateDatabaseUrl(databaseUrl);
  
  if (validation.valid) {
    console.log('✅ 连接字符串格式正确!');
    if (validation.parsed) {
      console.log('\n📊 连接信息:');
      console.log(`   项目: ${validation.parsed.projectRef}`);
      console.log(`   密码长度: ${validation.parsed.passwordLength} 字符`);
      console.log(`   区域: ${validation.parsed.region}`);
    }
  } else {
    console.log('❌ 发现问题:');
    validation.issues.forEach(issue => console.log(`   ${issue}`));
    
    console.log('\n🔧 修复建议:');
    validation.suggestions.forEach(suggestion => console.log(`   ${suggestion}`));
  }
  
  console.log('\n📋 正确的Supabase连接字符串格式:');
  console.log('postgresql://postgres.pjnqbsnmrfhkyhoqfekv:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
  
  console.log('\n🔍 获取正确连接字符串的步骤:');
  console.log('1. 访问 https://supabase.com/dashboard');
  console.log('2. 选择项目 pjnqbsnmrfhkyhoqfekv');
  console.log('3. 点击 Settings → Database');
  console.log('4. 滚动到 "Connection string" 部分');
  console.log('5. 复制 "URI" 格式的连接字符串');
  console.log('6. 确保密码正确（如果忘记可以重置）');
  
  console.log('\n🚀 更新Vercel环境变量:');
  console.log('1. 访问 https://vercel.com/dashboard');
  console.log('2. 选择 KD Family 项目');
  console.log('3. Settings → Environment Variables');
  console.log('4. 更新 DATABASE_URL');
  console.log('5. 重新部署应用');
  
  rl.close();
}

main().catch(console.error);
